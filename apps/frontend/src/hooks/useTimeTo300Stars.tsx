import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { timeTo300StarsKey } from "@/lib/query-key";
import { apiV2Base } from "@/lib/env";

export interface TimeTo300Summary {
  totalAnalyzedRepos: number;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  ageFilter: string; // e.g., "YTD"
}

export interface TimeTo300Repo {
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  language: Record<string, number>;
  topics: string[];
  createdAt: string; // ISO date
  daysToThreeHundredStars: number;
  maxStars: number;
  velocity: number; // stars/day toward 300 window
}

export interface TimeTo300Data {
  summary: TimeTo300Summary;
  repos: TimeTo300Repo[];
}

export function useTimeTo300Stars(
  age: "YTD" | "all" | "5y" | "10y" = "YTD",
  sort: "fastest" | "slowest" = "fastest",
) {
  const fetchFn = async (): Promise<TimeTo300Data> =>
    get<TimeTo300Data>(apiV2Base(), ["repos", "time-to-300-stars"], {
      age,
      sort,
    });

  const { data, isLoading, error } = useQuery({
    queryKey: timeTo300StarsKey(age, sort),
    queryFn: fetchFn,
    staleTime: 60_000,
  });

  return {
    summary: data?.summary ?? null,
    repos: data?.repos ?? [],
    isLoading,
    error: (error as Error | undefined)?.message ?? null,
  };
}
