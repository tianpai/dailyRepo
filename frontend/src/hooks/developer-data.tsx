import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";
import type {
  TrendingDevelopersResponse,
  RawDeveloperData,
  DeveloperData,
  UseTrendingDevelopersResult,
} from "@/interface/developer.tsx";

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
export function useTrendingDevelopers(
  selectedDate?: Date,
  page?: number,
): UseTrendingDevelopersResult {
  const base_url = env("VITE_DATABASE_DEVS");
  const token = env("VITE_DEV_AUTH");

  // Memoize URL args to prevent unnecessary re-fetches
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

  // Memoize fetch options
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
  } = useApi<TrendingDevelopersResponse>({
    urlArgs,
    fetchOptions,
  });

  // Transform the response data
  const transformedData = useMemo(() => {
    if (!response) return { data: [], pagination: null };

    const mapped: DeveloperData[] = response.developers.map(
      (dev: RawDeveloperData) => ({
        username: dev.username,
        repositoryPath: dev.repositoryPath,
        profileUrl: dev.profileUrl,
        trendingDate: dev.trendingDate,
        location: dev.location,
        avatar_url: dev.avatar_url,
      }),
    );

    return {
      data: mapped,
      pagination: response.pagination,
    };
  }, [response]);

  return {
    data: transformedData.data,
    pagination: transformedData.pagination,
    loading,
    error: error?.error?.message || "",
  };
}
