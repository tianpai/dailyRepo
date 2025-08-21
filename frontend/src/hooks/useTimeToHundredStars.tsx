import { useState, useEffect } from "react";
import { buildUrl } from "@/lib/url-builder";

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
  const [data, setData] = useState<TimeToHundredStarsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const fetchTimeToHundredStars = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const url = buildUrl("/api/v1/repos/time-to-100-stars");
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setIsCached(result.isCached || false);
        } else {
          throw new Error(
            result.message || "Failed to fetch time to 100 stars data",
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching time to 100 stars data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeToHundredStars();
  }, []);

  return {
    data,
    isLoading,
    error,
    isCached,
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
