import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Keywords, WeeklyTopicFindings } from '@dailyrepo/database';
import { Model } from 'mongoose';
import { ClusteringService } from './clustering.service';
import { filterLanguage } from './language-filter.util';
import {
  AnalysisInputService,
  RepositoryInput,
} from './analysis-input.service';
import { parseDate, utcToday, weeklyPeriod } from './periods';
import { JobInputError } from './errors';

interface LanguageClusterMap {
  [language: string]: { [cluster: string]: number };
}

const MIN_TOPICS_FOR_CLUSTERING = 20;
const WEEKLY_CLUSTER_BATCH_SIZE = 4;
const WEEKLY_CLUSTER_CONCURRENCY = 3;

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(Keywords.name) private keywords: Model<Keywords>,
    @InjectModel(WeeklyTopicFindings.name)
    private weekly: Model<WeeklyTopicFindings>,
    private inputs: AnalysisInputService,
    private clusteringService: ClusteringService,
  ) {}

  async daily(date = utcToday(), force = false) {
    parseDate(date);
    if (date > utcToday())
      throw new JobInputError('Daily analysis cannot target a future date');
    const existing = await this.keywords.findOne({ date });
    if (existing && !force) return { status: 'existing', date };

    const repos = await this.inputs.load(date, date);
    const topics = filterLanguage(repos.flatMap((repo) => repo.topics));
    const analysis = topics.length
      ? await this.clusteringService.clusterTopics({
          topics,
          topN: 15,
          includeRelated: true,
          distance_threshold: 0.25,
          includeClusterSizes: true,
          batchSize: 64,
        })
      : {
          originalTopicsCount: 0,
          topKeywords: [],
          related: {},
          clusterSizes: {},
        };

    await this.keywords.findOneAndUpdate(
      { date },
      {
        $set: {
          analysis,
          source: 'repository-snapshots-v1',
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    return { status: 'saved', date, repositories: repos.length };
  }

  async weeklyTopics(weekOf?: string, force = false) {
    const period = weeklyPeriod(weekOf);
    const { start, end, year, week } = period;
    const existing = await this.weekly.findOne({ year, week });
    if (existing && !force) return { status: 'existing', ...period };

    const repos = await this.inputs.load(start, end);
    const languageTopicMap = await this.sanitizeTopicLangMap(repos);
    await this.weekly.findOneAndUpdate(
      { year, week },
      {
        $set: {
          languageTopicMap,
          periodStart: start,
          periodEnd: end,
          source: 'repository-snapshots-v1',
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    return { status: 'saved', ...period, repositories: repos.length };
  }

  private async sanitizeTopicLangMap(
    repos: RepositoryInput[],
  ): Promise<LanguageClusterMap> {
    const langTopicMap: LanguageClusterMap = {};
    const topicsByLanguage = new Map<string, string[]>();

    for (const repo of repos) {
      let lang = 'Unknown';
      let maxCount = 0;
      for (const [language, count] of Object.entries(repo.language)) {
        if (count > maxCount) {
          lang = language;
          maxCount = count;
        }
      }
      if (lang === 'Unknown') continue;
      const topics = filterLanguage(repo.topics);
      if (!topics.length) continue;
      topicsByLanguage.set(lang, [
        ...(topicsByLanguage.get(lang) ?? []),
        ...topics,
      ]);
    }

    const entries = [...topicsByLanguage.entries()];
    const fallbackLanguages: Array<{ language: string; reason: string }> = [];
    const clusteredLanguages: string[] = [];
    let cursor = 0;
    await Promise.all(
      Array.from(
        { length: Math.min(WEEKLY_CLUSTER_CONCURRENCY, entries.length) },
        async () => {
          while (cursor < entries.length) {
            const [lang, topics] = entries[cursor++];
            await this.processLanguageTopics(
              lang,
              topics,
              langTopicMap,
              fallbackLanguages,
              clusteredLanguages,
            );
          }
        },
      ),
    );
    this.logger.log(
      `Weekly topics: clustered=${clusteredLanguages.length}, rawFallback=${fallbackLanguages.length}`,
    );
    return this.filterLanguagesByTopicCount(
      this.filterAndSortClusters(langTopicMap),
    );
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
      this.logger.error(`HuggingFace clustering failed for ${language}`, error);
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
}
