import { NextFunction, Request, Response } from "express";
import { TTL, getTrendCacheKey } from "@utils/caching";
import { getTodayUTC } from "@utils/time";
import { makeSuccess, makeError } from "@interfaces/api";
import {
  parsePagination,
  parseDateParam,
  withCache,
  paginateArray,
} from "../utils/controller-helper";
import { fetchTrendingRepos } from "@/services/repo-service";
import dotenv from "dotenv";
dotenv.config();

/**
 * GET /repos/trending
 * ?date=YYYY-MM-DD  (optional; empty → today)
 * ?page=N (optional; default 1)
 */
export async function getTrending(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = parsePagination(req, 15, 15);
    const date = parseDateParam(req, getTodayUTC());

    const cacheKey = getTrendCacheKey(date);
    const { data: repoList, fromCache } = await withCache(
      cacheKey,
      () => fetchTrendingRepos(date),
      TTL._1_HOUR,
    );

    const {
      items: repos,
      total,
      totalPages,
    } = paginateArray(repoList, page, limit);

    const response = makeSuccess(
      {
        repos,
        pagination: {
          page,
          limit,
          totalCount: total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      repoList.length > 0 ? repoList[0].trendingDate || date : date,
    );
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trending repos";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}
