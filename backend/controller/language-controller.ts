import { Request, Response, NextFunction } from "express";
import { setCache, getCache, TTL } from "@utils/caching";
import { Repo } from "@model/Repo";
import { makeSuccess, makeError } from "@/interfaces/api";
import { getTodayUTC } from "@utils/time";

/**
 * Languages currently handled by the scraper.
 * IMPORTANT: Keep this list in sync with scraper capabilities.
 * reference: @see backend/services/repo-scrapping.ts
 *
 * Do not add languages that are not supported by the scraper.
 * Do not MODIFY this list without updating the scraper.
 */
const SUPPORTED_LANGUAGES: string[] = [
  "c++",
  "go",
  "java",
  "javascript",
  "python",
  "rust",
  "typescript",
];
/**
 * GET /languages
 * Lists all available programming languages.
 * Example: GET /languages
 */
export async function getLanguagesList(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    res
      .status(200)
      .json(makeSuccess({ languages: SUPPORTED_LANGUAGES }, getTodayUTC()));
    return;
  } catch (error) {
    console.error("Error fetching languages:", error);
    res
      .status(500)
      .json(makeError(getTodayUTC(), 500, "Failed to fetch languages"));
  }
}

/**
 * GET /languages/:language/trending
 * Retrieves trending repositories for a specific language.
 * Example: GET /languages/
 */
export async function getLanguageTrendingRepos(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // TODO: implement language-specific trending logic
  res.status(200).json(makeSuccess({ trending: [] }, getTodayUTC()));
  return;
}

import { language_list_top } from "@utils/db-pipline";
/*
 * params: topN (optional, default 5, max 15)
 *
 */
export async function getTopLang(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    let top = parseInt((req.query.top as string) ?? "5", 10);
    if (isNaN(top) || top <= 0) {top = 5;}
    top = Math.min(top, 15);

    const cacheKey = `top-languages:${top}`;
    const cachedData = getCache(cacheKey) as any[];
    if (cachedData) {
      const response = makeSuccess(
        { data: cachedData, count: cachedData.length },
        getTodayUTC(),
      );
      response.isCached = true;
      res.status(200).json(response);
      return;
    }

    const pipeline = language_list_top(top);
    const dbResult = await Repo.aggregate(pipeline);
    interface TopLangsResponse {
      [languageName: string]: number;
    }
    const topLangs: TopLangsResponse[] = dbResult[0] || [];

    setCache(cacheKey, topLangs, TTL._1_DAY);

    res.status(200).json(makeSuccess({ data: topLangs }, getTodayUTC()));
    return;
  } catch (err) {
    console.error("Error fetching top languages:", err);
    res
      .status(500)
      .json(makeError(getTodayUTC(), 500, "Failed to fetch top languages"));
  }
}
