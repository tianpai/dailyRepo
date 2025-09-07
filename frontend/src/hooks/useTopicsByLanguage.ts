import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiV1Base } from "@/lib/env";
import { topicsByLanguageKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";

interface ClusterCount {
  [topics: string]: number;
}

export interface LanguageTopicMap {
  [language: string]: ClusterCount;
}

export function useTopicsByLanguage() {
  const base_url = apiV1Base();

  const queryKey = useMemo(() => topicsByLanguageKey(base_url), [base_url]);

  const fetchFn = async (): Promise<LanguageTopicMap> =>
    get<LanguageTopicMap>(base_url, ["repos", "topics-by-language"]);

  const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn: fetchFn, staleTime: STALE_MIN });

  return {
    data: data || ({} as LanguageTopicMap),
    date: "",
    loading: isLoading,
    error: (error as Error | undefined)?.message || "",
    refetch,
  };
}
