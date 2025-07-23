import { NextFunction, Request, Response } from "express";
import { TTL, getTrendCacheKey } from "../utils/caching";
import { getTodayUTC } from "../utils/time";
import { makeSuccess, errorResponse } from "../types/api";
import { withCache } from "../utils/controller-helper";
import { fetchKeywordAnalysis } from "../services/server-services/keyword-service";
import { groupTopicsByLanguage } from "../services/server-services/repo-lang-relation-service";

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
      errorResponse(res, 408, "ML service timeout");
      return;
    }

    errorResponse(res, 503, "Keyword analysis service temporarily unavailable");
  }
}

export async function getTopicByLanguage(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const today = getTodayUTC();
    const cacheKey = getTrendCacheKey(`topics-by-language:${today}`);

    const { data: topicLanguageData, fromCache } = await withCache(
      cacheKey,
      () => groupTopicsByLanguage(),
      TTL.SEMAINE,
    );

    const response = makeSuccess(topicLanguageData, today);
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (err) {
    console.error("[KEYWORD] Error fetching topics by language:", err);
    if (err instanceof Error && err.name === "AbortError") {
      errorResponse(res, 408, "ML service timeout");
      return;
    }

    errorResponse(res, 503, "Topic analysis service temporarily unavailable");
  }
}
