import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { buildUrlString } from "@/lib/url-builder";
import type { ApiResponse } from "@/interface/endpoint";

interface ClusterCount {
  [topics: string]: number;
}

export interface LanguageTopicMap {
  [language: string]: ClusterCount;
}

export function useTopicsByLanguage() {
  const base_url = env("VITE_DATABASE_REPOS");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "topics-by-language",
    }),
    [base_url],
  );

  const queryKey = useMemo(() => ["topics-by-language", urlArgs.baseUrl], [urlArgs.baseUrl]);

  const fetchFn = async (): Promise<LanguageTopicMap> => {
    const url = buildUrlString(urlArgs.baseUrl, urlArgs.endpoint);
    const res = await fetch(url);
    const json: ApiResponse<LanguageTopicMap> = await res.json();
    if (json.isSuccess) return json.data;
    throw new Error(json.error.message);
  };

  const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn: fetchFn, staleTime: 60_000 });

  return {
    data: data || ({} as LanguageTopicMap),
    date: "",
    loading: isLoading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}
