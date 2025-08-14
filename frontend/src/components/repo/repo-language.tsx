import { type LanguageMap } from "@/interface/repository";
import { toChartData } from "@/lib/pie-chart-data";

interface RepoLanguageProps {
  language: LanguageMap;
  threshold?: number;
  desktopWidth?: number;
  mobileWidth?: number;
  showPercentages?: boolean;
  showTitle?: boolean;
  title?: string;
}

interface LanguageItem {
  language: string;
  count: number;
}

// Constants
const CUMULATIVE_THRESHOLD = 75;
const ASCII_BAR_WIDTH_DESKTOP = 30;
const ASCII_BAR_WIDTH_MOBILE = 20;
const BAR_TOTAL_PERCENTAGE = 80;

// Minimalistic theme classes - respects light/dark mode
const THEME_CLASSES = {
  container: "bg-background text-foreground",
  languageSegment: "border-foreground flex items-center justify-center",
} as const;

// Helper functions
function processLanguageData(chartData: LanguageItem[], threshold: number = CUMULATIVE_THRESHOLD): LanguageItem[] {
  let cumulativePercentage = 0;
  const displayLanguages: LanguageItem[] = [];
  let otherPercentage = 0;

  for (const item of chartData) {
    if (cumulativePercentage < threshold) {
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

function generateAsciiBar(
  processedData: LanguageItem[],
  isMobile: boolean = false,
  customDesktopWidth?: number,
  customMobileWidth?: number,
  showTitle: boolean = false,
  title: string = "",
): string {
  const barWidth = isMobile 
    ? (customMobileWidth || ASCII_BAR_WIDTH_MOBILE)
    : (customDesktopWidth || ASCII_BAR_WIDTH_DESKTOP);

  let result = showTitle && title ? `${title.toUpperCase()} |` : "|";

  for (const item of processedData) {
    const segment = createLanguageSegment(item, barWidth);
    result += segment + "|";
  }

  return result;
}

export function RepoLanguage({ 
  language, 
  threshold = CUMULATIVE_THRESHOLD,
  desktopWidth,
  mobileWidth,
  showPercentages = true,
  showTitle = false,
  title = ""
}: RepoLanguageProps) {
  const chartData = toChartData(language).map((item) => ({
    language: item.language,
    count: item.count,
  }));

  const processedData = processLanguageData(chartData, threshold);
  const asciiBarDesktop = generateAsciiBar(processedData, false, desktopWidth, mobileWidth, showTitle, title);
  const asciiBarMobile = generateAsciiBar(processedData, true, desktopWidth, mobileWidth, showTitle, title);

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
        <span className="major-mono text-lg whitespace-nowrap overflow-x-auto md:hidden">
          {asciiBarMobile}
        </span>
        <span className="major-mono text-lg whitespace-nowrap overflow-x-auto hidden md:block">
          {asciiBarDesktop}
        </span>
        {showPercentages && (
          <div className="hidden md:flex gap-3 pr-4">
            {processedData.map((item) => (
              <span
                key={item.language}
                className="major-mono text-lg text-description whitespace-nowrap"
              >
                {item.language}: {item.count}%
              </span>
            ))}
          </div>
        )}
      </div>
      {showPercentages && (
        <div className="flex flex-wrap gap-3 px-4 pb-2 md:hidden">
          {processedData.map((item) => (
            <span
              key={item.language}
              className="major-mono text-lg text-description"
            >
              {item.language}: {item.count}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
