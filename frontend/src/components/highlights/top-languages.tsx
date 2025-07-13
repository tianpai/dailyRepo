"use client";

import type { LanguageMap } from "@/interface/repository";
import { Pie, PieChart, Cell } from "recharts";
import { toChartData, languageColors } from "@/lib/pie-chart-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi, env } from "@/hooks/useApi";
import { type Query } from "@/lib/url-builder";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useState, useEffect } from "react";

type TopLangResponse = { data: LanguageMap; count?: number };

// fetch data from endpoint and transform it into a format suitable for the chart
function useLanguageChartData(numberOfLanguages: number = 10) {
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

  // Create dynamic chart configuration based on the language data
  const chartConfig = useMemo(() => {
    if (!data) return { count: { label: "Count" } } satisfies ChartConfig;

    const config: ChartConfig = {
      count: {
        label: "Count",
      },
    };

    // Add configuration for each language with its color
    Object.keys(data).forEach((language) => {
      config[language] = {
        label: language,
        color: languageColors[language] || "#000000",
      };
    });

    return config;
  }, [data]);

  const chartData = useMemo(() => {
    return data ? toChartData(data as LanguageMap) : [];
  }, [data]);

  return {
    data: chartData,
    chartConfig,
    loading,
    error,
  };
}

// Presentational component for the language chart
function LanguagesChartBarMixed({
  data,
  chartConfig,
  loading,
  error,
  topN,
  onTopNChange,
}: {
  data: ReturnType<typeof toChartData>;
  chartConfig: ChartConfig;
  loading: boolean;
  error: string | null;
  topN: string;
  onTopNChange: (value: string) => void;
}) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getRadiusValues = () => {
    if (windowWidth <= 393) return { inner: 10, outer: 50 };
    if (windowWidth <= 440) return { inner: 20, outer: 70 };
    if (windowWidth <= 900) return { inner: 30, outer: 120 };
    return { inner: 50, outer: 150 };
  };

  const { inner, outer } = getRadiusValues();

  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-full">{message}</div>
  );

  if (loading) return renderStateMessage("Loading...");
  if (error) return renderStateMessage("Error: Fetching language");

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Programming Languages</h3>
        <p className="text-sm text-gray-400">
          Distribution of popular languages (max 10 languages)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="topN" className="text-sm font-medium">
          Top:
        </Label>
        <Input
          id="topN"
          type="number"
          min="3"
          max="10"
          value={topN}
          onChange={(e) => onTopNChange(e.target.value)}
          className="w-16 h-8"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
    </div>
  );

  const pieChart = (
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={({ language, count }) => `${language}: ${count}%`}
      innerRadius={inner}
      outerRadius={outer}
      dataKey="count"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.fill} />
      ))}
    </Pie>
  );

  const tooltip = (
    <ChartTooltip
      content={
        <ChartTooltipContent hideLabel formatter={(value) => `${value}%`} />
      }
    />
  );

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-4">{header}</CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            {pieChart}
            {tooltip}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Container component that combines data and presentation
export function LanguagesContainer() {
  const [topN, setTopN] = useState(5);
  const [topNInput, setTopNInput] = useState("5");
  const { data, chartConfig, loading, error } = useLanguageChartData(topN);

  const handleTopNChange = (value: string) => {
    setTopNInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 3 && num <= 10) {
      setTopN(num);
    }
  };

  return (
    <div className="rounded-lg shadow-md">
      <LanguagesChartBarMixed
        data={data}
        chartConfig={chartConfig}
        loading={loading}
        error={error}
        topN={topNInput}
        onTopNChange={handleTopNChange}
      />
    </div>
  );
}
