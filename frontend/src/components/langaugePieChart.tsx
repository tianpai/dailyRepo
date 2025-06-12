"use client";

import { Pie, PieChart } from "recharts";
import { useMemo } from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type LanguageMap } from "@/interface/repository";
import {
  toChartData,
  type PieDatum,
  languageColors,
  maxLanguageCount,
} from "@/lib/toChartData";

interface ChartPieDonutProps {
  language: LanguageMap;
}

export function ChartPieDonut({ language }: ChartPieDonutProps) {
  /* 1. Hooks run unconditionally */
  const chartData: PieDatum[] = useMemo(
    () => toChartData(language),
    [language],
  );

  const chartConfig: ChartConfig = useMemo(() => {
    const base: ChartConfig = {
      count: { label: "Repositories" },
    };

    Object.keys(language).forEach((lang) => {
      base[lang] = {
        label: lang,
        color: languageColors[lang] ?? "#000000",
      };
    });

    return base;
  }, [language]);

  const isEmpty = Object.keys(language).length === 0;

  /* 2. Then decide what to render */
  if (isEmpty) {
    return (
      <Card className="flex flex-col items-center justify-center py-8">
        <CardContent
          className="flex flex-1 mx-auto aspect-square max-h-[100px]
                        items-center justify-center"
        >
          <p className="text-muted-foreground text-center">No language data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Languages</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[100px]"
        >
          <PieChart width={80} height={80}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value: number, name: string) => [
                name + " ",
                `${value}%`,
              ]}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="language"
              innerRadius={20}
              outerRadius={40}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {maxLanguageCount(language)}
        </div>
        <div className="text-muted-foreground leading-none">
          {Object.keys(language).length} languages
        </div>
      </CardFooter>
    </Card>
  );
}
