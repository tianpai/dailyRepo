import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { env } from "@/lib/env";
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
  const base_url = env("VITE_DATABASE_DEVS");

  const urlArgs = useMemo(() => {
    const query: Record<string, string> = {};
    if (selectedDate) {
      query.date = selectedDate.toISOString().split("T")[0];
    }
    if (page && page > 1) {
      query.page = page.toString();
    }

    return {
      baseUrl: base_url,
      endpoint: "trending",
      query,
    };
  }, [base_url, selectedDate, page]);

  const dateStr = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : undefined;
  const queryKey = useMemo(
    () => devsTrendingKey(base_url, dateStr, page),
    [base_url, dateStr, page],
  );

  const fetchFn = async (): Promise<Developers> =>
    get<Developers>(base_url, "trending", urlArgs.query);

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
  const base_url = env("VITE_DATABASE_DEVS");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "top",
      query: {},
    }),
    [base_url],
  );

  const queryKey = useMemo(() => topDevelopersKey(base_url), [base_url]);

  const fetchFn = async (): Promise<Developers> =>
    get<Developers>(base_url, "top", urlArgs.query);

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
