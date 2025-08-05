import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";
import { type Pagination } from "@/interface/endpoint";

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
  const token = env("VITE_DEV_AUTH");

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
  } = useApi<Developers>({
    urlArgs,
    fetchOptions,
  });

  return {
    data: response ? processDevelopers(response) : [],
    pagination: response?.pagination || null,
    loading,
    error: error?.error?.message || "",
  };
}

function processDevelopers(
  data: Developers,
): DeveloperProps[] {
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
