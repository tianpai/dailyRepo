import { Request, Response, NextFunction } from "express";
import { getTodayUTC } from "@utils/time";
import { TTL, getTrendCacheKey } from "@utils/caching";
import { makeSuccess, makeError } from "@/interfaces/api";
import {
  parsePagination,
  parseDateParam,
  withCache,
  paginateArray,
} from "../../utils/controller-helper";
import {
  fetchTrendingDevelopers,
  fetchTopTrendingDevelopers,
} from "@/services/developer-service";

/**
 * GET /developers
 * Returns a list of all developers
 * Parameters: page, limit
 */
export async function getDevelopersList(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const response = makeSuccess({ developers: [] }, new Date().toISOString());
  res.status(200).json(response);
}

/**
 * GET /developers/trending
 * Returns the list of trending developers, optionally filtered by date.
 *
 * Option
 * Retrieves a list of trending developers for a specific date.
 *  ?date=2023-06-15
 */
export async function getTrendingDevelopers(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = parsePagination(req);
    const date = parseDateParam(req, getTodayUTC());

    const cacheKey = getTrendCacheKey(`trending-developers-${date}`);
    const { data: developers, fromCache } = await withCache(
      cacheKey,
      () => fetchTrendingDevelopers(date),
      TTL._1_HOUR,
    );

    const { items, total, totalPages } = paginateArray(developers, page, limit);

    const response = makeSuccess(
      {
        developers: items,
        pagination: {
          page,
          limit,
          totalCount: total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      new Date().toISOString(),
    );
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch developers";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}

/**
 * GET /developers/top
 * Returns top developers by trending frequency
 * Query Parameters: ?limit=10 (default: 10, max: 50)
 */
export async function getTopTrendingDevelopers(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      50,
    );
    const cacheKey = getTrendCacheKey(`top-trending-developers-${limit}`);
    const { data: developers, fromCache } = await withCache(
      cacheKey,
      () => fetchTopTrendingDevelopers(limit),
      TTL._1_DAY,
    );

    const response = makeSuccess({ developers }, new Date().toISOString());
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch top developers";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}
