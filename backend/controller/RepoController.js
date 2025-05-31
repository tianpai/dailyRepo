import Repo from "../models/Repo.js";
import {
  getCache,
  setCache,
  TTL,
  getTrendCacheKey,
} from "../utils/nodeCache.js";
import { getTodayUTC, isValidDate } from "../utils/time.js";

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
      // …and today’s alias with short TTL so it self-expires
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
 * GET /repos/:id/star-history
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD  (both optional → full range)
 */
export async function getStarHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if ((from && !isValidDate(from)) || (to && !isValidDate(to)))
      return res.status(400).json({ error: "Bad from/to date" });

    const repo = await Repo.findById(id).lean();
    if (!repo) return res.status(404).json({ error: "Repo not found" });

    let series = repo.snapshots.map((s) => ({
      date: s.date,
      stars: s.stars,
    }));

    if (from) series = series.filter((s) => s.date >= from);
    if (to) series = series.filter((s) => s.date <= to);

    // Cache the results
    setCache(cacheKey, series, TTL.DATED);

    res.set("Cache-Control", "public, max-age=3600");
    return res.json(series);
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
          trend: 1,
          latestStars: { $last: "$snapshots.stars" },
        },
      },
      { $sort: { trend: -1 } },
      { $limit: top },
    ]);

    // Cache the results
    setCache(cacheKey, ranking, TTL.ALL_TIME);
    return res.json(ranking);
  } catch (err) {
    next(err);
  }
}
