import { Repo, StarHistory } from "../models/Repo.js";
import {
  getCache,
  setCache,
  TTL,
  getTrendCacheKey,
} from "../utils/nodeCache.js";
import { getTodayUTC, isValidDate } from "../utils/time.js";
import { getRepoStarRecords } from "../utils/starHistory.js";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /repos/trending
 * ?date=YYYY-MM-DD  (optional; empty → today)
 */
export async function getTrending(req, res, next) {
  try {
    const today = getTodayUTC();
    const date = req.query.date || today;

    if (!isValidDate(date)) {
      return res
        .status(400)
        .json({ error: `Bad date: "${date}" (expected YYYY-MM-DD ≥ 2024)` });
    }

    const cacheKey = getTrendCacheKey(date);
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ isCached: true, date, data: cached });
    }

    //try exact match
    let docs = await Repo.find({ trendingDate: date })
      .select("-snapshots")
      .lean();

    if (!docs.length) {
      //fallback to most-recent date in DB
      const [{ latestDate } = {}] = await Repo.aggregate([
        { $match: { trendingDate: { $exists: true, $ne: null } } },
        { $sort: { trendingDate: -1 } },
        { $limit: 1 },
        { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
      ]);

      docs = await Repo.find({ trendingDate: latestDate })
        .select("-snapshots")
        .lean();

      // cache the real date long-term…
      setCache(getTrendCacheKey(latestDate), docs, TTL.DATED);
      // …and today's alias with short TTL so it self-expires
      if (date === today) {
        // 1 hour because server is too drunk
        setCache(cacheKey, docs, TTL.HAPPY_HOUR);
      }

      return res.status(200).json({
        isCached: false,
        date: latestDate,
        data: docs,
      });
    }

    //exact match found → normal daily TTL
    setCache(cacheKey, docs, TTL.DATED);
    return res.status(200).json({ isCached: false, date, data: docs });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /repos/:name/:repo/star-history
 */
export async function getStarHistory(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const name = `${owner}/${repo}`;

    // Check cache first
    const cacheKey = `star-history:${name}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ isCached: true, data: cached });
    }

    // Check database for existing star history
    const repoDoc = await Repo.findOne({ fullName: name }).select("_id").lean();
    if (!repoDoc) {
      return res.status(404).json({
        error: "Repo not found",
        msg: "Try use 'Star History'",
      });
    }

    // Check if we have recent star history data
    const existingHistory = await StarHistory.findOne({
      repoId: repoDoc._id,
    }).sort({ saveDate: -1 });

    // If we have recent data (within 1 month), return it
    if (
      existingHistory &&
      new Date() - existingHistory.saveDate < ONE_MONTH_MS
    ) {
      setCache(cacheKey, existingHistory.history, TTL.SEMAINE);
      return res.status(200).json({
        isCached: false,
        fromDB: true,
        data: existingHistory.history,
      });
    }

    // Fetch from GitHub API
    const data = await getRepoStarRecords(name);

    // Save to StarHistory collection
    await StarHistory.create({
      repoId: repoDoc._id,
      history: data,
    });

    setCache(cacheKey, data, TTL.SEMAINE);
    return res.status(200).json({ isCached: false, data: data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /repos/ranking
 * ?top=N (optional, default 10, max 100)
 */
export async function getRanking(req, res, next) {
  try {
    let top = parseInt(req.query.top ?? "10", 10);
    if (isNaN(top) || top <= 0) top = 10;
    // If top is greater than 100, it will be set to 100
    top = Math.min(top, 100);

    // Try cache first
    const cacheKey = `ranking:${top}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
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
    setCache(cacheKey, ranking, TTL.WEEK);
    return res.json(ranking);
  } catch (err) {
    next(err);
  }
}
