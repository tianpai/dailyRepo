import { NextFunction, Request, Response } from "express";
import { Repo } from "../model/Repo";
import { getCache, setCache, TTL } from "../utils/caching";
import { getTodayUTC } from "../utils/time";
import {
  fetchAnalyzeKeywords,
  analyzeKeywordInput,
  analyzeKeywordOutput,
} from "../services/server-services/ml-keyword-service";
import { makeSuccess, makeError } from "../types/api";

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
import { PIPELINE } from "../utils/db-pipline";
import { languages } from "../utils/language-list";
export async function getTrendingkeywords(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const topN = 15;
    const includeRelated = req.query.includeRelated === "true";
    const distanceThreshold = 0.25;
    const includeClusterSizes = true;
    const today = getTodayUTC();

    // cache
    const cacheKey: string = `trending-keywords:${today}`;
    const cached = getCache(cacheKey) as analyzeKeywordOutput | null;
    if (cached) {
      const response = makeSuccess(cached, today);
      response.isCached = true;
      res.status(200).json(response);
      return;
    }

    // Fetch topics from MongoDB using the pipeline
    const repoTopicsResult = await Repo.aggregate(PIPELINE);
    const allTopics: string[] = repoTopicsResult[0]?.topics || [];

    // Filter out languages from topics as they provide no insights to topics
    const topics: string[] = allTopics.filter(
      (topic) =>
        !languages.some((lang) => lang.toLowerCase() === topic.toLowerCase()),
    );

    // Handle no topics are found
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

    // Construct the POST request body to ML microservice
    const requestBody: analyzeKeywordInput = {
      topics: topics,
      topN: topN,
      includeRelated: includeRelated,
      distance_threshold: distanceThreshold,
      includeClusterSizes: includeClusterSizes,
      batchSize: 64,
    };

    const keywordData: analyzeKeywordOutput =
      await fetchAnalyzeKeywords(requestBody);

    // save to database and cache
    setCache(cacheKey, keywordData, TTL.ONE_EARTH_ROTATION);

    res.status(200).json(makeSuccess(keywordData, today));
    return;
  } catch (err) {
    console.error("Error fetching trending keywords:", err);

    if (err instanceof Error && err.name === "AbortError") {
      res
        .status(408)
        .json(
          makeError(
            getTodayUTC(),
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
          getTodayUTC(),
          503,
          "Keyword analysis service temporarily unavailable",
        ),
      );
    return;
  }
}
