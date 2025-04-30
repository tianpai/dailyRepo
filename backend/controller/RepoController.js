import Repo from "../models/Repo.js";
import dotenv from "dotenv";
import { getCached, setCached } from "../utils/nodeCache.js";

dotenv.config();

export async function getRepoTopTrending(req, res) {
  try {
    const cacheKey = process.env.CACHE_KEY_TRENDING || "MISSING_ENV";
    if (cacheKey === "MISSING_ENV") {
      throw new Error("Cache key not found in environment variables");
    }

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const repos = await Repo.find()
      .sort({ "stats.trends": -1 })
      .limit(1)
      .lean();

    setCached(cacheKey, repos);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
}
