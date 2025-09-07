import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildUrlString } from "@/lib/url-builder";

interface TimeToHundredStarsRepo {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  language: Record<string, number>;
  topics: string[];
  createdAt: string;
  age: number;
  daysToHundredStars: number;
  hundredStarDate: string;
  hundredStarCount: number;
  starVelocity: number;
}

interface CategorySummary {
  ageCategory: string;
  totalRepos: number;
  averageDays: number;
}

interface TimeToHundredStarsData {
  summary: {
    totalAnalyzedRepos: number;
    categories: CategorySummary[];
  };
  reposByCategory: Record<string, TimeToHundredStarsRepo[]>;
}

interface UseTimeToHundredStarsReturn {
  data: TimeToHundredStarsData | null;
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
}

export function useTimeToHundredStars(): UseTimeToHundredStarsReturn {
  const url = useMemo(
    () => buildUrlString("/api/v1", ["repos", "time-to-100-stars"]),
    [],
  );

  type RawResponse = {
    success: boolean;
    data: TimeToHundredStarsData;
    isCached?: boolean;
    message?: string;
  };

  const fetchFn = async (): Promise<{
    data: TimeToHundredStarsData;
    isCached: boolean;
  }> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: RawResponse = await res.json();
    if (json.success)
      return { data: json.data, isCached: json.isCached ?? false };
    throw new Error(json.message || "Failed to fetch time to 100 stars data");
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["time-to-100-stars"],
    queryFn: fetchFn,
    staleTime: 60_000,
  });

  return {
    data: data?.data ?? null,
    isLoading,
    error: (error as Error | undefined)?.message ?? null,
    isCached: data?.isCached ?? false,
  };
}

// Helper function to get data for a specific age category
export function useTimeToHundredStarsByCategory(category: string) {
  const { data, isLoading, error, isCached } = useTimeToHundredStars();

  return {
    repos: data?.reposByCategory[category] || [],
    categoryInfo:
      data?.summary.categories.find((cat) => cat.ageCategory === category) ||
      null,
    isLoading,
    error,
    isCached,
  };
}
