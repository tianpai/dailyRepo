import { Request } from "express";
import { TTL } from "@utils/caching";
import { makeSuccess } from "@interfaces/api";
import {
  parsePagination,
  withCache,
} from "../../utils/controller-helper";
import { fetchSearchedRepos } from "@/services/repo-service";

export interface SearchParams {
  query: string;
  language?: string;
  page: number;
  limit: number;
}

export function validateSearchParams(req: Request): SearchParams {
  const query = req.query.q as string;
  const language = req.query.language as string | undefined;
  const { page, limit } = parsePagination(req, 15, 50);

  if (!query || query.trim().length === 0) {
    throw new Error("Search query 'q' is required");
  }

  return { query: query.trim(), language, page, limit };
}

export async function executeSearchWithCache(params: SearchParams) {
  const { query, language, page, limit } = params;
  const cacheKey = `search:${query}:${language || "all"}:${page}:${limit}`;

  const { data: searchResult, fromCache } = await withCache(
    cacheKey,
    () => fetchSearchedRepos(query, language, page, limit),
    TTL._1_HOUR,
    (result) => result.totalCount > 0,
  );

  return { searchResult, fromCache };
}

export function formatSearchResponse(
  searchResult: { repos: any[]; totalCount: number },
  params: SearchParams,
  fromCache: boolean,
) {
  const { repos, totalCount } = searchResult;
  const { query, language, page, limit } = params;
  const totalPages = Math.ceil(totalCount / limit);

  const response = makeSuccess(
    {
      repos,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      searchInfo: {
        query,
        language: language || null,
        resultsFound: totalCount,
      },
    },
    new Date().toISOString(),
  );
  response.isCached = fromCache;
  return response;
}