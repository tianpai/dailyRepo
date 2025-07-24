import { useMemo, useState, useEffect } from "react";
import { useApi, env } from "@/hooks/useApi";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { languageColors } from "@/lib/pie-chart-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ==================== Type Definitions ====================
interface ClusterCount {
  [topics: string]: number;
}

interface LanguageTopicMap {
  [language: string]: ClusterCount;
}

interface RadarDataPoint {
  lang: string;
  count: number;
  fullMark: number;
}

const CHART_CONFIG = {
  MAX_TOPICS: 6,
  OUTER_RADIUS: "40%",
  CHART_MARGINS: { top: 5, right: 5, bottom: 5, left: 5 },
  SMALL_SCREEN_BREAKPOINT: 376,
  CHART_HEIGHT: "h-64",
  TEXT_COLOR: "#666666",
  TEXT_SIZE: 14,
  GRID_COLS: {
    sm: "grid-cols-1",
    md: "md:grid-cols-1",
    lg: "lg:grid-cols-2",
  },
} as const;

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
 * Transform topic counts into radar chart data format
 * Takes the top N topics and prepares them for visualization
 * @param topicCounts - Object mapping topic names to their counts
 * @returns Array of data points formatted for radar chart
 */
function transformToRadarData(topicCounts: ClusterCount): RadarDataPoint[] {
  const entries = Object.entries(topicCounts).slice(0, CHART_CONFIG.MAX_TOPICS);

  return entries.map(([topic, count]) => ({
    lang: topic,
    count,
    fullMark: Math.max(...entries.map(([, c]) => c)),
  }));
}

interface CustomTickProps {
  payload: { value: string };
  x: number;
  y: number;
  textAnchor: string;
}

/**
 * Custom tick component for radar chart labels
 * Handles text wrapping for hyphenated words to prevent overflow
 * @param props - Contains position, text content, and anchor information
 * @returns SVG text element with optional line wrapping
 */
function CustomTick({ payload, x, y, textAnchor }: CustomTickProps) {
  const text = payload.value;
  const parts = text.includes("-") ? text.split("-") : [text];

  // Single line text - no wrapping needed
  if (parts.length === 1) {
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill={CHART_CONFIG.TEXT_COLOR}
        fontSize={CHART_CONFIG.TEXT_SIZE}
      >
        {text}
      </text>
    );
  }

  // Multi-line text - wrap at hyphen
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill={CHART_CONFIG.TEXT_COLOR}
      fontSize={CHART_CONFIG.TEXT_SIZE}
    >
      <tspan x={x} dy="-0.1em">
        {parts[0]}
      </tspan>
      <tspan x={x} dy="1.2em">
        {parts[1]}
      </tspan>
    </text>
  );
}

interface TopicLanguageChartProps {
  language: string;
  topicCounts: ClusterCount;
}

/**
 * Individual radar chart component for a single programming language
 * Displays top topics as a radar/spider chart with customized styling
 */
function TopicLanguageChart({
  language,
  topicCounts,
}: TopicLanguageChartProps) {
  const radarData = transformToRadarData(topicCounts);
  const languageColor = languageColors[language] || "#8884d8";
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSmallScreen = windowWidth < CHART_CONFIG.SMALL_SCREEN_BREAKPOINT;

  return (
    <div className="w-full border rounded-2xl">
      <div className="text-center"></div>
      <div className={CHART_CONFIG.CHART_HEIGHT}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius={CHART_CONFIG.OUTER_RADIUS}
            data={radarData}
            margin={CHART_CONFIG.CHART_MARGINS}
          >
            <PolarGrid />
            <PolarAngleAxis
              dataKey="lang"
              tick={!isSmallScreen ? CustomTick : false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "dataMax + 1"]}
              tick={false}
            />
            <Radar
              name={language}
              dataKey="count"
              stroke={languageColor}
              fill={languageColor}
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Container component that fetches and displays topics by language
 * Renders a grid of radar charts, one for each programming language
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
    <Card>
      <CardHeader className="pb-2">
        <div>
          <h3 className="text-lg font-semibold">
            Topics by Programming Language
          </h3>
          <p className="text-sm text-gray-400">Update weekly</p>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`grid ${CHART_CONFIG.GRID_COLS.sm} ${CHART_CONFIG.GRID_COLS.md} ${CHART_CONFIG.GRID_COLS.lg} gap-5`}
        >
          {languages.map((language) => (
            <TopicLanguageChart
              key={language}
              language={language}
              topicCounts={data[language]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
