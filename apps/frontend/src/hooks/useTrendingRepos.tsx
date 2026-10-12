import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiV2Base } from "@/lib/env";
import { reposTrendingKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";
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
  trendingRecord: string[];
}

interface Repos {
  repos: Repo[];
  pagination: Pagination;
}

export interface RepoProps {
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

export interface RepoCardProps extends Repo {
  rank: number;
}

export function useTrendingRepos(selectedDate?: Date, page?: number) {
  const apiBase = apiV2Base();

  const params = useMemo(() => {
    const q: Record<string, string | number> = {};
    if (selectedDate) q.date = selectedDate.toISOString().split("T")[0];
    if (page && page > 1) q.page = page;
    return Object.keys(q).length ? q : undefined;
  }, [selectedDate, page]);

  const dateStr = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : undefined;
  const queryKey = useMemo(
    () => reposTrendingKey(apiBase, dateStr, page),
    [apiBase, dateStr, page],
  );

  const fetchFn = async (): Promise<Repos> =>
    get<Repos>(apiBase, ["repos", "trending"], params);

  const {
    data: response,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchFn,
    placeholderData: keepPreviousData,
    staleTime: STALE_MIN,
  });

  return {
    data: response?.repos ? processRepos(response) : [],
    pagination: response?.pagination || null,
    loading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}

export function processRepos(data: Repos): RepoProps[] {
  const processedRepos = data.repos.map((r: Repo) => {
    return {
      name: r.name,
      owner: r.owner,
      description: r.description,
      url: r.url,
      topics: r.topics,
      language: r.language,
      trendingRecord: r.trendingRecord || [],
      license: r.license || "",
      createdAt: r.createdAt || "",
    };
  });
  return processedRepos;
}
