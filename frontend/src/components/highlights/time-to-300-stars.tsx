import { useState } from "react";
import { useTimeTo300Stars } from "@/hooks/useTimeTo300Stars";
import { Button } from "@/components/ui/button";

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-start p-3 border-2 border-border ${highlight ? "bg-accent/10" : "bg-background"}`}
    >
      <span className="major-mono text-xs text-description">
        {label.toUpperCase()}
      </span>
      <span className="major-mono text-lg sm:text-xl text-foreground">
        {value}
      </span>
    </div>
  );
}

const AGES = ["YTD", "all", "5y", "10y"] as const;

export function TimeTo300StarsSummaryCard() {
  const [age, setAge] = useState<(typeof AGES)[number]>("YTD");
  const { summary, isLoading, error } = useTimeTo300Stars(age);

  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-24">{message}</div>
  );

  if (isLoading) return renderStateMessage("Loading...");
  if (error) return renderStateMessage(`Error: ${error}`);
  if (!summary) return null;

  const { totalAnalyzedRepos, averageDays, medianDays, maxDays, ageFilter } =
    summary;

  return (
    <div className="border-2 border-border bg-background text-foreground">
      <div className="p-4 border-b-2 border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="major-mono text-lg font-normal text-foreground">
              TIME TO 300 STARS
            </h3>
            <p className="major-mono text-sm text-description mt-1">
              Summary ({ageFilter})
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 pt-3 sm:px-4 sm:pt-4">
        <div className="flex items-center gap-2 mb-3">
          {AGES.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === age ? "default" : "outline"}
              onClick={() => setAge(a)}
              className="major-mono"
            >
              {a}
            </Button>
          ))}
        </div>
      </div>
      <div className="p-3 sm:p-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="analyzed repos" value={totalAnalyzedRepos} />
          <Stat
            label="avg days"
            value={Number(averageDays).toFixed(1)}
            highlight
          />
          <Stat label="median days" value={medianDays} />
          <Stat label="max days" value={maxDays} />
        </div>
      </div>
    </div>
  );
}
