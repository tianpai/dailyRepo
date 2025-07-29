"use client";
import { useMemo } from "react";
import { LuChartArea } from "react-icons/lu";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { COLORS } from "@/data/color";
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
import {
  useBulkStarHistory,
  convertToNormalizedDays,
} from "@/hooks/useStarHistory";
import { useRepoDataContext } from "@/components/repo/repo-data-provider";

export function RepoStarGraph() {
  const { data: repoData } = useRepoDataContext();

  // Extract repo names from current repo data for bulk star history fetch
  const fullRepoNames = useMemo(() => {
    const names = repoData.map((repo) => `${repo.owner}/${repo.name}`);
    return names;
  }, [repoData]);

  const {
    data: starHistoryData,
    loading,
    error,
  } = useBulkStarHistory(fullRepoNames);
  if (loading)
    return (
      <div>
        <h1>Loading star history...</h1>
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  // Handle empty data case
  if (!starHistoryData || Object.keys(starHistoryData).length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <LuChartArea></LuChartArea>
        <h2>No star history data available for the selected date.</h2>
      </div>
    );
  }

  // Get repository names (short names without owner prefix)
  const normalizedData = convertToNormalizedDays(starHistoryData);
  const repoNames = Object.keys(starHistoryData).map(
    (fullName) => fullName.split("/")[1],
  );
  const colorKeys = Object.keys(COLORS);

  // Create dynamic chart config
  const chartConfig: ChartConfig = {};
  repoNames.forEach((repoName, index) => {
    const colorKey = colorKeys[index % colorKeys.length];
    chartConfig[repoName] = {
      label: repoName,
      color: COLORS[colorKey as keyof typeof COLORS],
    };
  });

  return (
    <Card>
      <CardHeader>
        <LuChartArea className="size-7" />
        <CardTitle>
          <h2>Repository star history</h2>
        </CardTitle>
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
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
