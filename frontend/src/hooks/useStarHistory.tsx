import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { bulkStarHistoryKey } from "@/lib/query-key";
import { postJson } from "@/lib/api";

export interface StarDataPoint {
  date: string;
  count: number;
}
export type RepoStarHistory = Record<string, StarDataPoint[]>;

// old
// export type StarHistoryData = Record<string, starDataPoint[]>;

export function useBulkStarHistory(repoNames: string[]) {
  const base_url = env("VITE_DATABASE_REPOS");

  const queryKey = useMemo(
    () => bulkStarHistoryKey(base_url, repoNames),
    [base_url, repoNames],
  );

  const fetchFn = async (): Promise<RepoStarHistory> =>
    postJson<RepoStarHistory>(base_url, "star-history", { repoNames });

  const { data: response, isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: repoNames.length > 0,
  });

  return {
    data: response || {},
    pagination: response?.pagination || null,
    loading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}

export interface NormalizedDayData {
  day: number;
  [repoName: string]: number; // repo names as keys with star counts as values
}

export function convertToNormalizedDays(
  starHistory: RepoStarHistory,
): NormalizedDayData[] {
  const repoNames = Object.keys(starHistory);

  // Find the earliest date across all repositories
  let earliestDate = new Date("9999-12-31");

  repoNames.forEach((repoName) => {
    const repoData = starHistory[repoName];
    if (repoData.length > 0) {
      const firstDate = new Date(repoData[0].date);
      if (firstDate < earliestDate) {
        earliestDate = firstDate;
      }
    }
  });

  // Convert each repository's data to day-based format
  const dayDataMap = new Map<number, NormalizedDayData>();

  repoNames.forEach((repoName) => {
    const repoData = starHistory[repoName];
    const shortRepoName = repoName.split("/")[1]; // Get repo name without owner

    repoData.forEach((entry) => {
      const entryDate = new Date(entry.date);
      const daysDiff = Math.floor(
        (entryDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (!dayDataMap.has(daysDiff)) {
        dayDataMap.set(daysDiff, { day: daysDiff });
      }

      const dayData = dayDataMap.get(daysDiff)!;
      dayData[shortRepoName] = entry.count;
    });
  });

  // Convert map to sorted array
  const sortedResult = Array.from(dayDataMap.values()).sort(
    (a, b) => a.day - b.day,
  );

  // Fill in missing values with interpolation to create smooth lines
  const repoShortNames = repoNames.map((name) => name.split("/")[1]);
  const filledResult: NormalizedDayData[] = [];

  // Create repository data maps for easier lookup
  const repoDataMaps: Record<string, Map<number, number>> = {};
  repoNames.forEach((repoName) => {
    const shortName = repoName.split("/")[1];
    const dataMap = new Map<number, number>();

    starHistory[repoName].forEach((entry) => {
      const entryDate = new Date(entry.date);
      const daysDiff = Math.floor(
        (entryDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      dataMap.set(daysDiff, entry.count);
    });

    repoDataMaps[shortName] = dataMap;
  });

  // Get the range of days
  const minDay = sortedResult[0]?.day || 0;
  const maxDay = sortedResult[sortedResult.length - 1]?.day || 0;

  // Helper function to interpolate between two points
  function interpolate(day: number, repoName: string): number | undefined {
    const dataMap = repoDataMaps[repoName];
    if (!dataMap) return undefined;

    // If we have exact data for this day, use it
    if (dataMap.has(day)) {
      return dataMap.get(day)!;
    }

    // Find the closest points before and after this day
    let beforeDay = -1;
    let afterDay = -1;

    for (const [dataDay] of dataMap) {
      if (dataDay <= day && dataDay > beforeDay) {
        beforeDay = dataDay;
      }
      if (dataDay >= day && (afterDay === -1 || dataDay < afterDay)) {
        afterDay = dataDay;
      }
    }

    // If no data points exist yet, repo hasn't started
    if (beforeDay === -1 && afterDay === -1) {
      return undefined;
    }

    // If only future data exists, repo hasn't started yet
    if (beforeDay === -1) {
      return undefined;
    }

    // If no future data, use the last known value
    if (afterDay === -1) {
      return dataMap.get(beforeDay)!;
    }

    // If before and after are the same point, use that value
    if (beforeDay === afterDay) {
      return dataMap.get(beforeDay)!;
    }

    // Linear interpolation between the two points
    const beforeValue = dataMap.get(beforeDay)!;
    const afterValue = dataMap.get(afterDay)!;
    const ratio = (day - beforeDay) / (afterDay - beforeDay);

    return Math.round(beforeValue + (afterValue - beforeValue) * ratio);
  }

  // Create continuous data for every day in the range
  for (let day = minDay; day <= maxDay; day++) {
    const dayData: NormalizedDayData = { day };

    repoShortNames.forEach((repoName) => {
      const interpolatedValue = interpolate(day, repoName);
      if (interpolatedValue !== undefined) {
        dayData[repoName] = interpolatedValue;
      }
    });

    filledResult.push(dayData);
  }

  return filledResult;
}
