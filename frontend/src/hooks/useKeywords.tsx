import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { keywordsKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";

export interface Keywords {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: {
    string: number;
  };
}

export function useKeywords(date?: string) {
  const base_url = env("VITE_DATABASE_REPOS");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "keywords",
      query: date ? { date } : undefined,
    }),
    [base_url, date],
  );

  const queryKey = useMemo(() => keywordsKey(base_url, date), [base_url, date]);

  const fetchFn = async (): Promise<Keywords> =>
    get<Keywords>(base_url, "keywords", urlArgs.query);

  const { data: response, isLoading: loading, error, refetch } = useQuery({ queryKey, queryFn: fetchFn, staleTime: STALE_MIN });

  return {
    data: response || ({} as Keywords),
    date: "", // Note: The date is now part of the error object if needed
    loading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}
