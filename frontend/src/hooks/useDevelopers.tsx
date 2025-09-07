import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiV1Base } from "@/lib/env";
import type { Pagination } from "@/interface/endpoint";
import { devsTrendingKey, topDevelopersKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";

export interface DeveloperProps {
  username: string;
  repositoryPath: string;
  profileUrl: string;
  trendingDate: string;
  location?: string;
  avatar_url?: string;
  trendingRecord: string[];
}

export interface Developer extends DeveloperProps {
  _id: string;
}

export interface Developers {
  developers: Developer[];
  pagination: Pagination;
}

/**
 * Custom hook for fetching trending developers data with pagination
 *
 * @param selectedDate - Optional date filter for trending data
 * @param page - Optional page number for pagination (defaults to 1)
 * @returns Object containing developers array, pagination metadata, loading state, and error message
 *
 * @example
 * const { data, pagination, loading, error } = useTrendingDevelopers();
 * const { data, pagination, loading, error } = useTrendingDevelopers(new Date(), 2);
 */
export function useTrendingDevelopers(selectedDate?: Date, page?: number) {
  const apiBase = apiV1Base();

  const urlArgs = useMemo(() => {
    const query: Record<string, string> = {};
    if (selectedDate) {
      query.date = selectedDate.toISOString().split("T")[0];
    }
    if (page && page > 1) {
      query.page = page.toString();
    }

    return {
      baseUrl: apiBase,
      endpoint: ["developers", "trending"],
      query,
    };
  }, [apiBase, selectedDate, page]);

  const dateStr = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : undefined;
  const queryKey = useMemo(
    () => devsTrendingKey(apiBase, dateStr, page),
    [apiBase, dateStr, page],
  );

  const fetchFn = async (): Promise<Developers> =>
    get<Developers>(apiBase, ["developers", "trending"], urlArgs.query);

  const {
    data: response,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: fetchFn,
    placeholderData: keepPreviousData,
    staleTime: STALE_MIN,
  });

  return {
    data: response ? processDevelopers(response) : [],
    pagination: response?.pagination || null,
    loading,
    error: (error as Error | undefined)?.message || "",
  };
}

export function useTopDevelopers() {
  const apiBase = apiV1Base();

  const urlArgs = useMemo(
    () => ({
      baseUrl: apiBase,
      endpoint: ["developers", "top"],
      query: {},
    }),
    [apiBase],
  );

  const queryKey = useMemo(() => topDevelopersKey(apiBase), [apiBase]);

  const fetchFn = async (): Promise<Developers> =>
    get<Developers>(apiBase, ["developers", "top"], urlArgs.query);

  const {
    data: response,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: STALE_MIN,
  });

  return {
    data: response ? processDevelopers(response) : [],
    loading,
    error: (error as Error | undefined)?.message || "",
  };
}

function processDevelopers(data: Developers): DeveloperProps[] {
  const mapped: DeveloperProps[] = data.developers.map(
    (dev: Developer): DeveloperProps => ({
      username: dev.username,
      repositoryPath: dev.repositoryPath,
      profileUrl: dev.profileUrl,
      trendingDate: dev.trendingDate,
      location: dev.location,
      avatar_url: dev.avatar_url,
      trendingRecord: dev.trendingRecord || [],
    }),
  );
  return mapped;
}
