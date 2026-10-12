import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiV2Base } from "@/lib/env";
import type { Pagination } from "@/interface/endpoint";
import { searchReposKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";
import { type Repo, type LanguageMap } from "@/hooks/useTrendingRepos";

export interface UseSearchParams {
  query: string;
  language?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface SearchInfo {
  query: string;
  language: string | null;
  resultsFound: number;
}

interface Search {
  repos: Repo[];
  pagination: Pagination;
  searchInfo: SearchInfo;
}

export interface SearchProps {
  name: string;
  owner: string;
  description: string;
  url: string;
  language: LanguageMap;
  topics: string[];
  trendingRecord: string[];
  license: string;
  createdAt: string;
}

export interface UseSearchReturn {
  data: SearchProps[];
  pagination: Pagination | null;
  searchInfo: SearchInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSearch({
  query,
  language,
  page = 1,
  limit = 15,
  enabled = true,
}: UseSearchParams): UseSearchReturn {
  const base_url = apiV2Base();

  // Build query parameters
  const params = useMemo(() => {
    const qp: Record<string, string | number> = {};
    if (query.trim()) qp.q = query.trim();
    if (language) qp.language = language;
    qp.page = page;
    qp.limit = limit;
    return qp;
  }, [query, language, page, limit]);

  // Only fetch if query exists and enabled is true
  const shouldFetch = enabled && query.trim().length > 0;

  const queryKey = useMemo(
    () => searchReposKey(base_url, query, language, page, limit),
    [base_url, query, language, page, limit],
  );

  const fetchFn = async (): Promise<Search> =>
    get<Search>(base_url, ["repos", "search"], params);

  const {
    data: response,
    isLoading: loading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: shouldFetch,
    placeholderData: keepPreviousData,
    staleTime: STALE_MIN,
  });

  return {
    data: response ? processSearchResults(response) : [],
    pagination: response?.pagination || null,
    searchInfo: response?.searchInfo || null,
    isLoading: loading || isFetching,
    error: (error as Error | undefined)?.message || null,
    refetch,
  };
}

function processSearchResults(data: Search): SearchProps[] {
  return data.repos.map(
    (repo: Repo): SearchProps => ({
      name: repo.name,
      owner: repo.owner,
      description: repo.description,
      url: repo.url,
      language: repo.language,
      topics: repo.topics,
      trendingRecord: repo.trendingRecord || [],
      license: repo.license,
      createdAt: repo.createdAt,
    }),
  );
}
