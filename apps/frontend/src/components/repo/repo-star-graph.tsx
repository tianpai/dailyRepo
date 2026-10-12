"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { COLORS } from "@/data/color";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loading } from "@/components/loading";
import { formatNumber } from "@/lib/number-formatter";
import { computeR2, detectTurningPointsByCategory } from "@/lib/star-stats";
import {
  useBulkStarHistory,
  convertToNormalizedDays,
} from "@/hooks/useStarHistory";

type RepoStarGraphProps = {
  owner: string;
  name: string;
  className?: string;
  // Tuning for turning-point detection and linearity threshold
  linearityR2?: number; // default 0.985
  maxTurningPoints?: number; // default 3
  minTurningGapDays?: number; // default dynamic: max(7, n/10)
  categoryMode?: "auto" | "log" | "exp" | "other"; // default auto
  categoryR2Threshold?: number; // default 0.98
  categoryR2Margin?: number; // default 0.02
};

/**
 * Tuning props (how to tune):
 * - linearityR2 (default 0.995):
 *   Higher → more often “Stable linear growth” and fewer turning points.
 *   Lower → more likely to compute turning points.
 *   Suggested ranges: very smooth 0.99–0.995, typical 0.98–0.985, sensitive 0.95–0.97.
 * - maxTurningPoints (default 3):
 *   Caps how many turning points we render. Use 1–2 for minimal markers; 3–5 for more phases.
 * - minTurningGapDays (default 10):
 *   Minimum spacing (in days) between turning points to avoid clustering; increase to reduce noise.
 * - categoryMode (default 'auto'):
 *   Chooses turning-point method by classifying the growth curve:
 *   'log' or 'exp' → chord method (max distance to first-last chord);
 *   'other' → slope-change method. You can force a category to pick a method.
 * - categoryR2Threshold (default 0.98) / categoryR2Margin (default 0.02):
 *   Control classification sensitivity when comparing linear fits in transformed spaces.
 *
 * Under-chart summary (what each field means):
 * - TOTAL: latest total star count (k-formatted)
 * - DAYS: number of days covered (from first to last data point)
 * - AVG/DAY: overall average daily increase (total gain / days elapsed)
 * - LAST 30D: average daily increase over the last 30 days
 * - Stable linear growth (R² …): quality of a single-line fit; close to 1 means highly linear
 * - Turning points: list of Day N (and YYYY-MM-DD) where the curve likely changes trend
 */
export function RepoStarGraph({
  owner,
  name,
  className,
  linearityR2 = 0.995,
  maxTurningPoints = 2,
  minTurningGapDays = 10,
  categoryMode = "auto",
  categoryR2Threshold = 0.98,
  categoryR2Margin = 0.02,
}: RepoStarGraphProps) {
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

  // Build lookup for day -> value (cumulative stars)
  const dayToValue = new Map<number, number>();
  for (const row of normalizedData) {
    const v = (row as Record<string, number>)[name];
    if (typeof v === "number") dayToValue.set(row.day, v);
  }

  const firstDay = normalizedData[0]?.day ?? 0;
  const lastDay = normalizedData[normalizedData.length - 1]?.day ?? 0;
  const firstVal = dayToValue.get(firstDay) ?? 0;
  const lastVal = dayToValue.get(lastDay) ?? 0;
  const daysTracked = Math.max(1, lastDay - firstDay + 1);
  const avgOverall = (lastVal - firstVal) / Math.max(1, lastDay - firstDay);

  const windowDays = 30;
  const start30 = Math.max(firstDay, lastDay - windowDays);
  const start30Val = dayToValue.get(start30) ?? firstVal;
  const avg30 = (lastVal - start30Val) / Math.max(1, lastDay - start30);

  // Assess linearity via R^2 and detect a turning point (change in slope)
  const seriesPoints = normalizedData
    .map((row) => ({ x: row.day, y: (row as Record<string, number>)[name] }))
    .filter((p): p is { x: number; y: number } => typeof p.y === "number");
  const rSquared = computeR2(seriesPoints);
  const isLinearStable = rSquared >= linearityR2;
  const turningPoints: Array<{ day: number; value: number }> = !isLinearStable
    ? detectTurningPointsByCategory(seriesPoints, avgOverall, {
        category: categoryMode,
        r2Threshold: categoryR2Threshold,
        r2Margin: categoryR2Margin,
        maxPoints: maxTurningPoints,
        minGapDays: minTurningGapDays,
      })
    : [];
  // turning dates are computed on the fly when rendering summary

  return (
    <div className={className}>
    <ChartContainer config={chartConfig} className="w-full h-56 sm:h-64 min-w-0">
        <LineChart
          accessibilityLayer
          data={normalizedData}
          margin={{ left: 0, right: 10, bottom: 10 }}
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
                      const d = new Date(
                        baseDateMs + day * 24 * 60 * 60 * 1000,
                      );
                      const iso = d.toISOString().slice(0, 10);
                      return `Day ${day} · ${iso}`;
                    }
                    return `Day ${day}`;
                  }
                  return "Day";
                }}
                formatter={(
                  value,
                  seriesName,
                  item: { payload?: { day?: number } },
                ) => {
                  const v = typeof value === "number" ? value : Number(value);
                  const day = item?.payload?.day;
                  let delta: number | null = null;
                  if (typeof day === "number") {
                    const prev = dayToValue.get(day - 1);
                    if (typeof prev === "number") delta = v - prev;
                  }
                  return (
                    <span className="flex items-center gap-2">
                      <span>{String(seriesName)}:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(v)}
                      </span>
                      {delta != null && (
                        <span className="text-muted-foreground font-mono">
                          ({delta >= 0 ? "+" : ""}
                          {formatNumber(Math.abs(delta))})
                        </span>
                      )}
                    </span>
                  );
                }}
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
          {turningPoints.map((tp, idx) => (
            <ReferenceDot
              key={`tp-${tp.day}-${idx}`}
              x={tp.day}
              y={tp.value}
              r={4}
              fill={chartConfig[name]?.color as string}
              stroke="#111827"
              strokeWidth={1}
              label={{
                value: "Turning",
                position: "top",
                fill: "currentColor",
              }}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-foreground">
        <div className="p-2 border border-border bg-background/50">
          <div className="major-mono text-[10px] text-description">TOTAL</div>
          <div className="major-mono text-sm">{formatNumber(lastVal)}</div>
        </div>
        <div className="p-2 border border-border bg-background/50">
          <div className="major-mono text-[10px] text-description">DAYS</div>
          <div className="major-mono text-sm">{daysTracked}</div>
        </div>
        <div className="p-2 border border-border bg-background/50">
          <div className="major-mono text-[10px] text-description">AVG/DAY</div>
          <div className="major-mono text-sm">{avgOverall.toFixed(2)}</div>
        </div>
        <div className="p-2 border border-border bg-background/50">
          <div className="major-mono text-[10px] text-description">
            LAST 30D
          </div>
          <div className="major-mono text-sm">{avg30.toFixed(2)}</div>
        </div>
      </div>
      {/* Linearity summary / turning points list */}
      <div className="mt-2 text-xs major-mono text-description">
        {isLinearStable && (
          <span>Stable linear growth (R² {rSquared.toFixed(2)})</span>
        )}
        {!isLinearStable && turningPoints.length > 0 && (
          <span>
            Turning points:{" "}
            {turningPoints.map((tp, i) => {
              const date = baseDateMs
                ? new Date(baseDateMs + tp.day * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 10)
                : null;
              return `${i ? ", " : ""}Day ${tp.day}${date ? ` · ${date}` : ""}`;
            })}
          </span>
        )}
      </div>
    </div>
  );
}
