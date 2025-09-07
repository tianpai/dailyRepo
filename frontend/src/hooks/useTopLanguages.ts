import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LanguageMap } from "@/interface/repository";
import { env } from "@/lib/env";
import { type Query, buildUrlString } from "@/lib/url-builder";
import type { ApiResponse } from "@/interface/endpoint";

type TopLangResponse = { data: LanguageMap; count?: number };

export function useTopLanguages(numberOfLanguages: number = 10) {
  const baseUrl = env("VITE_DATABASE_LANGUAGES");

  const urlArgs = useMemo(
    () => ({
      baseUrl,
      endpoint: "language-list",
      query:
        numberOfLanguages > 0
          ? ({ top: Math.min(numberOfLanguages, 15) } as Query)
          : undefined,
    }),
    [baseUrl, numberOfLanguages],
  );

  const queryKey = useMemo(
    () => ["top-languages", urlArgs.baseUrl, urlArgs.query?.top ?? 10],
    [urlArgs.baseUrl, urlArgs.query?.top],
  );

  const fetchFn = async (): Promise<LanguageMap> => {
    const url = buildUrlString(urlArgs.baseUrl, urlArgs.endpoint, urlArgs.query);
    const res = await fetch(url);
    const json: ApiResponse<TopLangResponse> = await res.json();
    if (json.isSuccess) return json.data.data;
    throw new Error(json.error.message);
  };

  const { data, isLoading, error } = useQuery({ queryKey, queryFn: fetchFn, staleTime: 60_000 });

  return {
    data: (data ?? {}) as LanguageMap,
    loading: isLoading,
    error: (error as Error | undefined)?.message ?? null,
  };
}
