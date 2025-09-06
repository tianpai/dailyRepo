import { NextFunction, Request, Response } from "express";
import { TTL } from "@utils/caching";
import { withCache } from "../../utils/controller-helper";
import { makeSuccess, makeError } from "@interfaces/api";
import { fetchTimeToFirstThreeHundredStars } from "@/services/repo-service";
import {
  parseTrendingParams,
  fetchTrendingWithCache,
  formatTrendingResponse,
} from "@/services/repo/trending-helpers";
import {
  validateSearchParams,
  executeSearchWithCache,
  formatSearchResponse,
} from "@/services/repo/search-helpers";
import dotenv from "dotenv";
dotenv.config();

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
    const params = parseTrendingParams(req);
    const { repoList, fromCache } = await fetchTrendingWithCache(params.date);
    const response = formatTrendingResponse(repoList, params, fromCache);

    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trending repos";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}

/**
 * GET /repos/search
 * ?q=search terms (required)
 * ?language=JavaScript (optional)
 * ?page=N ?limit=N (optional; pagination)
 */
export async function searchRepos(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const params = validateSearchParams(req);
    const { searchResult, fromCache } = await executeSearchWithCache(params);
    const response = formatSearchResponse(searchResult, params, fromCache);

    res.status(200).json(response);
  } catch (error) {
    if (error.message === "Search query 'q' is required") {
      res
        .status(400)
        .json(makeError(new Date().toISOString(), 400, error.message));
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to search repositories";
    res.status(500).json(makeError(new Date().toISOString(), 500, message));
  }
}

/**
 * GET /repos/time-to-300-stars
 * Returns analysis of how long it takes repos to reach 300 stars
 * ?age=YTD|all|5y|10y (optional; default 'YTD')
 */
export async function getTimeToFirstThreeHundredStars(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const age = (req.query.age as string) || "YTD";
    const validAgeValues = ["YTD", "all", "5y", "10y"];

    if (!validAgeValues.includes(age)) {
      res
        .status(400)
        .json(
          makeError(
            new Date().toISOString(),
            400,
            "Invalid age parameter. Must be one of: YTD, all, 5y, 10y",
          ),
        );
      return;
    }

    const cacheKey = `time-to-300-stars-analysis-${age}`;

    const { data: analysisResult, fromCache } = await withCache(
      cacheKey,
      () => fetchTimeToFirstThreeHundredStars(age),
      TTL._1_WEEK,
    );

    const response = makeSuccess(analysisResult, new Date().toISOString());
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze time to 300 stars";
    res.status(500).json(makeError(new Date().toISOString(), 500, message));
  }
}
