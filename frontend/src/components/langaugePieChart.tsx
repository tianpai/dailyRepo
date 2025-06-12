"use client";

import { TrendingUp } from "lucide-react";
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
import { toChartData, type PieDatum, languageColors } from "@/lib/toChartData";

interface ChartPieDonutProps {
  language: LanguageMap;
}

export function ChartPieDonut({ language }: ChartPieDonutProps) {
  /* If the repo has no language stats yet, avoid rendering an empty chart */
  const chartData: PieDatum[] = toChartData(language);

  const chartConfig: ChartConfig = useMemo(() => {
    const base: ChartConfig = {
      count: { label: "Repositories" }, // value key that Pie uses
    };

    Object.keys(language).forEach((lang) => {
      base[lang] = {
        label: lang,
        color: languageColors[lang] ?? "#000000",
      };
    });

    return base;
  }, [language]);

  // TODO: center CardTitle and CardFooter
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Languages</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[120px]"
        >
          <PieChart width={120} height={120}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="language"
              innerRadius={35}
              outerRadius={50}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {Object.keys(language).length} languages
        </div>
      </CardFooter>
    </Card>
  );
}
