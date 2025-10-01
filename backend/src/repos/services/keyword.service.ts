import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Keywords } from '../../database/schemas/keywords.schema';
import { WeeklyTopicFindings } from '../../database/schemas/weekly-topics.schema';
import { Repo } from '../../database/schemas/repo.schema';
import { ClusteringService } from './clustering.service';
import { filterLanguage } from '../../common/utils/language-filter.util';
import { getCurrentWeekNumber } from '../../common/utils/date.util';
import {
  latestRepoTopicsPipeline,
  topicLangPipeline,
} from '../../common/utils/db-pipelines.util';

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

  async groupTopicsByLanguage(): Promise<LanguageClusterMap> {
    const { year, week } = getCurrentWeekNumber();

    const existingFindings = await this.weeklyTopicFindingsModel.findOne({
      year,
      week,
    });

    if (existingFindings) {
      this.logger.debug(`Found cached data for week ${year}-W${week}`);
      return existingFindings.languageTopicMap;
    }

    this.logger.debug(
      `No cached data found, computing new data for week ${year}-W${week}`,
    );

    const languageTopicMap = await this.sanitizeTopicLangMap();

    try {
      await this.weeklyTopicFindingsModel.create({
        year,
        week,
        languageTopicMap,
      });
      this.logger.debug('Saved weekly topic findings to database');
    } catch (error) {
      this.logger.error('Failed to save weekly topic findings', error);
    }

    return languageTopicMap;
  }

  private async sanitizeTopicLangMap(): Promise<LanguageClusterMap> {
    const repos = await this.getTopicsLanguage();
    const allTopics = await this.getAllTopics();
    const clusteredTopics = await this.clusterTopicsWithHF(allTopics);
    const langTopicMap: LanguageClusterMap = {};

    if (!clusteredTopics) {
      return langTopicMap;
    }

    for (const repo of repos) {
      const lang = repo.main_language;

      if (!langTopicMap[lang]) {
        langTopicMap[lang] = {};
      }

      for (const topic of repo.topics) {
        const cluster = this.findCluster(topic, clusteredTopics);
        if (cluster) {
          if (!langTopicMap[lang][cluster]) {
            langTopicMap[lang][cluster] = 0;
          }
          langTopicMap[lang][cluster] += 1;
        }
      }
    }

    const filteredAndSortedMap = this.filterAndSortClusters(langTopicMap);
    const finalMap = this.filterLanguagesByTopicCount(filteredAndSortedMap);

    return finalMap;
  }

  private async getTopicsLanguage(): Promise<RepoMainLanguageTopic[]> {
    const repos: AggregatedRepoTopics[] =
      await this.repoModel.aggregate<AggregatedRepoTopics>(topicLangPipeline);
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

  private async getAllTopics(): Promise<string[]> {
    const repos = await this.getTopicsLanguage();
    let topics: string[] = [];

    for (const repo of repos) {
      topics.push(...repo.topics);
    }

    topics = filterLanguage(topics);

    return topics;
  }

  private async clusterTopicsWithHF(
    allTopics: string[],
  ): Promise<KeywordAnalysisOutput | null> {
    try {
      this.logger.debug('Using HuggingFace clustering for topic-language map');
      const hfResult = await this.clusteringService.clusterTopics({
        topics: allTopics,
        topN: 100,
        includeRelated: true,
        distance_threshold: 0.35,
        includeClusterSizes: true,
        batchSize: 64,
      });

      this.logger.debug('Successfully used HuggingFace clustering');
      return hfResult;
    } catch (error) {
      this.logger.error('HuggingFace clustering failed', error);
      return null;
    }
  }

  private findCluster(
    topic: string,
    mlResult: KeywordAnalysisOutput,
  ): string | null {
    for (const [cluster, topicList] of Object.entries(mlResult.related)) {
      if (topicList.includes(topic)) {
        return cluster;
      }
    }
    return null;
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
}
