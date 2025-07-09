import { Repo, StarHistory } from "../model/Repo";
import { getCache, setCache, TTL, getTrendCacheKey } from "../utils/caching";
import { getTodayUTC, isValidDate } from "../utils/time";
import { getRepoStarRecords } from "../services/fetching-star-history";
import { NextFunction, Request, Response } from "express";
import { IRepo } from "../types/database";
import dotenv from "dotenv";
dotenv.config();

interface TrendingQuery {
  date?: string;
  page?: string;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TrendingResponse {
  isCached: boolean;
  date: string;
  data: any[];
  pagination: PaginationMetadata;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /repos/trending
 * ?date=YYYY-MM-DD  (optional; empty → today)
 * ?page=N (optional; default 1)
 */
export async function getTrending(
  req: Request<{}, TrendingResponse, {}, TrendingQuery>,
  res: Response<TrendingResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const today = getTodayUTC();
    const date = req.query.date || today;
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = 15;
    const skip = (page - 1) * limit;
    if (!isValidDate(date)) {
      res.status(400).json({
        data: [],
        date: today,
      } as TrendingResponse);
      return;
    }

    const cacheKey = getTrendCacheKey(date);
    const cachedRepos: IRepo[] = getCache(cacheKey) as IRepo[];
    if (cachedRepos) {
      const totalCount = cachedRepos.length;
      const paginatedData = cachedRepos.slice(skip, skip + limit);
      const pagination = {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      };
      res
        .status(200)
        .json({ isCached: true, date, data: paginatedData, pagination });
      return;
    }

    // cache miss, fetch from database
    // First try to find repos for the requested date
    let allDocs: IRepo[] = await Repo.find({ trendingDate: date })
      .select("-snapshots")
      .lean();

    let actualDate = date;

    // If no repos found for requested date, fall back to latest date
    if (!allDocs.length) {
      const [{ latestDate } = {}] = await Repo.aggregate([
        { $match: { trendingDate: { $exists: true, $ne: null } } },
        { $sort: { trendingDate: -1 } },
        { $limit: 1 },
        { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
      ]);

      allDocs = await Repo.find({ trendingDate: latestDate })
        .select("-snapshots")
        .lean();

      actualDate = latestDate;
    }
    const totalCount = allDocs.length;
    const paginatedData = allDocs.slice(skip, skip + limit);
    const pagination = {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    };
    res.status(200).json({
      isCached: false,
      date: actualDate,
      data: paginatedData,
      pagination,
    });

    // After responding, update the cache using a dual-write strategy.
    // 1. Cache the data against its actual date (`actualDate`) with a long TTL.
    //    This is historical data that will not change.
    setCache(getTrendCacheKey(actualDate), allDocs, TTL.SEMAINE);
    // 2. If today's data was requested but we served older data, create a
    //    short-lived alias for `today`. This prevents repeated DB queries
    //    while waiting for the scraper to provide fresh data for the current day.
    if (date === today && actualDate !== date) {
      setCache(cacheKey, allDocs, TTL.HAPPY_HOUR);
    }
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * GET /repos/star-history
 * ?date=YYYY-MM-DD  (optional; empty → latest date)
 */
export async function getStarHistoryAllDataPointTrendingData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const today = getTodayUTC();
    const date = req.query.date || today;

    if (!isValidDate(date)) {
      res
        .status(400)
        .json({ error: `Bad date: "${date}" (expected YYYY-MM-DD ≥ 2024)` });
      return;
    }

    // Check cache first
    const cacheKey = `star-history-trending:${date}`;
    const cached = getCache(cacheKey);
    if (cached) {
      res.status(200).json({
        isCached: true,
        date: date,
        data: cached,
      });
      return;
    }

    // Try exact match first
    let trendingRepos = await Repo.find({ trendingDate: date })
      .select("_id")
      .lean();

    let actualDate = date;

    // If no repos found for exact date, fallback to latest date
    if (!trendingRepos.length) {
      const [{ latestDate } = {}] = await Repo.aggregate([
        { $match: { trendingDate: { $exists: true, $ne: null } } },
        { $sort: { trendingDate: -1 } },
        { $limit: 1 },
        { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
      ]);

      trendingRepos = await Repo.find({ trendingDate: latestDate })
        .select("_id")
        .lean();

      actualDate = latestDate;
    }

    const repoIds = trendingRepos.map((repo) => repo._id);

    // Find star history records for these repos
    const starHistoryRecords = await StarHistory.find({
      repoId: { $in: repoIds },
    })
      .populate("repoId", "fullName name")
      .lean();

    // Group star history data by repo fullName
    const groupedStarHistory = {};
    starHistoryRecords.forEach((record) => {
      const repoName =
        (record.repoId as any).fullName || (record.repoId as any).name;
      groupedStarHistory[repoName] = record.history.map((historyPoint) => ({
        date: historyPoint.date,
        count: historyPoint.count,
      }));
    });

    // Cache the results with proper date-based cache key
    const actualCacheKey = `star-history-trending:${actualDate}`;
    setCache(actualCacheKey, groupedStarHistory, TTL.SEMAINE);

    // If we used fallback date, also cache with requested date key for short time
    if (actualDate !== date) {
      setCache(cacheKey, groupedStarHistory, TTL.SEMAINE);
    }

    res.status(200).json({
      isCached: false,
      date: actualDate,
      data: groupedStarHistory,
    });
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * GET /repos/:name/:repo/star-history
 */
export async function getStarHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { owner, repo } = req.params;
    const fname = `${owner}/${repo}`;

    // Check cache first
    const cacheKey = `star-history:${fname}`;
    const cached = getCache(cacheKey);
    if (cached) {
      res
        .status(200)
        .json({ isCached: true, date: getTodayUTC(), data: cached });
      return;
    }

    // Check database for existing star history
    const repoDoc = await Repo.findOne({ fullName: fname })
      .select("_id")
      .lean();
    if (!repoDoc) {
      res.status(404).json({
        error: "Repo not found",
        msg: "Try use 'Star History'",
      });
      return;
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
      setCache(cacheKey, existingHistory.history, TTL.SEMAINE);
      res.status(200).json({
        isCached: false,
        date: getTodayUTC(),
        data: existingHistory.history,
      });
      return;
    }

    // Fetch from GitHub API
    const data = await getRepoStarRecords(fname);

    // Save to StarHistory collection
    await StarHistory.create({
      repoId: repoDoc._id,
      history: data,
    });

    setCache(cacheKey, data, TTL.THIRTY_FLIRTY);
    res.status(200).json({ isCached: false, data: data });
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * GET /repos/highlight
 * This endpoint will talk to another service to get keywords
 *
 * POST /analyze-keywords
 *
 * example:
 * DOMAIN/analyze-keywords?topN=10"
 * DOMAIN/analyze-keywords?topN=10&includeRelated=true"
 *
 * IncludeRelated is optional, default false.
 */
import { KeywordAnalysisResponseFromMLServices } from "../types/ml-service";
import { PIPELINE } from "../utils/db-pipline";
import { languages } from "../utils/language-list";
export async function getTrendingkeywords(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const topN = 10;
    const includeRelated = req.query.includeRelated === "true";
    const distanceThreshold = 0.25;
    const includeClusterSizes = true;
    const today = getTodayUTC();

    // cache
    const cacheKey = `trending-keywords:${today}-${includeRelated}`;
    const cached = getCache(cacheKey);
    if (cached) {
      res.status(200).json({
        isCached: true,
        data: cached,
      });
      return;
    }

    let mlServerUrl = process.env.ML_SERVER_PRIVATE;
    if (process.argv.includes("--debug")) {
      console.log("Debug mode enabled using private ML link");
      mlServerUrl = process.env.ML_SERVER_LOCAL;
    }

    if (!mlServerUrl) {
      throw new Error("ML_SERVER_PRIVATE environment variable is not set");
    }

    // Fetch topics from MongoDB using the pipeline
    const repoTopicsResult = await Repo.aggregate(PIPELINE);
    console.log("*".repeat(50));
    console.log(repoTopicsResult[0]?.topics);
    console.log("*".repeat(50));
    const allTopics: string[] = repoTopicsResult[0]?.topics || [];

    // Filter out languages from topics as they provide no insights to topics
    const topics: string[] = allTopics.filter(
      (topic) =>
        !languages.some((lang) => lang.toLowerCase() === topic.toLowerCase()),
    );

    if (topics.length === 0) {
      res.status(200).json({
        isCached: false,
        data: {
          topKeywords: [],
          related: {},
          clusterSizes: {},
        },
      });
      return;
    }

    // Construct the POST request body to ML microservice
    const requestBody = {
      topics: topics,
      topN: topN,
      includeRelated: includeRelated,
      distance_threshold: distanceThreshold,
      includeClusterSizes: includeClusterSizes,
      batchSize: 64,
    };
    const serviceUrl = `${mlServerUrl}/analyze-keywords`;
    console.log(`ML url: ${serviceUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const response = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(
        `ML service responded with ${response.status}: ${response.statusText}`,
      );
    }
    const keywordData: KeywordAnalysisResponseFromMLServices =
      await response.json();

    setCache(cacheKey, keywordData, TTL.ONE_EARTH_ROTATION);

    res.status(200).json({
      isCached: false,
      data: keywordData,
    });
    return;
  } catch (err) {
    console.error("Error fetching trending keywords:", err);

    if (err instanceof Error && err.name === "AbortError") {
      res.status(408).json({
        error: "Request timeout - ML service took too long to respond",
        fallback: [],
      });
      return;
    }

    res.status(503).json({
      error: "Keyword analysis service temporarily unavailable",
      fallback: [],
    });
    return;
  }
}
/**
 * GET /repos/ranking
 * ?top=N (optional, default 10, max 100)
 */
export async function getRanking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let top = parseInt((req.query.top as string) ?? "10", 10);
    if (isNaN(top) || top <= 0) top = 10;
    // If top is greater than 100, it will be set to 100
    top = Math.min(top, 100);

    // Try cache first
    const cacheKey = `ranking:${top}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    const ranking = await Repo.aggregate([
      {
        $project: {
          name: 1,
          fullName: 1,
          description: 1,
          url: 1,
          language: 1,
          topics: 1,
          "stats.trends": 1,
          "stats.category": 1,
          latestStars: { $last: "$snapshots.stars" },
        },
      },
      { $sort: { "stats.trends": -1 } },
      { $limit: top },
    ]);

    // Cache the results
    setCache(cacheKey, ranking, TTL.SEMAINE);
    res.json(ranking);
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * POST /repos/star-history
 * body: { repoNames: string[] }
 */
export async function getStarHistoryForRepos(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log("Raw request body:", req.body);
    const { repoNames } = req.body;
    if (!Array.isArray(repoNames) || repoNames.length === 0) {
      res.status(400).json({ error: "repoNames must be a non-empty array" });
      return;
    }
    const validRepoNames = repoNames.filter(
      (name) =>
        typeof name === "string" &&
        name.includes("/") &&
        name.split("/").length === 2,
    );
    if (validRepoNames.length === 0) {
      res
        .status(400)
        .json({ error: "No valid repo names provided (format: owner/repo)" });
      return;
    }

    const result = {};
    const cacheHits = [];
    const dbHits = [];
    const skipped = [];

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
        dbHits.push(repoName);

        // Cache the result
        const cacheKey = `star-history:${repoName}`;
        setCache(cacheKey, starHistory, TTL.TWO_DAYS);
      }

      // Track skipped repos (not found in database)
      skipped.push(
        ...uncachedRepos.filter(
          (name) => !dbHits.includes(name) && !cacheHits.includes(name),
        ),
      );
    }

    res.status(200).json({
      data: result,
      metadata: {
        requested: validRepoNames.length,
        returned: Object.keys(result).length,
        cacheHits: cacheHits.length,
        dbHits: dbHits.length,
        skipped: skipped.length,
      },
    });
    return;
  } catch (err) {
    next(err);
  }
}
