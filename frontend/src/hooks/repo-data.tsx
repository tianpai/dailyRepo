/**
 * @fileoverview Custom React hooks for fetching repository data and star history
 *
 * This module provides hooks for interacting with the repository API endpoints:
 * - useRepoData: Fetches repository data from any endpoint (trending, ranking, etc.)
 * - useStarHistory: Fetches star history for a specific repository
 * - useTrendingStarHistory: Fetches star history for all trending repositories
 *
 * All hooks include loading states, error handling, and automatic token authentication.
 */

import { useState, useEffect } from "react";
import type {
  RawRepoApiResponse,
  RawStarHistoryApiResponse,
  RawRepoData,
  RepoData,
  starDataPoint,
  ApiResponse,
  PaginationMetadata,
} from "@/interface/repository.tsx";

/**
 * Custom hook for fetching repository data from any API endpoint
 *
 * @param endpoint - The API endpoint path (e.g., '/trending', '/ranking')
 * @param selectedDate - Optional date filter for trending data
 * @param page - Optional page number for pagination (defaults to 1)
 * @returns Object containing data array, pagination metadata, loading state, and error message
 *
 * @example
 * const { data, pagination, loading, error } = useRepoData('/trending');
 * const { data, pagination, loading, error } = useRepoData('/trending', new Date(), 2);
 */
export function useRepoData(
  endpoint: string,
  selectedDate?: Date,
  page?: number,
) {
  // Get environment variables for API base URL and authentication token
  const base_url = import.meta.env.VITE_DATABASE_REPOS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  // State management for API response data, loading, and error states
  const [data, setData] = useState<RepoData[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Construct the full API URL with optional date and page parameters
  const params = new URLSearchParams();
  if (selectedDate) {
    params.append("date", selectedDate.toISOString().split("T")[0]);
  }
  if (page && page > 1) {
    params.append("page", page.toString());
  }
  const queryString = params.toString();
  const trending_url = `${base_url}${endpoint}${queryString ? `?${queryString}` : ""}`;

  useEffect(() => {
    /**
     * Async function to fetch repository data from the API
     * Transforms raw API response into UI-friendly format
     */
    const fetchData = async () => {
      try {
        // Make authenticated API request
        const res = await fetch(trending_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");

        // Parse JSON response
        const json = (await res.json()) as RawRepoApiResponse;

        // Transform raw repository data into UI-friendly format
        // Extracts only the fields needed for display components
        const mapped: RepoData[] = json.data.map((r: RawRepoData) => {
          return {
            name: r.name,
            owner: r.owner,
            description: r.description,
            url: r.url,
            topics: r.topics,
            trendingDate: r.trendingDate,
            language: r.language,
          };
        });
        setData(mapped);

        // Set pagination metadata from backend response
        setPagination(json.pagination);
      } catch (err) {
        // Handle and store error messages
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // Always set loading to false when request completes
        setLoading(false);
      }
    };
    fetchData();
  }, [trending_url, token]); // Re-run when URL, token, date, or page changes

  return { data, pagination, loading, error };
}

/**
 * Custom hook for fetching star history data for a specific repository
 *
 * @param fullname - The full repository name in format "owner/repo"
 * @returns Object containing star history data points, loading state, and error message
 *
 * @example
 * const { data, loading, error } = useStarHistory('facebook/react');
 * // data will be an array of { date: string, count: number } objects
 */
export function useStarHistory(fullname: string) {
  // Get environment variables for API base URL and authentication token
  const base_url = import.meta.env.VITE_DATABASE_REPOS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  // State management for star history data points
  const [data, setData] = useState<starDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Construct API URL for specific repository star history
  const starhiotory_url = `${base_url + "/" + fullname}/star-history`;

  useEffect(() => {
    /**
     * Async function to fetch star history data for the specified repository
     */
    const fetchData = async () => {
      try {
        // Make authenticated API request
        const res = await fetch(starhiotory_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");

        // Parse JSON response and extract star history data
        const json = (await res.json()) as RawStarHistoryApiResponse;
        // json.data is Record<string, starDataPoint[]>, we need to get the specific repo data
        const repoData = json.data[fullname];
        if (repoData) {
          setData(repoData);
        } else {
          setError(`No star history found for ${fullname}`);
        }
      } catch (err) {
        // Handle and store error messages
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // Always set loading to false when request completes
        setLoading(false);
      }
    };
    fetchData();
  }, [starhiotory_url, token, fullname]); // Re-run when URL, token, or fullname changes

  return { data, loading, error };
}

/**
 * Custom hook for fetching star history data for all trending repositories
 *
 * @returns Object containing grouped star history data, loading state, and error message
 *
 * @example
 * const { data, loading, error } = useTrendingStarHistory();
 * // data will be an object like:
 * // {
 * //   "facebook/react": [{ date: "2024-01-01", count: 220000 }, ...],
 * //   "microsoft/vscode": [{ date: "2024-01-01", count: 160000 }, ...]
 * // }
 */
export function useTrendingStarHistory(selectedDate?: Date) {
  // Get environment variables for API base URL and authentication token
  const base_url = import.meta.env.VITE_DATABASE_REPOS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  // State management for grouped star history data (repo name -> star history array)
  const [data, setData] = useState<Record<string, starDataPoint[]>>({});
  const [actualDate, setActualDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Construct API URL for trending repositories star history with optional date parameter
  const dateParam = selectedDate
    ? `?date=${selectedDate.toISOString().split("T")[0]}`
    : "";
  const star_history_url = `${base_url}/star-history${dateParam}`;

  useEffect(() => {
    /**
     * Async function to fetch star history data for all trending repositories
     * Returns data grouped by repository full name
     */
    const fetchData = async () => {
      try {
        // Make authenticated API request
        const res = await fetch(star_history_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");

        // Parse JSON response and extract grouped star history data
        const json = (await res.json()) as ApiResponse<
          Record<string, starDataPoint[]>
        >;
        setData(json.data); // Format: { "repo/name": [...starDataPoints] }
        setActualDate(json.date); // Store the actual date from API response
      } catch (err) {
        // Handle and store error messages
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // Always set loading to false when request completes
        setLoading(false);
      }
    };
    fetchData();
  }, [star_history_url, token]); // Re-run when URL, token, or date changes

  return { data, actualDate, loading, error };
}

/**
 * Custom hook for fetching star history data for multiple repositories in bulk
 *
 * @param repoNames - Array of repository names in format "owner/repo"
 * @returns Object containing grouped star history data, loading state, and error message
 *
 * @example
 * const { data, loading, error } = useBulkStarHistory(['facebook/react', 'microsoft/vscode']);
 * // data will be an object like:
 * // {
 * //   "facebook/react": [{ date: "2024-01-01", count: 220000 }, ...],
 * //   "microsoft/vscode": [{ date: "2024-01-01", count: 160000 }, ...]
 * // }
 */
export function useBulkStarHistory(repoNames: string[]) {
  const base_url = import.meta.env.VITE_DATABASE_REPOS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  const [data, setData] = useState<Record<string, starDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const bulk_star_history_url = `${base_url}/star-history`;

  useEffect(() => {
    if (!repoNames.length) {
      setData({});
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(bulk_star_history_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repoNames }),
        });

        if (!res.ok) throw new Error("Failed to fetch bulk star history");

        const json = await res.json();
        setData(json.data || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoNames, bulk_star_history_url]);

  return { data, loading, error };
}
