"use client";

import type { LanguageMap } from "@/interface/repository";
import { RepoLanguage } from "@/components/repo/repo-language";
import { toChartData } from "@/lib/pie-chart-data";
import { useApi, env } from "@/hooks/useApi";
import { type Query } from "@/lib/url-builder";
import { useMemo } from "react";

type TopLangResponse = { data: LanguageMap; count?: number };

// fetch data from endpoint and transform it into a format suitable for the ASCII bar
function useLanguageData(numberOfLanguages: number = 10) {
  const baseUrl = env("VITE_DATABASE_LANGUAGES");
  const token = env("VITE_DEV_AUTH");

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

  const fetchOptions = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  const {
    data: raw,
    loading,
    error: apiError,
  } = useApi<TopLangResponse>({ urlArgs, fetchOptions });

  const data = useMemo(() => raw?.data ?? {}, [raw]);
  const error = useMemo(() => apiError?.error?.message ?? null, [apiError]);

  return {
    data: data as LanguageMap,
    loading,
    error,
  };
}

// Component to show detailed breakdown for programming languages
function ProgrammingLanguagesBreakdown({
  language,
}: {
  language: LanguageMap;
}) {
  const chartData = toChartData(language);

  // Get screen width to determine threshold
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 768;
  const threshold = screenWidth <= 440 ? 60 : 80; // Lower threshold for small screens

  let cumulativePercentage = 0;
  const displayLanguages: Array<{ language: string; count: number }> = [];
  const otherLanguages: Array<{ language: string; count: number }> = [];

  for (const item of chartData) {
    if (cumulativePercentage < threshold) {
      displayLanguages.push(item);
      cumulativePercentage += item.count;
    } else {
      otherLanguages.push(item);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {/* Main languages percentages */}
      <div className="flex flex-wrap gap-3">
        {displayLanguages.map((item) => (
          <span
            key={item.language}
            className="major-mono text-sm text-description"
          >
            {item.language}: {item.count}%
          </span>
        ))}
      </div>

      {/* Other languages breakdown */}
      {otherLanguages.length > 0 && (
        <div className="space-y-1">
          <span className="major-mono text-sm text-description">
            Other ({otherLanguages.reduce((sum, item) => sum + item.count, 0)}
            %): {otherLanguages.map((item) => item.language).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

// Presentational component for the ASCII language bar
function LanguagesAsciiBar({
  data,
  loading,
  error,
}: {
  data: LanguageMap;
  loading: boolean;
  error: string | null;
}) {
  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-32">{message}</div>
  );

  if (loading) return renderStateMessage("Loading...");
  if (error) return renderStateMessage("Error: Fetching language");

  return (
    <div className="border-2 border-border bg-background text-foreground">
      {/* ASCII Header */}
      <div className="border-b-2 border-border p-4">
        <div>
          <h3 className="major-mono text-lg font-normal text-foreground">
            PROGRAMMING LANGUAGES
          </h3>
          <p className="major-mono text-sm text-description mt-1">
            Distribution of popular languages (top 10)
          </p>
        </div>
      </div>

      {/* ASCII Language Bar */}
      <div className="p-4">
        <RepoLanguage language={data} showTitle={false} title="" />
        {/* Custom percentage display always on next line */}
        <ProgrammingLanguagesBreakdown language={data} />
      </div>
    </div>
  );
}

// Container component that combines data and presentation
export function LanguagesContainer() {
  const { data, loading, error } = useLanguageData(10);

  return <LanguagesAsciiBar data={data} loading={loading} error={error} />;
}
