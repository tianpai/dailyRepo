"use client";
import { LuChartArea } from "react-icons/lu";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
import { useTrendingStarHistory } from "@/hooks/repo-data";
import { convertToNormalizedDays } from "@/lib/star-history-data";
import { useRepoDataContext } from "@/context/repo-data-provider";

export function RepoStarGraph() {
  const { selectedDate } = useRepoDataContext();
  const {
    data: starHistoryData,
    actualDate,
    loading,
    error,
  } = useTrendingStarHistory(selectedDate);
  if (loading) return <div>Loading star history...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  // Handle empty data case
  if (!starHistoryData || Object.keys(starHistoryData).length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <LuChartArea></LuChartArea>No star history data available for the
        selected date.
      </div>
    );
  }

  // Convert the star history data to normalized format using actual API date
  const apiResponse = {
    isCached: false,
    date: actualDate || new Date().toISOString().split("T")[0],
    data: starHistoryData,
  };

  // Get repository names (short names without owner prefix)
  const normalizedData = convertToNormalizedDays(apiResponse);
  const repoNames = Object.keys(starHistoryData).map(
    (fullName) => fullName.split("/")[1],
  );
  const colorKeys = Object.keys(REPO_COLORS);

  // Create dynamic chart config
  const chartConfig: ChartConfig = {};
  repoNames.forEach((repoName, index) => {
    const colorKey = colorKeys[index % colorKeys.length];
    chartConfig[repoName] = {
      label: repoName,
      color: REPO_COLORS[colorKey as keyof typeof REPO_COLORS],
    };
  });

  return (
    <Card>
      <CardHeader>
        <LuChartArea className="size-7" />
        <CardTitle>Repository Star History</CardTitle>
        <CardDescription>
          Star growth over time (normalized to days from earliest repo creation)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={normalizedData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `Day ${value}`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {repoNames.map((repoName) => (
              <Line
                key={repoName}
                dataKey={repoName}
                type="monotone"
                stroke={chartConfig[repoName]?.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 30 predefined colors for different repositories
const REPO_COLORS = {
  color1: "#FF6B6B",
  color2: "#4ECDC4",
  color3: "#45B7D1",
  color4: "#96CEB4",
  color5: "#FFEAA7",
  color6: "#DDA0DD",
  color7: "#98D8C8",
  color8: "#F7DC6F",
  color9: "#BB8FCE",
  color10: "#85C1E9",
  color11: "#F8C471",
  color12: "#82E0AA",
  color13: "#F1948A",
  color14: "#85C1E9",
  color15: "#F8D7DA",
  color16: "#D5DBDB",
  color17: "#A3E4D7",
  color18: "#D7BDE2",
  color19: "#A9DFBF",
  color20: "#F9E79F",
  color21: "#AED6F1",
  color22: "#F5B7B1",
  color23: "#A2D9CE",
  color24: "#E8DAEF",
  color25: "#FADBD8",
  color26: "#D0ECE7",
  color27: "#FCF3CF",
  color28: "#EBDEF0",
  color29: "#D6EAF8",
  color30: "#EDBB99",
};
