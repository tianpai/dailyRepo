import { Request, Response, NextFunction } from "express";
import { getTodayUTC, isValidDate } from "../utils/time";
import { TrendingDeveloper } from "../model/TrendingDeveloper";
import { getCache, setCache, TTL, getTrendCacheKey } from "../utils/caching";
import { ITrendingDeveloper } from "../types/database";
import { makeSuccess, makeError } from "../types/api";

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
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const requestedLimit = parseInt((req.query.limit as string) ?? "20", 10);
    const limit = Math.min(requestedLimit, 50);
    const date = (req.query.date as string) || getTodayUTC();

    if (!isValidDate(date)) {
      const response = makeError(
        new Date().toISOString(),
        400,
        `Invalid date format: ${date}`,
      );
      res.status(400).json(response);
      return;
    }

    const cacheKey = getTrendCacheKey(`trending-developers-${date}`);
    let allDevelopers: ITrendingDeveloper[] =
      (getCache(cacheKey) as ITrendingDeveloper[]) || null;

    let actualDate = date;

    if (!allDevelopers) {
      allDevelopers = await TrendingDeveloper.find({ trendingDate: date })
        .select("-trendingDate")
        .sort({ username: 1 });

      // If no developers found for requested date, fall back to latest date
      if (!allDevelopers.length) {
        const [{ latestDate } = {}] = await TrendingDeveloper.aggregate([
          { $match: { trendingDate: { $exists: true, $ne: null } } },
          { $sort: { trendingDate: -1 } },
          { $limit: 1 },
          { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
        ]);

        if (latestDate) {
          allDevelopers = await TrendingDeveloper.find({
            trendingDate: latestDate,
          })
            .select("-trendingDate")
            .sort({ username: 1 });
          actualDate = latestDate;
        }
      }

      setCache(cacheKey, allDevelopers, TTL.HAPPY_HOUR);
    }

    const total = allDevelopers.length;
    const skip = (page - 1) * limit;
    const developers = allDevelopers.slice(skip, skip + limit);

    const result = {
      developers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    const response = makeSuccess(result, new Date().toISOString());
    res.status(200).json(response);
  } catch (error) {
    const response = makeError(
      new Date().toISOString(),
      500,
      "Failed to fetch developers",
    );
    res.status(500).json(response);
  }
}

/**
 * GET /developers/:username
 * Returns detailed information for a single developer.
 */
export async function getDeveloperDetails(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const cachedDev = getCache(
    getTrendCacheKey(`developer-${req.params.username}`),
  );
  if (cachedDev) {
    const response = makeSuccess(
      { developer: cachedDev },
      new Date().toISOString(),
    );
    res.status(200).json(response);
    return;
  }

  const developer = await TrendingDeveloper.findOne({
    username: req.params.username,
  });
  if (!developer) {
    const response = makeError(
      new Date().toISOString(),
      404,
      "Developer not found",
    );
    res.status(404).json(response);
    return;
  }
  setCache(`developer-${developer.username}`, developer, TTL.SEMAINE);

  const response = makeSuccess(
    { developer: developer },
    new Date().toISOString(),
  );
  res.status(200).json(response);
  return;
}
