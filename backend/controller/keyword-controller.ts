import { NextFunction, Request, Response } from "express";
import { Repo } from "../model/Repo";
import { Keywords } from "../model/Keywords";
import { getCache, setCache, TTL } from "../utils/caching";
import { getTodayUTC } from "../utils/time";
import {
  fetchAnalyzeKeywords,
  analyzeKeywordInput,
  analyzeKeywordOutput,
} from "../services/server-services/ml-keyword-service";
import { makeSuccess, makeError } from "../types/api";
import { PIPELINE } from "../utils/db-pipline";
import { languages } from "../utils/language-list";

export async function getTrendingkeywords(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const today = getTodayUTC();
    const cacheKey: string = `trending-keywords:${today}`;

    // Check cache first
    const cachedData = getCache(cacheKey) as analyzeKeywordOutput | null;
    if (cachedData) {
      const response = makeSuccess(cachedData, today);
      response.isCached = true;
      res.status(200).json(response);
      return;
    }

    // If cache misses, check the database
    const dbResult = await Keywords.findOne({ date: today }).sort({ date: -1 });
    if (dbResult) {
      const keywordData = dbResult.analysis;
      setCache(cacheKey, keywordData, TTL._12_HOUR);
      const response = makeSuccess(keywordData, today);
      response.isCached = false; // Data from DB, not cache
      res.status(200).json(response);
      return;
    }

    // If not in DB, fetch from ML service
    const topN = 15;
    const distanceThreshold = 0.25;
    const includeClusterSizes = true;

    const repoTopicsResult = await Repo.aggregate(PIPELINE);
    const allTopics: string[] = repoTopicsResult[0]?.topics || [];

    const topics: string[] = allTopics.filter(
      (topic) =>
        !languages.some((lang) => lang.toLowerCase() === topic.toLowerCase()),
    );

    if (topics.length === 0) {
      res.status(200).json(
        makeSuccess(
          {
            originalTopicsCount: allTopics.length,
            topKeywords: [],
            related: {},
            clusterSizes: {},
          },
          today,
        ),
      );
      return;
    }

    const requestBody: analyzeKeywordInput = {
      topics: topics,
      topN: topN,
      includeRelated: true,
      distance_threshold: distanceThreshold,
      includeClusterSizes: includeClusterSizes,
      batchSize: 64,
    };

    const keywordData = await fetchAnalyzeKeywords(requestBody);

    // Save to database and cache
    try {
      await Keywords.findOneAndUpdate(
        { date: today },
        { $set: { analysis: keywordData } },
        { upsert: true, new: true },
      );
      setCache(cacheKey, keywordData, TTL._12_HOUR);
    } catch (dbError) {
      console.error("Error saving keywords to database:", dbError);
      // Decide if you should return an error or just log it
    }

    res.status(200).json(makeSuccess(keywordData, today));
  } catch (err) {
    console.error("Error fetching trending keywords:", err);
    const today = getTodayUTC();
    if (err instanceof Error && err.name === "AbortError") {
      res
        .status(408)
        .json(
          makeError(
            today,
            408,
            "Request timeout - ML service took too long to respond",
          ),
        );
      return;
    }

    res
      .status(503)
      .json(
        makeError(
          today,
          503,
          "Keyword analysis service temporarily unavailable",
        ),
      );
  }
}
