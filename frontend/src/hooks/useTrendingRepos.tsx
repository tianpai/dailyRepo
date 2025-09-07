import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { buildUrlString } from "@/lib/url-builder";
import type { ApiResponse } from "@/interface/endpoint";
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
  const base_url = env("VITE_DATABASE_REPOS");

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

  const queryKey = useMemo(
    () => [
      "trending-repos",
      base_url,
      selectedDate ? selectedDate.toISOString().split("T")[0] : undefined,
      page ?? 1,
    ],
    [base_url, selectedDate, page],
  );

  const fetchFn = async (): Promise<Repos> => {
    const url = buildUrlString(
      urlArgs.baseUrl,
      urlArgs.endpoint,
      urlArgs.query,
    );
    const res = await fetch(url);
    const json: ApiResponse<Repos> = await res.json();
    if (json.isSuccess) return json.data;
    throw new Error(json.error.message);
  };

  const { data: response, isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchFn,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
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
