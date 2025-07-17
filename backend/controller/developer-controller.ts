import { Request, Response, NextFunction } from "express";
import { getTodayUTC } from "../utils/time";
import { TrendingDeveloper } from "../model/TrendingDeveloper";
import { TTL, getTrendCacheKey } from "../utils/caching";
import { ITrendingDeveloper } from "../types/database";
import { makeSuccess, makeError } from "../types/api";
import {
  parsePagination,
  parseDateParam,
  withCache,
  paginateArray,
} from "../utils/controller-helper";

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
      TTL.HAPPY_HOUR,
    );

    const { items, total, totalPages } = paginateArray(developers, page, limit);

    const response = makeSuccess(
      { developers: items, pagination: { page, limit, total, totalPages } },
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

async function fetchTrendingDevelopers(
  date: string,
): Promise<ITrendingDeveloper[]> {
  let developers = await TrendingDeveloper.find({ trendingDate: date })
    .select("-trendingDate")
    .sort({ username: 1 });

  if (!developers.length) {
    const [{ latestDate } = {}] = await TrendingDeveloper.aggregate([
      { $match: { trendingDate: { $exists: true, $ne: null } } },
      { $sort: { trendingDate: -1 } },
      { $limit: 1 },
      { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
    ]);

    if (latestDate) {
      developers = await TrendingDeveloper.find({ trendingDate: latestDate })
        .select("-trendingDate")
        .sort({ username: 1 });
    }
  }

  return developers;
}
