import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";

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
  const token = env("VITE_DEV_AUTH");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "keywords",
      query: date ? { date } : undefined,
    }),
    [base_url, date],
  );

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
    refetch,
  } = useApi<Keywords>({
    urlArgs,
    fetchOptions,
  });

  return {
    data: response || ({} as Keywords),
    date: "", // Note: The date is now part of the error object if needed
    loading,
    error: error?.error?.message || "",
    refetch,
  };
}
