import { type DependencyList } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { buildUrlString, type Query } from "@/lib/url-builder";
import type { ApiResponse, ApiError } from "@/interface/endpoint";

export const env = (key: string) => {
  const v = import.meta.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v as string;
};

type FetchRequest = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
};

type UrlArgs = {
  baseUrl: string | URL;
  endpoint?: string | string[];
  query?: Query;
  debug?: boolean;
};

type UseApiParams = {
  urlArgs: UrlArgs;
  fetchOptions?: FetchRequest;
  dependencies?: DependencyList;
  autoFetch?: boolean;
};

/**
 * A React hook for fetching data from API endpoints.
 *
 * The caller needs to use `useMemo` for `urlArgs` and  for `fetchOptions`
 *
 * @param urlArgs - URL configuration (baseUrl, endpoint, query params)
 * @param fetchOptions - Fetch configuration (method, headers, body, signal)
 * @param dependencies - Additional dependencies to trigger re-fetch
 * @param autoFetch - Whether to automatically fetch on mount and dependency changes
 *
 * @returns Object containing data, error, loading state, and refetch function
 *
 * @example
 * const urlArgs = useMemo(() => ({ baseUrl: '/api', endpoint: 'users' }), []);
 * const { data, loading, error, refetch } = useApi<User[]>({ urlArgs });
 */
export function useApi<T>({
  urlArgs,
  fetchOptions = {},
  dependencies = [],
  autoFetch = true,
}: UseApiParams): {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = fetchOptions.signal ?? controller.signal;

    setLoading(true);
    setError(null);

    const url = buildUrlString(
      urlArgs.baseUrl,
      urlArgs.endpoint,
      urlArgs.query,
      urlArgs.debug,
    );

    try {
      const res = await fetch(url, {
        method: "GET",
        ...fetchOptions,
        signal,
      });

      const json: ApiResponse<T> = await res.json();

      if (json.isSuccess) {
        setData(json.data);
      } else {
        setError(json);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError({
        isSuccess: false,
        isCached: false,
        date: new Date().toISOString(),
        error: { code: 0, message: (err as Error).message },
      });
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
  }, [urlArgs, fetchOptions]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, fetchData, ...dependencies]);

  // clean up function to abort fetch on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { data, error, loading, refetch: fetchData };
}
