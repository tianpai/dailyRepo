import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Keywords } from '@/database/schemas/keywords.schema';
import { WeeklyTopicFindings } from '@/database/schemas/weekly-topics.schema';
import { Repo } from '@/database/schemas/repo.schema';
import { ClusteringService } from './clustering.service';
import { filterLanguage } from '@/common/utils/language-filter.util';
import {
  getCurrentWeekDateRangeUTC,
  getCurrentWeekNumber,
} from '@/common/utils/date.util';
import {
  latestRepoTopicsPipeline,
  topicLangPipeline,
} from '@/common/utils/db-pipelines.util';

interface KeywordAnalysisOutput {
  originalTopicsCount?: number;
  topKeywords: string[];
  related: Record<string, string[]>;
  clusterSizes: Record<string, number>;
}

interface AggregatedRepoTopics {
  _id: string;
  fullName: string;
  language: Record<string, number>;
  topics: string[];
}

interface LatestRepoTopicsResult {
  topics: string[];
}

interface RepoMainLanguageTopic {
  fullname: string;
  main_language: string;
  topics: string[];
}

interface LanguageClusterMap {
  [language: string]: { [cluster: string]: number };
}

const MIN_TOPICS_FOR_CLUSTERING = 20;
const WEEKLY_CLUSTER_BATCH_SIZE = 4;
const WEEKLY_CLUSTER_CONCURRENCY = 3;

interface GroupTopicsByLanguageOptions {
  force?: boolean;
}

@Injectable()
export class KeywordService {
  private readonly logger = new Logger(KeywordService.name);

  constructor(
    @InjectModel(Keywords.name) private keywordsModel: Model<Keywords>,
    @InjectModel(WeeklyTopicFindings.name)
    private weeklyTopicFindingsModel: Model<WeeklyTopicFindings>,
    @InjectModel(Repo.name) private repoModel: Model<Repo>,
    private clusteringService: ClusteringService,
  ) {}

  async fetchKeywordAnalysis(
    today: string,
    includeRelated = true,
  ): Promise<KeywordAnalysisOutput> {
    const dbResult = await this.keywordsModel
      .findOne({ date: today })
      .sort({ date: -1 });

    if (dbResult) {
      const analysis = dbResult.analysis;

      const result: KeywordAnalysisOutput = {
        originalTopicsCount: analysis.originalTopicsCount,
        topKeywords: analysis.topKeywords,
        related:
          analysis.related instanceof Map
            ? Object.fromEntries(analysis.related)
            : analysis.related,
        clusterSizes:
          analysis.clusterSizes instanceof Map
            ? Object.fromEntries(analysis.clusterSizes)
            : analysis.clusterSizes,
      };

      if (!includeRelated) {
        result.related = {};
      }

      return result;
    }

    this.logger.debug('No cached keyword data, fetching from HuggingFace');

    const repoTopicsResult =
      await this.repoModel.aggregate<LatestRepoTopicsResult>(
        latestRepoTopicsPipeline,
      );
    const allTopics: string[] = repoTopicsResult[0]?.topics || [];
    const topics: string[] = filterLanguage(allTopics);

    if (topics.length === 0) {
      return {
        topKeywords: [],
        related: {},
        clusterSizes: {},
      };
    }

    const keywordData = await this.clusteringService.clusterTopics({
      topics,
      topN: 15,
      includeRelated,
      distance_threshold: 0.25,
      includeClusterSizes: true,
      batchSize: 64,
    });

    if (!includeRelated) {
      keywordData.related = {};
    }

    try {
      await this.keywordsModel.findOneAndUpdate(
        { date: today },
        { $set: { analysis: keywordData } },
        { upsert: true, new: true },
      );
      this.logger.debug('Saved keyword analysis to database');
    } catch (dbError) {
      this.logger.error('Error saving keywords to database', dbError);
    }

    return keywordData;
  }

  async fetchKeywordAnalysisByDate(
    date: string,
  ): Promise<KeywordAnalysisOutput> {
    const dbResult = await this.keywordsModel
      .findOne({ date })
      .sort({ date: -1 });

    if (dbResult) {
      const analysis = dbResult.analysis;
      return {
        originalTopicsCount: analysis.originalTopicsCount,
        topKeywords: analysis.topKeywords,
        related:
          analysis.related instanceof Map
            ? Object.fromEntries(analysis.related)
            : analysis.related,
        clusterSizes:
          analysis.clusterSizes instanceof Map
            ? Object.fromEntries(analysis.clusterSizes)
            : analysis.clusterSizes,
      };
    }

    return {
      topKeywords: [],
      related: {},
      clusterSizes: {},
    };
  }

  async groupTopicsByLanguage(
    options: GroupTopicsByLanguageOptions = {},
  ): Promise<LanguageClusterMap> {
    const { year, week } = getCurrentWeekNumber();
    const force = options.force === true;

    const existingFindings = await this.weeklyTopicFindingsModel.findOne({
      year,
      week,
    });

    if (
      existingFindings &&
      !this.isLanguageTopicMapEmpty(existingFindings.languageTopicMap)
    ) {
      this.logger.debug(`Found cached data for week ${year}-W${week}`);
      return existingFindings.languageTopicMap;
    }

    if (!force) {
      const fallback = await this.getLatestNonEmptyWeeklyTopics();
      if (fallback) {
        this.logger.debug(
          `Using fallback weekly topics from ${fallback.year}-W${fallback.week}`,
        );
        return fallback.languageTopicMap;
      }
    }

    this.logger.debug(
      `No cached data found, computing new data for week ${year}-W${week}`,
    );

    const languageTopicMap = await this.sanitizeTopicLangMap();

    if (this.isLanguageTopicMapEmpty(languageTopicMap)) {
      this.logger.warn(
        `Weekly topic map empty for ${year}-W${week}, skipping save`,
      );
      const fallback = await this.getLatestNonEmptyWeeklyTopics();
      if (fallback) {
        this.logger.warn(
          `Using fallback weekly topics from ${fallback.year}-W${fallback.week}`,
        );
        return fallback.languageTopicMap;
      }
      return languageTopicMap;
    }

    try {
      await this.weeklyTopicFindingsModel.findOneAndUpdate(
        { year, week },
        { $set: { languageTopicMap } },
        { upsert: true, new: true },
      );
      this.logger.debug('Saved weekly topic findings to database');
    } catch (error) {
      this.logger.error('Failed to save weekly topic findings', error);
    }

    return languageTopicMap;
  }

  private async sanitizeTopicLangMap(): Promise<LanguageClusterMap> {
    const repos = await this.getTopicsLanguage();
    const langTopicMap: LanguageClusterMap = {};

    if (!repos.length) {
      return langTopicMap;
    }

    const topicsByLanguage = new Map<string, string[]>();

    for (const repo of repos) {
      const lang = repo.main_language;
      if (!lang) continue;

      const filteredTopics = filterLanguage(repo.topics || []);
      if (filteredTopics.length === 0) continue;

      const existing = topicsByLanguage.get(lang);
      if (existing) {
        existing.push(...filteredTopics);
      } else {
        topicsByLanguage.set(lang, [...filteredTopics]);
      }
    }

    const entries = Array.from(topicsByLanguage.entries());
    const fallbackLanguages: Array<{ language: string; reason: string }> = [];
    const clusteredLanguages: string[] = [];
    const concurrency = WEEKLY_CLUSTER_CONCURRENCY;
    let cursor = 0;

    const workers = Array.from(
      { length: Math.min(concurrency, entries.length) },
      async () => {
        while (cursor < entries.length) {
          const [lang, topics] = entries[cursor];
          cursor += 1;
          await this.processLanguageTopics(
            lang,
            topics,
            langTopicMap,
            fallbackLanguages,
            clusteredLanguages,
          );
        }
      },
    );

    await Promise.all(workers);

    if (fallbackLanguages.length > 0) {
      const byReason = fallbackLanguages.reduce<Record<string, string[]>>(
        (acc, { language, reason }) => {
          if (!acc[reason]) acc[reason] = [];
          acc[reason].push(language);
          return acc;
        },
        {},
      );

      for (const [reason, languages] of Object.entries(byReason)) {
        this.logger.warn(
          `Raw count fallback (${reason}): ${languages.join(', ')}`,
        );
      }
    }

    this.logger.debug(
      `Weekly topics summary: clustered=${clusteredLanguages.length}, rawFallback=${fallbackLanguages.length}`,
    );

    const filteredAndSortedMap = this.filterAndSortClusters(langTopicMap);
    return this.filterLanguagesByTopicCount(filteredAndSortedMap);
  }

  private async getTopicsLanguage(): Promise<RepoMainLanguageTopic[]> {
    const { start, end } = getCurrentWeekDateRangeUTC();
    this.logger.debug(
      `Filtering weekly topics by trendingDate: ${start} to ${end}`,
    );
    const weeklyTrendingMatch = {
      $match: {
        trendingDate: { $gte: start, $lte: end },
      },
    };
    const repos: AggregatedRepoTopics[] =
      await this.repoModel.aggregate<AggregatedRepoTopics>([
        weeklyTrendingMatch,
        ...topicLangPipeline,
      ]);
    return repos
      .map((repo) => {
        let mainLanguage = 'Unknown';
        let maxCount = 0;

        for (const [lang, count] of Object.entries(repo.language)) {
          if (count > maxCount) {
            maxCount = count;
            mainLanguage = lang;
          }
        }

        return {
          fullname: repo.fullName,
          main_language: mainLanguage,
          topics: repo.topics,
        };
      })
      .filter((repo) => repo.main_language !== 'Unknown');
  }

  private async clusterTopicsForLanguage(
    language: string,
    topics: string[],
  ): Promise<{ [cluster: string]: number } | null> {
    try {
      this.logger.debug(
        `Clustering ${topics.length} topics for ${language} with HuggingFace`,
      );
      const hfResult = await this.clusteringService.clusterTopics({
        topics,
        topN: 50,
        includeRelated: true,
        distance_threshold: 0.35,
        includeClusterSizes: true,
        batchSize: WEEKLY_CLUSTER_BATCH_SIZE,
      });

      this.logger.debug(`Successfully clustered topics for ${language}`);
      return hfResult.clusterSizes;
    } catch (error) {
      this.logger.error(
        `HuggingFace clustering failed for ${language}`,
        error,
      );
      return null;
    }
  }

  private async processLanguageTopics(
    language: string,
    topics: string[],
    langTopicMap: LanguageClusterMap,
    fallbackLanguages: Array<{ language: string; reason: string }>,
    clusteredLanguages: string[],
  ) {
    if (topics.length < MIN_TOPICS_FOR_CLUSTERING) {
      langTopicMap[language] = this.buildRawTopicCountMap(topics);
      fallbackLanguages.push({
        language,
        reason: `topics<${MIN_TOPICS_FOR_CLUSTERING}`,
      });
      return;
    }

    const clustered = await this.clusterTopicsForLanguage(language, topics);
    if (clustered) {
      langTopicMap[language] = clustered;
      clusteredLanguages.push(language);
      return;
    }

    this.logger.warn(
      `Falling back to raw topic counts for ${language} (no clustering)`,
    );
    langTopicMap[language] = this.buildRawTopicCountMap(topics);
    fallbackLanguages.push({ language, reason: 'hf-timeout' });
  }

  private buildRawTopicCountMap(topics: string[]): { [topic: string]: number } {
    const counts: { [topic: string]: number } = {};
    for (const topic of topics) {
      if (!topic) continue;
      const key = topic.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  private filterAndSortClusters(
    langTopicMap: LanguageClusterMap,
  ): LanguageClusterMap {
    const filteredLangTopicMap: LanguageClusterMap = {};
    for (const [lang, clusters] of Object.entries(langTopicMap)) {
      if (Object.keys(clusters).length > 0) {
        const sortedClusters = Object.entries(clusters)
          .sort(([, a], [, b]) => b - a)
          .reduce(
            (acc, [cluster, count]) => {
              acc[cluster] = count;
              return acc;
            },
            {} as { [cluster: string]: number },
          );

        filteredLangTopicMap[lang] = sortedClusters;
      }
    }
    return filteredLangTopicMap;
  }

  private filterLanguagesByTopicCount(
    langTopicMap: LanguageClusterMap,
    minTopics: number = 3,
  ): LanguageClusterMap {
    const finalLangTopicMap: LanguageClusterMap = {};
    for (const [lang, clusters] of Object.entries(langTopicMap)) {
      const totalTopics = Object.values(clusters).reduce(
        (sum, count) => sum + count,
        0,
      );
      if (totalTopics >= minTopics) {
        finalLangTopicMap[lang] = clusters;
      }
    }
    return finalLangTopicMap;
  }

  private isLanguageTopicMapEmpty(map: LanguageClusterMap | null | undefined) {
    return !map || Object.keys(map).length === 0;
  }

  private async getLatestNonEmptyWeeklyTopics() {
    return this.weeklyTopicFindingsModel
      .findOne({
        $expr: {
          $gt: [
            {
              $size: {
                $objectToArray: {
                  $ifNull: ['$languageTopicMap', {}],
                },
              },
            },
            0,
          ],
        },
      })
      .sort({ year: -1, week: -1 });
  }
}
