import { Request, Response, NextFunction } from "express";
import { TTL } from "@utils/caching";
import { makeSuccess, makeError } from "@/interfaces/api";
import { getTodayUTC } from "@utils/time";
import { withCache } from "@utils/controller-helper";
import {
  fetchRepoStarHistory,
  validateRepoNames,
  fetchMultipleRepoStarHistory,
} from "@services/star-history-service";

/**
 * GET /repos/:name/:repo/star-history
 */
export async function getStarHistory(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { owner, repo } = req.params;
    const fname = `${owner}/${repo}`;

    const cacheKey = `star-history:${fname}`;
    const { data: starHistory, fromCache } = await withCache(
      cacheKey,
      () => fetchRepoStarHistory(fname),
      TTL._1_WEEK,
    );

    const response = makeSuccess(starHistory, getTodayUTC());
    response.isCached = fromCache;
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch repo star history";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}

/**
 * POST /repos/star-history
 * body: { repoNames: string[] }
 */
export async function getStarHistoryForRepos(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const { repoNames } = req.body;
    const validRepoNames = validateRepoNames(repoNames);

    const { data } = await fetchMultipleRepoStarHistory(validRepoNames);

    const response = makeSuccess(data, new Date().toISOString());
    res.status(200).json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch bulk star history";
    res.status(400).json(makeError(new Date().toISOString(), 400, message));
  }
}
