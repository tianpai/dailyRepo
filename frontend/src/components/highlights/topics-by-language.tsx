import { useMemo } from "react";
import { useApi, env } from "@/hooks/useApi";
import { languageColors } from "@/data/language-color";
import { MobilePopup } from "@/components/ui/mobile-popup";

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
  MAX_TOPICS: 10,
} as const;

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

interface TopicLanguageCardProps {
  language: string;
  topicCounts: ClusterCount;
}

/**
 * Individual card component for a single programming language
 * Displays top topics with counts and percentages
 */
function TopicLanguageCard({ language, topicCounts }: TopicLanguageCardProps) {
  const topicEntries: TopicEntry[] = transformToTopicEntries(topicCounts);
  const languageColor = languageColors[language] || "#8884d8";
  const totalCount = topicEntries.reduce((sum, entry) => sum + entry.count, 0);

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

      {/* Topics with Percentages */}
      <div className="p-2">
        <div className="space-y-1">
          {topicEntries.map(({ topic, count }) => {
            const percentage =
              totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const maxCount = Math.max(...topicEntries.map((e) => e.count));
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div
                key={topic}
                className="relative flex items-center justify-between p-1"
                style={{
                  background: `linear-gradient(to right, ${languageColor}20 ${barWidth}%, transparent ${barWidth}%)`,
                }}
              >
                <span className="major-mono text-sm text-foreground truncate flex-1 relative z-10">
                  {topic}
                </span>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="major-mono text-sm text-description">
                    {count}
                  </span>
                  <span className="major-mono text-sm text-description">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Container component that fetches and displays topics by language
 * Renders a grid of cards with percentages, one for each programming language
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
  const helpText =
    "Numbers represent how many times each topic cluster appears in repositories for that language. Topics are grouped from similar keywords using AI clustering.";

  return (
    <div className="border-2 border-border bg-background text-foreground">
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
          <MobilePopup content={helpText} popupWidth="w-72" />
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
