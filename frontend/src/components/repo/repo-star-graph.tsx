"use client";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { COLORS } from "@/data/color";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loading } from "@/components/loading";
import { formatNumber } from "@/lib/number-formatter";
import {
  useBulkStarHistory,
  convertToNormalizedDays,
} from "@/hooks/useStarHistory";

type RepoStarGraphProps = {
  owner: string;
  name: string;
  className?: string;
};

// A lightweight star history graph for a single repo using the bulk hook
export function RepoStarGraph({ owner, name, className }: RepoStarGraphProps) {
  const fullName = `${owner}/${name}`;
  const {
    data: starHistoryData,
    loading,
    error,
  } = useBulkStarHistory([fullName]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loading className="h-16" />
      </div>
    );
  }
  if (error) {
    return (
      <div className={`${className ?? ""} text-red-500`}>
        Failed to load: {error}
      </div>
    );
  }

  if (
    !starHistoryData ||
    !starHistoryData[fullName] ||
    starHistoryData[fullName].length === 0
  ) {
    return <div className={className}>No star history available.</div>;
  }

  // Use normalized days based on earliest date in the fetched dataset
  const normalizedData = convertToNormalizedDays(starHistoryData);

  // Base date for tooltip date calculation comes from the first entry
  const baseDateMs = (() => {
    const first = starHistoryData[fullName][0]?.date;
    if (!first) return undefined as number | undefined;
    return Date.parse(`${first}T00:00:00Z`);
  })();

  const chartConfig: ChartConfig = {
    [name]: {
      label: name,
      color: COLORS.color14,
    },
  };

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} className="w-full h-64 min-w-0">
        <LineChart
          accessibilityLayer
          data={normalizedData}
          margin={{ left: 0, right: 20, bottom: 10 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={true}
            axisLine={true}
            tickMargin={8}
            height={50}
            angle={-45}
            textAnchor="end"
            tickFormatter={(value) => `${value}`}
            label={{ value: "Day", position: "insideBottom", offset: -4 }}
          />
          <YAxis
            tickLine={true}
            axisLine={true}
            tickMargin={5}
            width={60}
            domain={[0, "auto"]}
            tickFormatter={(v) =>
              formatNumber(typeof v === "number" ? v : Number(v))
            }
            label={{ value: "total stars", angle: -90, position: "insideLeft" }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel={false}
                labelFormatter={(_val, p) => {
                  const day = Array.isArray(p) && p[0]?.payload?.day;
                  if (typeof day === "number") {
                    if (typeof baseDateMs === "number") {
                      const d = new Date(baseDateMs + day * 24 * 60 * 60 * 1000);
                      const iso = d.toISOString().slice(0, 10);
                      return `Day ${day} · ${iso}`;
                    }
                    return `Day ${day}`;
                  }
                  return "Day";
                }}
                formatter={(value, name) => (
                  <span className="flex items-center gap-2">
                    <span>{String(name)}:</span>
                    <span className="font-mono font-medium">
                      {formatNumber(
                        typeof value === "number" ? value : Number(value),
                      )}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Line
            dataKey={name}
            type="monotone"
            stroke={chartConfig[name]?.color}
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
