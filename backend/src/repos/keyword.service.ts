import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Keywords, WeeklyTopicFindings } from '@dailyrepo/database';
import { Model } from 'mongoose';

interface KeywordAnalysisOutput {
  originalTopicsCount?: number;
  topKeywords: string[];
  related: Record<string, string[]>;
  clusterSizes: Record<string, number>;
}

@Injectable()
export class KeywordService {
  constructor(
    @InjectModel(Keywords.name) private keywords: Model<Keywords>,
    @InjectModel(WeeklyTopicFindings.name)
    private weekly: Model<WeeklyTopicFindings>,
  ) {}

  async fetchKeywordAnalysis(
    date: string,
    includeRelated = true,
  ): Promise<KeywordAnalysisOutput> {
    const result = await this.fetchKeywordAnalysisByDate(date);
    return includeRelated ? result : { ...result, related: {} };
  }

  async fetchKeywordAnalysisByDate(
    date: string,
  ): Promise<KeywordAnalysisOutput> {
    const document = await this.keywords.findOne({ date });
    if (!document)
      return {
        originalTopicsCount: 0,
        topKeywords: [],
        related: {},
        clusterSizes: {},
      };
    const analysis = document.analysis;
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

  async groupTopicsByLanguage(): Promise<
    Record<string, Record<string, number>>
  > {
    const document = await this.weekly
      .findOne({
        $expr: {
          $gt: [
            {
              $size: { $objectToArray: { $ifNull: ['$languageTopicMap', {}] } },
            },
            0,
          ],
        },
      })
      .sort({ year: -1, week: -1 });
    return document?.languageTopicMap ?? {};
  }
}
