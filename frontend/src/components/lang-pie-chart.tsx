"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type LanguageMap } from "@/interface/repository";
import {
  toChartData,
  type PieDatum,
  languageColors,
} from "@/lib/pie-chart-data";

interface ChartPieDonutProps {
  language: LanguageMap;
}

export function ChartPieDonut({ language }: ChartPieDonutProps) {
  const [showAll, setShowAll] = useState(false);

  const chartData: PieDatum[] = useMemo(
    () => toChartData(language),
    [language],
  );

  const topLanguages = useMemo(() => {
    return chartData.slice(0, 2);
  }, [chartData]);

  const displayLanguages = showAll ? chartData : topLanguages;
  const hasMore = chartData.length > 2;

  const isEmpty = Object.keys(language).length === 0;

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
      <CardContent className="flex-1 pb-0">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
          {chartData.map((item) => (
            <div
              key={item.language}
              className="flex items-center justify-center text-xs font-medium text-white relative group"
              style={{
                width: `${item.count}%`,
                backgroundColor: languageColors[item.language] ?? "#000000",
                minWidth: item.count > 5 ? "auto" : "0",
              }}
              title={`${item.language}: ${item.count === 0 ? "<1" : item.count}%`}
            >
              {item.count > 10 && (
                <span
                  className="truncate px-1"
                  style={{
                    textShadow:
                      "1px 1px 0 rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5)",
                  }}
                >
                  {item.language}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {displayLanguages.map((item) => (
            <div key={item.language} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: languageColors[item.language] ?? "#000000",
                }}
              />
              <span>
                {item.language} ({item.count === 0 ? "<1" : item.count}%)
              </span>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-50 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show all {chartData.length} languages
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
