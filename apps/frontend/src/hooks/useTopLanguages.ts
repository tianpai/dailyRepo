import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LanguageMap } from "@/interface/repository";
import { apiV2Base } from "@/lib/env";
import { type Query } from "@/lib/url-builder";
import { topLanguagesKey } from "@/lib/query-key";
import { get } from "@/lib/api";
import { STALE_MIN } from "@/lib/constants";

type TopLangResponse = { data: LanguageMap; count?: number };

export function useTopLanguages(numberOfLanguages: number = 10) {
  const baseUrl = apiV2Base();

  const params = useMemo(
    () =>
      numberOfLanguages > 0
        ? ({ top: Math.min(numberOfLanguages, 15) } as Query)
        : undefined,
    [numberOfLanguages],
  );

  const queryKey = useMemo(
    () =>
      topLanguagesKey(
        baseUrl,
        ((params as Query | undefined)?.top as number | undefined) ?? 10,
      ),
    [baseUrl, params],
  );

  const fetchFn = async (): Promise<LanguageMap> =>
    get<TopLangResponse>(baseUrl, ["languages", "top"], params).then(
      (r) => r.data,
    );

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: STALE_MIN,
  });

  return {
    data: (data ?? {}) as LanguageMap,
    loading: isLoading,
    error: (error as Error | undefined)?.message ?? null,
  };
}
