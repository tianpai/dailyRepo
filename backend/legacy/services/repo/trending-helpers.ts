import { Request } from "express";
import { TTL, getTrendCacheKey } from "@utils/caching";
import { getTodayUTC } from "@utils/time";
import { makeSuccess } from "@interfaces/api";
import {
  parsePagination,
  parseDateParam,
  withCache,
  paginateArray,
} from "../../utils/controller-helper";
import { fetchTrendingRepos } from "@/services/repo-service";

export interface TrendingParams {
  page: number;
  limit: number;
  date: string;
}

export function parseTrendingParams(req: Request): TrendingParams {
  const { page, limit } = parsePagination(req, 15, 15);
  const date = parseDateParam(req, getTodayUTC());
  return { page, limit, date };
}

export async function fetchTrendingWithCache(date: string) {
  const cacheKey = getTrendCacheKey(date);
  const { data: repoList, fromCache } = await withCache(
    cacheKey,
    () => fetchTrendingRepos(date),
    TTL._1_HOUR,
  );
  return { repoList, fromCache };
}

export function formatTrendingResponse(
  repoList: any[],
  params: TrendingParams,
  fromCache: boolean,
) {
  const { page, limit, date } = params;
  
  const {
    items: repos,
    total,
    totalPages,
  } = paginateArray(repoList, page, limit);

  const response = makeSuccess(
    {
      repos,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    repoList.length > 0 ? repoList[0].trendingDate || date : date,
  );
  response.isCached = fromCache;
  return response;
}