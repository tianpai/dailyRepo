// New decorator-based RepoController
// Clean separation: decorators handle HTTP, methods handle business logic

import { Get, Cache, Query } from "../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC, isValidDate } from "@/utils/time";
import {
  fetchTrendingRepos,
  fetchSearchedRepos,
} from "@/services/repo-service";
import { paginateArray } from "@/utils/controller-helper";
import { fetchTimeToFirstThreeHundredStars } from "@/services/repo-service";

export class RepoController {
  @Get("/trending")
  @Cache("trending-repos-{date}-{page}-{limit}", TTL._1_HOUR)
  @Query({ date: "", page: 1, limit: 15 })
  async getTrending({
    date,
    page,
    limit,
  }: {
    date: string;
    page: number;
    limit: number;
  }) {
    const effectiveDate = date && date.trim() !== "" ? date : getTodayUTC();
    if (date && date.trim() !== "" && !isValidDate(date)) {
      throw new Error(`Invalid date format: ${date}`);
    }
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
  @Cache(
    "search-{q}-{language}-{page}-{limit}",
    TTL._1_HOUR,
    (data: any) => (data?.searchInfo?.resultsFound ?? 0) > 0,
  )
  @Query({ q: undefined, language: undefined, page: 1, limit: 15 })
  async searchRepos({
    q,
    language,
    page,
    limit,
  }: {
    q: string;
    language?: string;
    page: number;
    limit: number;
  }) {
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
  @Cache("time-to-300-stars-analysis-{age}", TTL._1_WEEK)
  @Query({ age: "YTD" })
  async getTimeToFirstThreeHundredStars({ age }: { age: string }) {
    const validAgeValues = ["YTD", "all", "5y", "10y"];

    if (!validAgeValues.includes(age)) {
      throw new Error(
        "Invalid age parameter. Must be one of: YTD, all, 5y, 10y",
      );
    }

    return await fetchTimeToFirstThreeHundredStars(age);
  }
}
