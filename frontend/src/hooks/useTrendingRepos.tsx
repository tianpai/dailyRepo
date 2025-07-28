import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";
import { type Pagination } from "@/interface/endpoint";

export type LanguageMap = Record<string, number>;
export interface Repo {
  _id: string;
  __v: number;
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  language: LanguageMap;
  topics: string[];
  createdAt: string;
  lastUpdate: string;
  age: number;
  license: string;
  trendingDate: string;
}

interface TrendingRepos {
  repos: Repo[];
  pagination: Pagination;
}

export interface RepoProp {
  name: string;
  owner: string;
  description: string;
  url: string;
  language: LanguageMap;
  topics: string[];
}

export interface RepoCardProps extends Repo {
  rank: number;
}

export function useTrendingRepos(selectedDate?: Date, page?: number) {
  const base_url = env("VITE_DATABASE_REPOS");
  const token = env("VITE_DEV_AUTH");

  const urlArgs = useMemo(() => {
    const query: Record<string, string | number> = {};
    if (selectedDate) {
      query.date = selectedDate.toISOString().split("T")[0];
    }
    if (page && page > 1) {
      query.page = page;
    }

    return {
      baseUrl: base_url,
      endpoint: "trending",
      query: Object.keys(query).length > 0 ? query : undefined,
    };
  }, [base_url, selectedDate, page]);

  const fetchOptions = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token],
  );

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<TrendingRepos>({
    urlArgs,
    fetchOptions,
  });

  return {
    data: response?.repos ? processTrendingRepo(response) : [],
    pagination: response?.pagination || null,
    loading,
    error: error?.error?.message || "",
    refetch,
  };
}

export function processTrendingRepo(data: TrendingRepos): RepoProp[] {
  const processedTrendingRepos = data.repos.map((r: Repo) => {
    return {
      name: r.name,
      owner: r.owner,
      description: r.description,
      url: r.url,
      topics: r.topics,
      language: r.language,
    };
  });
  return processedTrendingRepos;
}
