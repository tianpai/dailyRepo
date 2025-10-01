import { Controller, Get, Query, UsePipes, Logger } from '@nestjs/common';
import { KeywordService } from '../services/keyword.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

interface KeywordAnalysisOutput {
  originalTopicsCount?: number;
  topKeywords: string[];
  related: Record<string, string[]>;
  clusterSizes: Record<string, number>;
}

const TrendingKeywordsQuerySchema = z.object({
  date: z.string().optional(),
  includeRelated: z.coerce.boolean().default(false),
});

@Controller('repos')
export class KeywordsController {
  private readonly logger = new Logger(KeywordsController.name);

  constructor(private readonly keywordService: KeywordService) {}

  @Get('keywords')
  @UsePipes(new ZodValidationPipe(TrendingKeywordsQuerySchema))
  async getTrendingKeywords(
    @Query() query: z.infer<typeof TrendingKeywordsQuerySchema>,
  ) {
    const { date, includeRelated } = query;
    const targetDate = date ? this.validateDate(date) : this.getTodayUTC();
    this.logger.debug(
      `GET /repos/keywords - date: ${targetDate}, includeRelated: ${includeRelated}`,
    );

    // If a custom date is provided, only allow within the past 7 days
    if (date) {
      const today = new Date();
      const requested = new Date(targetDate);
      const daysDiff = Math.floor(
        (today.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff < 0 || daysDiff > 6) {
        return {
          originalTopicsCount: 0,
          topKeywords: [],
          related: {},
          clusterSizes: {},
          _dateOverride: targetDate,
        };
      }
    }

    const raw = date
      ? await this.keywordService.fetchKeywordAnalysisByDate(targetDate)
      : await this.keywordService.fetchKeywordAnalysis(
          targetDate,
          includeRelated,
        );

    const normalized = this.normalizeKeywordAnalysis(raw, includeRelated);

    return {
      ...normalized,
      _dateOverride: targetDate,
    };
  }

  @Get('topics-by-language')
  async getTopicByLanguage() {
    this.logger.debug('GET /repos/topics-by-language');
    const today = this.getTodayUTC();
    const data = await this.keywordService.groupTopicsByLanguage();

    return {
      ...(data || {}),
      _dateOverride: today,
    };
  }

  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validateDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return this.getTodayUTC();
    }
    return dateStr;
  }

  private normalizeKeywordAnalysis(
    input: KeywordAnalysisOutput | null,
    includeRelated: boolean,
  ): KeywordAnalysisOutput {
    const topKeywords: string[] = Array.isArray(input?.topKeywords)
      ? input.topKeywords.filter((x): x is string => typeof x === 'string')
      : [];

    const related: Record<string, string[]> = this.toObjectRecord(
      input?.related,
    );
    const clusterSizes: Record<string, number> = this.toObjectRecord(
      input?.clusterSizes,
    );

    const originalTopicsCount: number =
      typeof input?.originalTopicsCount === 'number'
        ? input.originalTopicsCount
        : Object.values(clusterSizes).reduce((a, b) => a + (b || 0), 0);

    const base: KeywordAnalysisOutput = {
      originalTopicsCount,
      topKeywords,
      clusterSizes,
      related: {},
    };

    if (includeRelated) {
      base.related = related;
    }

    return base;
  }

  private toObjectRecord<T>(
    v: Record<string, T> | Map<string, T> | undefined,
  ): Record<string, T> {
    if (!v) return {} as Record<string, T>;
    if (v instanceof Map)
      return Object.fromEntries(v.entries()) as Record<string, T>;
    if (typeof v === 'object') return v;
    return {} as Record<string, T>;
  }
}
