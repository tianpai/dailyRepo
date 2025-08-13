import { type LanguageMap } from "@/interface/repository";
import { toChartData } from "@/lib/pie-chart-data";

interface RepoLanguageProps {
  language: LanguageMap;
}

interface LanguageItem {
  language: string;
  count: number;
}

// Constants
const CUMULATIVE_THRESHOLD = 75;
const ASCII_BAR_WIDTH_DESKTOP = 40;
const ASCII_BAR_WIDTH_MOBILE = 20;
const BAR_TOTAL_PERCENTAGE = 80;

// Minimalistic theme classes - respects light/dark mode
const THEME_CLASSES = {
  container: "bg-background text-foreground",
  languageSegment: "border-foreground flex items-center justify-center",
} as const;

// Helper functions
function processLanguageData(chartData: LanguageItem[]): LanguageItem[] {
  let cumulativePercentage = 0;
  const displayLanguages: LanguageItem[] = [];
  let otherPercentage = 0;

  for (const item of chartData) {
    if (cumulativePercentage < CUMULATIVE_THRESHOLD) {
      displayLanguages.push(item);
      cumulativePercentage += item.count;
    } else {
      otherPercentage += item.count;
    }
  }

  // Add "Other" category if there are remaining languages
  if (otherPercentage > 0) {
    displayLanguages.push({
      language: "Other",
      count: otherPercentage,
    });
  }

  return displayLanguages;
}

function createLanguageSegment(item: LanguageItem, totalWidth: number): string {
  const segmentWidth = Math.round(
    (item.count / BAR_TOTAL_PERCENTAGE) * totalWidth,
  );
  const isOther = item.language === "Other";

  if (isOther) {
    return "/".repeat(segmentWidth);
  }

  if (segmentWidth > item.language.length + 4) {
    // Add space around language name: --- C ---
    const totalPadding = segmentWidth - item.language.length - 2; // -2 for the spaces
    const leftPad = Math.floor(totalPadding / 2);
    const rightPad = totalPadding - leftPad;
    return (
      "-".repeat(leftPad) + " " + item.language + " " + "-".repeat(rightPad)
    );
  } else if (segmentWidth > 2) {
    return "-".repeat(segmentWidth);
  }
  return "";
}

function generateAsciiBar(processedData: LanguageItem[], isMobile: boolean = false): string {
  let result = "|";
  const barWidth = isMobile ? ASCII_BAR_WIDTH_MOBILE : ASCII_BAR_WIDTH_DESKTOP;

  for (const item of processedData) {
    const segment = createLanguageSegment(item, barWidth);
    result += segment + "|";
  }

  return result;
}

export function RepoLanguage({ language }: RepoLanguageProps) {
  const chartData = toChartData(language).map((item) => ({
    language: item.language,
    count: item.count,
  }));

  const processedData = processLanguageData(chartData);
  const asciiBarDesktop = generateAsciiBar(processedData, false);
  const asciiBarMobile = generateAsciiBar(processedData, true);

  const isEmpty = Object.keys(language).length === 0;

  if (isEmpty) {
    return (
      <div className={`${THEME_CLASSES.container} flex items-center pl-4 py-2`}>
        <span className="major-mono text-lg text-foreground">
          No language data
        </span>
      </div>
    );
  }

  return (
    <div className={`${THEME_CLASSES.container} w-full`}>
      <div className="flex items-center justify-between pl-4 py-2 min-h-8">
        <span className="major-mono text-lg whitespace-nowrap overflow-x-auto md:hidden">{asciiBarMobile}</span>
        <span className="major-mono text-lg whitespace-nowrap overflow-x-auto hidden md:block">{asciiBarDesktop}</span>
        <div className="hidden md:flex gap-3 pr-4">
          {processedData.map((item) => (
            <span
              key={item.language}
              className="major-mono text-lg text-foreground whitespace-nowrap"
            >
              {item.language}: {item.count}%
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 px-4 pb-2 md:hidden">
        {processedData.map((item) => (
          <span
            key={item.language}
            className="major-mono text-lg text-foreground"
          >
            {item.language}: {item.count}%
          </span>
        ))}
      </div>
    </div>
  );
}
