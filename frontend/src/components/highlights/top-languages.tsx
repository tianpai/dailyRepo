"use client";

import type { LanguageMap } from "../../interface/repository";
import { Pie, PieChart, Cell } from "recharts";
import { toChartData, languageColors } from "@/lib/pie-chart-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTopLanguages } from "@/hooks/repo-data";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useState, useEffect } from "react";

export const description = "A mixed bar chart";

// Hook for providing language data
function useLanguageChartData(numberOfLanguages: number = 10) {
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
  topN,
  onTopNChange,
}: {
  data: ReturnType<typeof toChartData>;
  chartConfig: ChartConfig;
  loading: boolean;
  error: string | null;
  topN: number;
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="topN" className="text-sm">
              Top:
            </Label>
            <Input
              id="topN"
              type="number"
              min="3"
              max="10"
              value={topN}
              onChange={(e) => onTopNChange(e.target.value)}
              className="w-15 h-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => `${value}%`}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Container component that combines data and presentation
export function LanguagesContainer() {
  const [topN, setTopN] = useState(5);
  const { data, chartConfig, loading, error } = useLanguageChartData(topN);

  const handleTopNChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 3 && num <= 10) {
      setTopN(num);
    }
  };

  return (
    <>
      <h2>Top languages</h2>
      <LanguagesChartBarMixed
        data={data}
        chartConfig={chartConfig}
        loading={loading}
        error={error}
        topN={topN}
        onTopNChange={handleTopNChange}
      />
    </>
  );
}
