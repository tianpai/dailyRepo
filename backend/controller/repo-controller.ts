import { Repo, StarHistory } from "../model/Repo";
import { getCache, setCache, TTL, getTrendCacheKey } from "../utils/caching";
import { getTodayUTC } from "../utils/time";
import { NextFunction, Request, Response } from "express";
import { IRepo } from "../types/database";
import { makeSuccess, makeError } from "../types/api";
import {
  parsePagination,
  parseDateParam,
  withCache,
  paginateArray,
} from "../utils/controller-helper";
import dotenv from "dotenv";
dotenv.config();

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

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
      TTL.HAPPY_HOUR,
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

async function fetchTrendingRepos(date: string): Promise<IRepo[]> {
  // First try to find repos for the requested date
  let repos = await Repo.find({ trendingDate: date })
    .select("-snapshots")
    .lean();

  // If no repos found for requested date, fall back to latest date
  if (!repos.length) {
    const [{ latestDate } = {}] = await Repo.aggregate([
      { $match: { trendingDate: { $exists: true, $ne: null } } },
      { $sort: { trendingDate: -1 } },
      { $limit: 1 },
      { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
    ]);

    if (latestDate) {
      repos = await Repo.find({ trendingDate: latestDate })
        .select("-snapshots")
        .lean();
    }
  }

  // After fetching, update cache with proper strategy
  if (repos.length > 0) {
    const actualDate = repos[0].trendingDate;
    const today = getTodayUTC();

    // Cache the data against its actual date with a long TTL
    setCache(getTrendCacheKey(actualDate), repos, TTL.SEMAINE);

    // If today's data was requested but we served older data, create a short-lived alias
    if (date === today && actualDate !== date) {
      setCache(getTrendCacheKey(date), repos, TTL.HAPPY_HOUR);
    }
  }

  return repos;
}

import { getRepoStarRecords } from "../services/scraping-services/fetching-star-history";
/**
 * GET /repos/:name/:repo/star-history
 */
export async function getStarHistory(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { owner, repo } = req.params;
    const fname = `${owner}/${repo}`;

    const cacheKey = `star-history:${fname}`;
    const { data: starHistory, fromCache } = await withCache(
      cacheKey,
      () => fetchRepoStarHistory(fname),
      TTL.THIRTY_FLIRTY,
    );

    const response = makeSuccess({ data: starHistory }, getTodayUTC());
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch repo star history";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}

async function fetchRepoStarHistory(fname: string): Promise<any[]> {
  // Check database for existing star history
  const repoDoc = await Repo.findOne({ fullName: fname }).select("_id").lean();

  if (!repoDoc) {
    throw new Error("Repo not found - Try use 'Star History'");
  }

  // Check if we have recent star history data
  const existingHistory = await StarHistory.findOne({
    repoId: repoDoc._id,
  }).sort({ saveDate: -1 });

  // If we have recent data (within 1 month), return it
  if (
    existingHistory &&
    new Date().getTime() - existingHistory.saveDate.getTime() < ONE_MONTH_MS
  ) {
    return existingHistory.history;
  }

  // Fetch from GitHub API
  const data = await getRepoStarRecords(fname);

  // Save to StarHistory collection
  await StarHistory.create({
    repoId: repoDoc._id,
    history: data,
  });

  return data;
}

/**
 * POST /repos/star-history
 * body: { repoNames: string[] }
 */
export async function getStarHistoryForRepos(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { repoNames } = req.body;
    const validRepoNames = validateRepoNames(repoNames);

    const { data } = await fetchMultipleRepoStarHistory(validRepoNames);

    const response = makeSuccess(data, new Date().toISOString());
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch bulk star history";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}

function validateRepoNames(repoNames: any): string[] {
  if (!Array.isArray(repoNames) || repoNames.length === 0) {
    throw new Error("repoNames must be a non-empty array");
  }

  const validRepoNames = repoNames.filter(
    (name) =>
      typeof name === "string" &&
      name.includes("/") &&
      name.split("/").length === 2,
  );

  if (validRepoNames.length === 0) {
    throw new Error("No valid repo names provided (format: owner/repo)");
  }

  return validRepoNames;
}

export interface starDataPoint {
  date: string;
  count: number;
}

async function fetchMultipleRepoStarHistory(validRepoNames: string[]): Promise<{
  data: Record<string, starDataPoint[]>;
}> {
  const result = {};
  const cacheHits = [];

  // Check cache for each repo
  for (const repoName of validRepoNames) {
    const cacheKey = `star-history:${repoName}`;
    const cached = getCache(cacheKey);
    if (cached) {
      result[repoName] = cached;
      cacheHits.push(repoName);
    }
  }

  // Query database for repos not in cache
  const uncachedRepos = validRepoNames.filter(
    (name) => !cacheHits.includes(name),
  );

  // Find repos in database
  if (uncachedRepos.length > 0) {
    // Just get the IDs
    const repoIds = await Repo.find({
      fullName: { $in: uncachedRepos },
    }).distinct("_id"); // returns ObjectId[] directly

    // Query StarHistory and populate repo.fullName
    const starHistoryRecords = await StarHistory.find({
      repoId: { $in: repoIds },
    })
      // pulls fullName from Repo automatically
      .populate("repoId", "fullName")
      .lean();

    // Process star history records
    for (const record of starHistoryRecords) {
      const repoName = (record.repoId as any).fullName;
      const starHistory = record.history.map((point) => ({
        date: point.date,
        count: point.count,
      }));

      result[repoName] = starHistory;

      // Cache the result
      const cacheKey = `star-history:${repoName}`;
      setCache(cacheKey, starHistory, TTL.TWO_DAYS);
    }
  }

  return { data: result };
}
