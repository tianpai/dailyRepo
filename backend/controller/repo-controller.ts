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
import {
  fetchTrendingRepos,
  fetchSearchedRepos,
} from "@/services/repo-service";
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

/**
 * GET /repos/search
 * ?q=search terms (required)
 * ?language=JavaScript (optional)
 * ?page=N ?limit=N (optional; pagination)
 */
export async function searchRepos(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const query = req.query.q as string;
    const language = req.query.language as string | undefined;
    const { page, limit } = parsePagination(req, 15, 50);

    if (!query || query.trim().length === 0) {
      res
        .status(400)
        .json(
          makeError(
            new Date().toISOString(),
            400,
            "Search query 'q' is required",
          ),
        );
      return;
    }

    // Create cache key based on search parameters
    const cacheKey = `search:${query}:${language || "all"}:${page}:${limit}`;

    const { data: searchResult, fromCache } = await withCache(
      cacheKey,
      () => fetchSearchedRepos(query, language, page, limit),
      TTL._1_HOUR,
      (result) => result.totalCount > 0, // Only cache if results found
    );

    const { repos, totalCount } = searchResult;
    const totalPages = Math.ceil(totalCount / limit);

    const response = makeSuccess(
      {
        repos,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        searchInfo: {
          query: query.trim(),
          language: language || null,
          resultsFound: totalCount,
        },
      },
      new Date().toISOString(),
    );
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search repositories";
    res.status(500).json(makeError(new Date().toISOString(), 500, message));
  }
}
