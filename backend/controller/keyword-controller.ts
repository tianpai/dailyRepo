import { NextFunction, Request, Response } from "express";
import { Repo } from "../model/Repo";
import { Keywords } from "../model/Keywords";
import { TTL, getTrendCacheKey } from "../utils/caching";
import { getTodayUTC } from "../utils/time";
import {
  fetchAnalyzeKeywords,
  analyzeKeywordOutput,
} from "../services/server-services/ml-keyword-service";
import { makeSuccess, errorResponse } from "../types/api";
import { PIPELINE } from "../utils/db-pipline";
import { filterLanguage } from "../utils/language-list";
import { KwRequestBody } from "../services/server-services/keyword-service";
import { withCache } from "../utils/controller-helper";

export async function getTrendingkeywords(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const today = getTodayUTC();
    const cacheKey = getTrendCacheKey(`trending-keywords:${today}`);

    const { data: keywordData, fromCache } = await withCache(
      cacheKey,
      () => fetchKeywordAnalysis(today),
      TTL._12_HOUR,
    );

    const response = makeSuccess(keywordData, today);
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (err) {
    console.error("[KEYWORD] Error fetching trending keywords:", err);
    if (err instanceof Error && err.name === "AbortError") {
      errorResponse(
        res,
        408,
        "Request timeout - ML service took too long to respond",
      );
      return;
    }

    errorResponse(res, 503, "Keyword analysis service temporarily unavailable");
  }
}

// Extract keyword analysis logic to a simple function
async function fetchKeywordAnalysis(
  today: string,
): Promise<analyzeKeywordOutput> {
  // Check the database first
  const dbResult = await Keywords.findOne({ date: today }).sort({ date: -1 });
  if (dbResult) {
    return dbResult.analysis;
  }

  // If not in DB, fetch from ML service
  const repoTopicsResult = await Repo.aggregate(PIPELINE);
  const allTopics: string[] = repoTopicsResult[0]?.topics || [];
  const topics: string[] = filterLanguage(allTopics);

  if (topics.length === 0) {
    return {
      topKeywords: [],
      related: {},
      clusterSizes: {},
    };
  }

  const requestBody = KwRequestBody(topics);
  const keywordData = await fetchAnalyzeKeywords(requestBody);

  // Save to database
  try {
    await Keywords.findOneAndUpdate(
      { date: today },
      { $set: { analysis: keywordData } },
      { upsert: true, new: true },
    );
  } catch (dbError) {
    console.error("Error saving keywords to database:", dbError);
  }

  return keywordData;
}
