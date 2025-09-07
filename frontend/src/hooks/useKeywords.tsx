import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { buildUrlString } from "@/lib/url-builder";
import type { ApiResponse } from "@/interface/endpoint";

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

  const queryKey = useMemo(
    () => ["keywords", base_url, date || null],
    [base_url, date],
  );

  const fetchFn = async (): Promise<Keywords> => {
    const url = buildUrlString(urlArgs.baseUrl, urlArgs.endpoint, urlArgs.query);
    const res = await fetch(url);
    const json: ApiResponse<Keywords> = await res.json();
    if (json.isSuccess) return json.data;
    throw new Error(json.error.message);
  };

  const { data: response, isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: 60_000,
  });

  return {
    data: response || ({} as Keywords),
    date: "", // Note: The date is now part of the error object if needed
    loading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}
