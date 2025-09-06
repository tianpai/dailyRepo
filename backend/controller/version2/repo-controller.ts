import {
  Get,
  Cache,
  Schema,
  Controller,
} from "../../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC, isValidDate } from "@/utils/time";
import {
  fetchTrendingRepos,
  fetchSearchedRepos,
  fetchTimeToFirstThreeHundredStars,
} from "@/services/repo-service";
import { paginateArray } from "@/utils/controller-helper";
import { z } from "zod";

const TrendingQuery = z.object({
  date: z
    .string()
    .optional()
    .refine((v) => !v || isValidDate(v), { message: "Invalid date format" }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

const SearchQuery = z.object({
  q: z.string().min(1, "q is required"),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

const TimeTo300Query = z.object({
  age: z.enum(["YTD", "all", "5y", "10y"]).default("YTD"),
});

@Controller("/repos")
export class RepoController {
  @Get("/trending")
  @Schema({ query: TrendingQuery })
  @Cache("trending-repos-{date}-{page}-{limit}", TTL._1_HOUR)
  async getTrending({ date, page, limit }: z.infer<typeof TrendingQuery>) {
    const effectiveDate = date && date.trim() !== "" ? date : getTodayUTC();
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const repoList = await fetchTrendingRepos(effectiveDate);
    const {
      items: repos,
      total,
      totalPages,
    } = paginateArray(repoList, pageNum, limitNum);

    // Return just the business data - decorator will wrap in makeSuccess
    // Use same date logic as original formatTrendingResponse
    const responseDate =
      repoList.length > 0
        ? repoList[0].trendingDate || effectiveDate
        : effectiveDate;

    return {
      repos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount: total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      _dateOverride: responseDate, // Special property for decorator to use correct date
    };
  }

  @Get("/search")
  @Schema({ query: SearchQuery })
  @Cache(
    "search-{q}-{language}-{page}-{limit}",
    TTL._1_HOUR,
    (data: any) => (data?.searchInfo?.resultsFound ?? 0) > 0,
  )
  async searchRepos({ q, language, page, limit }: z.infer<typeof SearchQuery>) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const { repos, totalCount } = await fetchSearchedRepos(
      q,
      language,
      pageNum,
      limitNum,
    );
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      repos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      searchInfo: {
        query: q,
        language: language || null,
        resultsFound: totalCount,
      },
    };
  }

  /**
   * Analysis of how long it takes repos to reach 300 stars
   */
  @Get("/time-to-300-stars")
  @Schema({ query: TimeTo300Query })
  @Cache("time-to-300-stars-analysis-{age}", TTL._1_WEEK)
  async getTimeToFirstThreeHundredStars({
    age,
  }: z.infer<typeof TimeTo300Query>) {
    return await fetchTimeToFirstThreeHundredStars(age);
  }
}
