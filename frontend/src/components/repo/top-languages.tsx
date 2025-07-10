"use client";

import type { LanguageMap } from "../../interface/repository";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { toChartData, languageColors } from "@/lib/pie-chart-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopLanguages } from "@/hooks/repo-data";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo } from "react";

export const description = "A mixed bar chart";

// Hook for providing language data
function useLanguageChartData(numberOfLanguages: number = 5) {
  const { data, loading, error } = useTopLanguages(numberOfLanguages);

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
}: {
  data: ReturnType<typeof toChartData>;
  chartConfig: ChartConfig;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full"> Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        Error: Fetching language
      </div>
    );
  }

  return (
    <Card className="flex flex-col w-full">
      <CardHeader>
        <CardTitle>Overall Languages</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="language"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Container component that combines data and presentation
export function LanguagesContainer() {
  const { data, chartConfig, loading, error } = useLanguageChartData();

  return (
    <LanguagesChartBarMixed
      data={data}
      chartConfig={chartConfig}
      loading={loading}
      error={error}
    />
  );
}
