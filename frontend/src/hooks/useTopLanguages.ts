import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LanguageMap } from "@/interface/repository";
import { env } from "@/lib/env";
import { type Query } from "@/lib/url-builder";
import { topLanguagesKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";

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
    () =>
      topLanguagesKey(
        baseUrl,
        (urlArgs.query as Query | undefined)?.top as number | undefined ?? 10,
      ),
    [baseUrl, urlArgs.query],
  );

  const fetchFn = async (): Promise<LanguageMap> =>
    get<TopLangResponse>(baseUrl, "language-list", urlArgs.query).then(
      (r) => r.data,
    );

  const { data, isLoading, error } = useQuery({ queryKey, queryFn: fetchFn, staleTime: STALE_MIN });

  return {
    data: (data ?? {}) as LanguageMap,
    loading: isLoading,
    error: (error as Error | undefined)?.message ?? null,
  };
}
