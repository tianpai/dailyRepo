"use client";

// import { TrendingUp } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "Langauge chart";

const chartConfig = {
  visitors: {
    label: "Languages",
  },
  chrome: {
    label: "Go",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Rust",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "JavaScript",
    color: "var(--chart-3)",
  },
  edge: {
    label: "TypeScript",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ChartPieDonut({
  language,
}: {
  language: Record<string, number>;
}) {
  const chartData = Object.entries(language).map(([lang, count]) => ({
    language: lang,
    visitors: count,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Language Composition</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="language"
              innerRadius={50}
            >
              {chartData.map((entry) => {
                // find a config entry where the label matches the language, fallback to 'other'
                const match = (
                  Object.entries(chartConfig) as Array<
                    [keyof typeof chartConfig, { label?: string }]
                  >
                ).find(
                  ([cfgKey, cfg]) =>
                    cfgKey !== "visitors" && cfg.label === entry.language
                );
                const key = match ? match[0] : "other";
                return (
                  <Cell
                    key={`cell-${entry.language}`}
                    fill={`var(--color-${key})`}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
