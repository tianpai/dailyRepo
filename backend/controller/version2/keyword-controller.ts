import {
  Controller,
  Get,
  Cache,
  Schema,
} from "../../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC, validateDate } from "@/utils/time";
import { z } from "zod";
import {
  fetchKeywordAnalysis,
  fetchKeywordAnalysisByDate,
} from "@/services/keyword-service";
import { groupTopicsByLanguage } from "@/services/repo-lang-relation-service";

// Query schema for trending keywords
const TrendingKeywordsQuery = z.object({
  date: z
    .string()
    .optional()
    .refine((v) => !v || validateDate(v) !== null, {
      message: "Invalid date format. Use YYYY-MM-DD",
    }),
  includeRelated: z.coerce.boolean().default(false),
});

@Controller("/repos")
export class KeywordController {
  /**
   * Returns trending keywords for today or a specific date (past 7 days).
   */
  @Get("/keywords")
  @Schema({ query: TrendingKeywordsQuery })
  @Cache(
    "trending-keywords-{date}-{includeRelated}",
    TTL._1_WEEK,
    // Only cache when we have meaningful content
    (data: any) => {
      if (!data || typeof data !== "object") {
        return false;
      }
      if (Array.isArray(data.topKeywords)) {
        return data.topKeywords.length > 0;
      }
      if (data.related && Object.keys(data.related).length > 0) {
        return true;
      }
      if (data.clusterSizes && Object.keys(data.clusterSizes).length > 0) {
        return true;
      }
      return false;
    },
  )
  async getTrendingKeywords({
    date,
    includeRelated,
  }: z.infer<typeof TrendingKeywordsQuery>) {
    // Determine target date (validated format if provided)
    const targetDate = date ? (validateDate(date) as string) : getTodayUTC();

    // If a custom date is provided, only allow within the past 7 days (inclusive)
    if (date) {
      const today = new Date();
      const requested = new Date(targetDate);
      const daysDiff = Math.floor(
        (today.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff < 0 || daysDiff > 6) {
        // Return empty payload for out-of-range date; decorator will avoid caching via condition
        const empty = {
          originalTopicsCount: 0,
          topKeywords: [],
          related: {},
          clusterSizes: {},
          _dateOverride: targetDate,
        } as any;
        return empty;
      }
    }

    // Fetch data (by date or by current with includeRelated)
    const raw = date
      ? await fetchKeywordAnalysisByDate(targetDate)
      : await fetchKeywordAnalysis(targetDate, includeRelated);

    // Normalize to strict v1 shape
    const normalized = normalizeKeywordAnalysis(raw, includeRelated);
    (normalized as any)._dateOverride = targetDate;
    return normalized as any;
  }

  /**
   * GET /repos/topics-by-language
   * Returns a map of languages to topic-cluster counts
   */
  @Get("/topics-by-language")
  @Cache(
    "topics-by-language-{date}",
    TTL._1_WEEK,
    (data: any) => !!data && Object.keys(data).length > 0,
  )
  async getTopicByLanguage() {
    const today = getTodayUTC();
    const data = await groupTopicsByLanguage();
    return { ...(data || {}), _dateOverride: today } as any;
  }
}

export default KeywordController;

// Ensure stable v1-compatible shape regardless of service output peculiarities
function normalizeKeywordAnalysis(
  input: any,
  includeRelated: boolean,
): {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: Record<string, number>;
} {
  const topKeywords: string[] = Array.isArray(input?.topKeywords)
    ? input.topKeywords.filter((x: any) => typeof x === "string")
    : [];

  // Convert possible Map-like structures to plain objects
  const asObject = (v: any): Record<string, unknown> => {
    if (!v) {
      return {};
    }
    if (v instanceof Map) {
      return Object.fromEntries(v.entries());
    }
    if (typeof v === "object") {
      return v as Record<string, unknown>;
    }
    return {};
  };

  const relatedObj = asObject(input?.related);
  const related: Record<string, string[]> = Object.fromEntries(
    Object.entries(relatedObj).map(([k, v]) => [
      k,
      Array.isArray(v) ? (v as any[]).filter((x) => typeof x === "string") : [],
    ]),
  );

  const clusterSizesObj = asObject(input?.clusterSizes) as Record<
    string,
    unknown
  >;
  const clusterSizes: Record<string, number> = Object.fromEntries(
    Object.entries(clusterSizesObj).map(([k, v]) => [
      k,
      typeof v === "number" ? v : Number(v) || 0,
    ]),
  );

  // Prefer provided count; otherwise sum cluster sizes
  const originalTopicsCount: number =
    typeof input?.originalTopicsCount === "number"
      ? input.originalTopicsCount
      : Object.values(clusterSizes).reduce((a, b) => a + (b || 0), 0);

  const base = {
    originalTopicsCount,
    topKeywords,
  } as any;

  // Only include related when requested (parity with v1 behavior)
  if (includeRelated) {
    base.related = related;
  }
  base.clusterSizes = clusterSizes;

  return base as {
    originalTopicsCount: number;
    topKeywords: string[];
    related?: Record<string, string[]>;
    clusterSizes?: Record<string, number>;
  };
}
