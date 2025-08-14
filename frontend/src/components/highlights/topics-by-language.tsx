import { useMemo, useState, useEffect } from "react";
import { useApi, env } from "@/hooks/useApi";
import { languageColors } from "@/data/language-color";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==================== Type Definitions ====================
interface ClusterCount {
  [topics: string]: number;
}

interface LanguageTopicMap {
  [language: string]: ClusterCount;
}

interface TopicEntry {
  topic: string;
  count: number;
}

const CONFIG = {
  MAX_TOPICS: 6,
} as const;

// Hook to get screen width
function useScreenWidth() {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 768
  );

  useEffect(() => {
    function handleResize() {
      setScreenWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenWidth;
}

// Get dynamic bar width based on screen width
function getDynamicBarWidth(screenWidth: number): number {
  if (screenWidth <= 440) return 12;  // Very small screens
  if (screenWidth <= 768) return 20;  // Mobile/tablet
  return 35;                          // Desktop
}

// Get dynamic topic name width based on screen width  
function getDynamicTopicWidth(screenWidth: number): string {
  if (screenWidth <= 440) return "w-14"; // Very small screens (was w-10, +4 chars)
  if (screenWidth <= 768) return "w-16"; // Mobile/tablet (was w-12, +4 chars)
  return "w-20";                          // Desktop (was w-16, +4 chars)
}

/**
 * Get the current week number of the year
 * @returns Week number (1-53)
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

/**
 * Custom hook to fetch topics grouped by programming language
 * Fetches data for the current week showing which topics are popular in each language
 * @returns Object containing data, loading state, error message, and refetch function
 */
function useTopicsByLanguage() {
  const base_url = env("VITE_DATABASE_REPOS");
  const token = env("VITE_DEV_AUTH");

  const urlArgs = useMemo(
    () => ({
      baseUrl: base_url,
      endpoint: "topics-by-language",
    }),
    [base_url],
  );

  const fetchOptions = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token],
  );

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<LanguageTopicMap>({
    urlArgs,
    fetchOptions,
  });

  return {
    data: response || ({} as LanguageTopicMap),
    date: "",
    loading,
    error: error?.error?.message || "",
    refetch,
  };
}

/**
 * Transform topic counts into sorted array for ASCII visualization
 * Takes the top N topics and prepares them for bar display
 * @param topicCounts - Object mapping topic names to their counts
 * @returns Array of topic entries sorted by count
 */
function transformToTopicEntries(topicCounts: ClusterCount): TopicEntry[] {
  const entries = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, CONFIG.MAX_TOPICS);

  return entries;
}

/**
 * Create proportional ASCII bar for topic count
 * @param count - The count for this topic
 * @param maxCount - The maximum count among all topics
 * @param barWidth - Dynamic bar width based on screen size
 * @returns String of dashes representing the proportion
 */
function createTopicBar(count: number, maxCount: number, barWidth: number): string {
  if (maxCount === 0) return "";
  const proportion = count / maxCount;
  const barLength = Math.round(proportion * barWidth);
  return "─".repeat(Math.max(1, barLength));
}

interface TopicLanguageCardProps {
  language: string;
  topicCounts: ClusterCount;
}

/**
 * Individual ASCII card component for a single programming language
 * Displays top topics as horizontal bars with proportional lengths
 */
function TopicLanguageCard({
  language,
  topicCounts,
}: TopicLanguageCardProps) {
  const screenWidth = useScreenWidth();
  const topicEntries = transformToTopicEntries(topicCounts);
  const languageColor = languageColors[language] || "#8884d8";
  const maxCount = Math.max(...topicEntries.map(entry => entry.count));
  const barWidth = getDynamicBarWidth(screenWidth);
  const topicWidthClass = getDynamicTopicWidth(screenWidth);

  return (
    <div className="border-2 border-border bg-background text-foreground">
      {/* Language Header with Color Circle */}
      <div className="p-2 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: languageColor }}
          ></div>
          <span className="major-mono text-xs sm:text-sm font-normal text-foreground">
            {language.toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Topics with ASCII Bars */}
      <div className="p-2 space-y-1">
        {topicEntries.map(({ topic, count }) => {
          const bar = createTopicBar(count, maxCount, barWidth);
          return (
            <div key={topic} className="flex items-center">
              <span className={`major-mono text-xs text-foreground ${topicWidthClass} truncate`}>
                {topic}
              </span>
              <span className="major-mono text-xs text-description mx-1">
                |{bar} {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Container component that fetches and displays topics by language
 * Renders a grid of ASCII cards, one for each programming language
 */
export function TopicsByLanguageContainer() {
  const { data, loading, error } = useTopicsByLanguage();

  // Helper function for rendering loading/error states
  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-32">{message}</div>
  );

  // Handle loading and error states
  if (loading) return renderStateMessage("Loading...");
  if (error) return renderStateMessage(`Error: ${error}`);

  const languages = Object.keys(data);

  return (
    <div className="border-2 border-border bg-background text-foreground">
      {/* ASCII Header */}
      <div className="p-4 border-b-2 border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="major-mono text-lg font-normal text-foreground">
              TOPICS BY PROGRAMMING LANGUAGE
            </h3>
            <p className="major-mono text-sm text-description mt-1">
              Update weekly (Week {getCurrentWeekNumber()})
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="w-5 h-5 text-description hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Numbers represent how many times each topic cluster appears in repositories for that language. 
                  Topics are grouped from similar keywords using AI clustering.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Language Cards Grid */}
      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {languages.map((language) => (
            <TopicLanguageCard
              key={language}
              language={language}
              topicCounts={data[language]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
