import { type LanguageMap } from "@/interface/repository";
import { toChartData } from "@/lib/pie-chart-data";
import { languageColors } from "@/data/language-color";
import { type ReactElement } from "react";

interface RepoLanguageProps {
  language: LanguageMap;
  showPercentages?: boolean;
  showTitle?: boolean;
  title?: string;
}

interface LanguageItem {
  language: string;
  count: number;
}

// Minimalistic theme classes - respects light/dark mode
const THEME_CLASSES = {
  container: "bg-background text-foreground",
  languageSegment: "border-foreground flex items-center justify-center",
} as const;

// Helper functions
function processLanguageData(
  chartData: LanguageItem[],
  maxLanguages: number = 2,
): LanguageItem[] {
  // Filter out 0% languages
  const filteredData = chartData.filter((item) => item.count > 0);

  // If only one language with 100%, show just that one
  if (filteredData.length === 1 && filteredData[0].count === 100) {
    return filteredData;
  }

  const displayLanguages = filteredData.slice(0, maxLanguages);
  const remainingLanguages = filteredData.slice(maxLanguages);

  if (remainingLanguages.length > 0) {
    const otherPercentage = remainingLanguages.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    displayLanguages.push({
      language: "Other",
      count: otherPercentage,
    });
  }

  return displayLanguages;
}

function createLanguageListItem(item: LanguageItem): ReactElement {
  const languageColor = languageColors[item.language] || "#8884d8";

  return (
    <div
      key={item.language}
      className="relative flex items-center justify-between p-1"
      style={{
        background: `linear-gradient(to right, ${languageColor}20 ${item.count}%, transparent ${item.count}%)`,
      }}
    >
      <span className="major-mono text-sm text-foreground truncate flex-1 relative z-10">
        {item.language}
      </span>
      <div className="flex items-center gap-2 relative z-10">
        <span className="major-mono text-sm text-description">
          {item.count}%
        </span>
      </div>
    </div>
  );
}

function generateLanguageList(
  processedData: LanguageItem[],
  showTitle: boolean = false,
  title: string = "",
): ReactElement {
  return (
    <div className="w-full">
      {showTitle && title && (
        <div className="major-mono text-sm text-foreground mb-1">
          {title.toUpperCase()}
        </div>
      )}
      <div className="space-y-1">
        {processedData.map((item) => createLanguageListItem(item))}
      </div>
    </div>
  );
}

export function RepoLanguage({
  language,
  showTitle = false,
  title = "",
}: RepoLanguageProps) {
  const chartData = toChartData(language).map((item) => ({
    language: item.language,
    count: item.count,
  }));

  const processedData = processLanguageData(chartData, 2);
  const isEmpty = Object.keys(language).length === 0;

  if (isEmpty) {
    return (
      <div className={`${THEME_CLASSES.container} flex items-center p-2`}>
        <span className="major-mono text-sm text-foreground">
          No language data
        </span>
      </div>
    );
  }

  return (
    <div className={`${THEME_CLASSES.container} w-full p-2`}>
      {generateLanguageList(processedData, showTitle, title)}
    </div>
  );
}
