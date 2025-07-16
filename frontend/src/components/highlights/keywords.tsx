import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { COLORS } from "@/lib/color.ts";

import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";

interface KeywordData {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: {
    string: number;
  };
}

import { getOptimalForegroundColor } from "../../lib/fg-color.ts";

function useKeywords() {
  const base_url = env("VITE_DATABASE_REPOS");
  const token = env("VITE_DEV_AUTH");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "keywords",
    }),
    [base_url],
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
  } = useApi<KeywordData>({
    urlArgs,
    fetchOptions,
  });

  return {
    data: response || ({} as KeywordData),
    date: "", // Note: The date is now part of the error object if needed
    loading,
    error: error?.error?.message || "",
    refetch,
  };
}

// Get color for a keyword based on its index
function getKeywordColor(index: number): string {
  const colorKeys = Object.keys(COLORS);
  const colorKey = colorKeys[index % colorKeys.length];
  return COLORS[colorKey as keyof typeof COLORS];
}

function KeywordsDisplay({
  data,
  loading,
  error,
  className,
}: {
  data: KeywordData;
  loading: boolean;
  error: string | null;
  className?: string;
}) {
  return (
    <div className={`rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Top Keywords</h2>
        <p className="text-sm text-gray-400">
          {data?.topKeywords?.length || 0} trending topics
        </p>
        {error ? (
          <div className="text-center text-red-500">
            Error: Can't fetch keywords
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 justify-items-center w-5xl">
        {loading ? (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-20 rounded-full" />
            ))}
          </>
        ) : (
          data?.topKeywords?.map((keyword: string, index: number) => {
            const bgColor = getKeywordColor(index);
            const textColor = getOptimalForegroundColor(bgColor);
            return (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-3 py-1 border-0 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                {keyword}
              </Badge>
            );
          })
        )}
      </div>
    </div>
  );
}

export function KeywordsContainer({ className }: { className?: string }) {
  const { data, loading, error } = useKeywords();

  return (
    <KeywordsDisplay
      data={data}
      loading={loading}
      error={error}
      className={className}
    />
  );
}
