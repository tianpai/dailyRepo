import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";
import { type Pagination } from "@/interface/endpoint";
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
  const base_url = env("VITE_DATABASE_REPOS");
  const token = env("VITE_DEV_AUTH");

  // Build query parameters
  const urlArgs = useMemo(() => {
    const queryParams: Record<string, string | number> = {};

    if (query.trim()) {
      queryParams.q = query.trim();
    }

    if (language) {
      queryParams.language = language;
    }

    queryParams.page = page;
    queryParams.limit = limit;

    return {
      baseUrl: base_url,
      endpoint: "search",
      query: queryParams,
    };
  }, [base_url, query, language, page, limit]);

  const fetchOptions = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token],
  );

  // Only fetch if query exists and enabled is true
  const shouldFetch = enabled && query.trim().length > 0;

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<Search>({
    urlArgs,
    fetchOptions,
    autoFetch: shouldFetch,
  });

  return {
    data: response ? processSearchResults(response) : [],
    pagination: response?.pagination || null,
    searchInfo: response?.searchInfo || null,
    isLoading: loading,
    error: error?.error?.message || null,
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
    }),
  );
}
