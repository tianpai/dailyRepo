import { useState, useEffect } from "react";
import type {
  TrendingDevelopersResponse,
  DeveloperDetailsResponse,
  RawDeveloperData,
  DeveloperData,
  PaginationMetadata,
  UseTrendingDevelopersResult,
  UseDeveloperDetailsResult,
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
  const base_url = import.meta.env.VITE_DATABASE_DEVS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  const [data, setData] = useState<DeveloperData[]>([]);
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
  const developers_url = `${base_url}/trending${queryString ? `?${queryString}` : ""}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(developers_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch developers");

        const json = (await res.json()) as TrendingDevelopersResponse;

        // Transform raw developer data into UI-friendly format
        const mapped: DeveloperData[] = json.developers.map(
          (dev: RawDeveloperData) => ({
            username: dev.username,
            repositoryPath: dev.repositoryPath,
            profileUrl: dev.profileUrl,
            trendingDate: dev.trendingDate,
            location: dev.location,
            avatar_url: dev.avatar_url,
          }),
        );

        setData(mapped);
        setPagination(json.pagination);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [developers_url, token]);

  return { data, pagination, loading, error };
}

/**
 * Custom hook for fetching detailed information for a single developer
 *
 * @param username - The GitHub username of the developer
 * @returns Object containing developer data, loading state, and error message
 *
 * @example
 * const { data, loading, error } = useDeveloperDetails('octocat');
 */
export function useDeveloperDetails(
  username: string,
): UseDeveloperDetailsResult {
  const base_url = import.meta.env.VITE_DATABASE_DEVS as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token) throw new Error("Missing token in env");

  const [data, setData] = useState<DeveloperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const developer_url = `${base_url}/developers/${username}`;

  useEffect(() => {
    if (!username) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(developer_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Developer not found");
          }
          throw new Error("Failed to fetch developer details");
        }

        const json = (await res.json()) as DeveloperDetailsResponse;

        if (!json.developer) {
          throw new Error(json.message || "Developer not found");
        }

        // Transform raw developer data into UI-friendly format
        const mapped: DeveloperData = {
          username: json.developer.username,
          repositoryPath: json.developer.repositoryPath,
          profileUrl: json.developer.profileUrl,
          trendingDate: json.developer.trendingDate,
          location: json.developer.location,
          avatar_url: json.developer.avatar_url,
        };

        setData(mapped);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [developer_url, token, username]);

  return { data, loading, error };
}
