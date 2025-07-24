"use client";

import type { LanguageMap } from "@/interface/repository";
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { toChartData } from "@/lib/pie-chart-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi, env } from "@/hooks/useApi";
import { type Query } from "@/lib/url-builder";
import { useMemo, useState } from "react";

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

  const chartData = useMemo(() => {
    return data ? toChartData(data as LanguageMap) : [];
  }, [data]);

  return {
    data: chartData,
    loading,
    error,
  };
}

// Presentational component for the language chart
function LanguagesChartBarMixed({
  data,
  loading,
  error,
  topN,
  onTopNChange,
}: {
  data: ReturnType<typeof toChartData>;
  loading: boolean;
  error: string | null;
  topN: string;
  onTopNChange: (value: string) => void;
}) {
  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-full">{message}</div>
  );

  if (loading) return renderStateMessage("Loading...");
  if (error) return renderStateMessage("Error: Fetching language");

  const header = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
          className="w-20 h-8"
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
      innerRadius={30}
      outerRadius={120}
      dataKey="count"
    >
      {data.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={entry.fill}
          name={`${entry.language} (${entry.count}%)`}
        />
      ))}
    </Pie>
  );

  return (
    <Card>
      <CardHeader className="pb-2">{header}</CardHeader>
      <CardContent className="flex justify-center">
        <div className="h-[400px] sm:h-[500px] w-full max-w-md">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {pieChart}
              <Tooltip
                formatter={(value, _name, props) => [
                  `${props?.payload?.language || "Unknown"} ${value}%`,
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "rgba(30, 30, 30, 0.9)",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
                itemStyle={{
                  color: "#f0f0f0",
                  fontSize: "0.8em",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={80}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: "10px",
                  fontSize: "12px",
                  maxHeight: "80px",
                  overflow: "hidden",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Container component that combines data and presentation
export function LanguagesContainer() {
  const [topN, setTopN] = useState(5);
  const [topNInput, setTopNInput] = useState("5");
  const { data, loading, error } = useLanguageChartData(topN);

  const handleTopNChange = (value: string) => {
    setTopNInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 3 && num <= 10) {
      setTopN(num);
    }
  };

  return (
    <LanguagesChartBarMixed
      data={data}
      loading={loading}
      error={error}
      topN={topNInput}
      onTopNChange={handleTopNChange}
    />
  );
}
