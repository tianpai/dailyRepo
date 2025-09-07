import { useState } from "react";
import { useTimeTo300Stars } from "@/hooks/useTimeTo300Stars";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/repo/repo-card";
import type { TimeTo300Repo } from "@/hooks/useTimeTo300Stars";
import { MobilePopup } from "@/components/ui/mobile-popup";
import { Badge } from "@/components/ui/badge";

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

function isNewRepo(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const now = Date.now();
  const days = (now - created) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

type Age = (typeof AGES)[number];

function HeaderSection({ ageFilter }: { ageFilter: string }) {
  return (
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
        <MobilePopup
          content={
            "Velocity = 300 / days_to_300 (stars/day). Days = days from repo creation to reaching first 300 stars. Showing top 20 by velocity. Age filter limits by repo creation date."
          }
          popupWidth="w-72"
        />
      </div>
    </div>
  );
}

function AgeTabs({ age, onChange }: { age: Age; onChange: (a: Age) => void }) {
  return (
    <div className="px-4 pt-3 sm:px-4 sm:pt-4">
      <div className="flex items-center gap-2 mb-3">
        {AGES.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={a === age ? "default" : "outline"}
            onClick={() => onChange(a)}
            className="major-mono"
          >
            {a}
          </Button>
        ))}
      </div>
    </div>
  );
}

function StatsGrid({
  total,
  avg,
  median,
  max,
}: {
  total: number;
  avg: number;
  median: number;
  max: number;
}) {
  return (
    <div className="p-3 sm:p-4 pt-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="analyzed repos" value={total} />
        <Stat label="avg days" value={Number(avg).toFixed(1)} highlight />
        <Stat label="median days" value={median} />
        <Stat label="max days" value={max} />
      </div>
    </div>
  );
}

function RepoRow({
  r,
  index,
  onSelect,
}: {
  r: TimeTo300Repo;
  index: number;
  onSelect: (r: TimeTo300Repo) => void;
}) {
  return (
    <div
      className="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-6 gap-2 px-3 py-2 border-b border-border text-foreground hover:bg-accent/10 cursor-pointer"
      onClick={() => onSelect(r)}
    >
      <span className="major-mono text-sm text-description text-center">
        {index + 1}
      </span>
      <span className="truncate flex items-center gap-2 md:col-span-2">
        <span className="major-mono text-sm truncate">
          {r.owner}/{r.name}
        </span>
        {isNewRepo(r.createdAt) && (
          <Badge
            variant="outline"
            className="major-mono text-[10px] px-1 py-0.5"
          >
            NEW
          </Badge>
        )}
      </span>
      <span className="major-mono text-sm">{r.velocity}</span>
      <span className="hidden md:block major-mono text-sm">
        {r.daysToThreeHundredStars}
      </span>
      <span className="hidden md:block major-mono text-sm">{r.maxStars}</span>
    </div>
  );
}

function RepoTable({
  repos,
  onSelect,
}: {
  repos: TimeTo300Repo[];
  onSelect: (r: TimeTo300Repo) => void;
}) {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
      <div className="border-2 border-border">
        <div className="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-6 gap-2 px-3 py-2 border-b-2 border-border bg-background/80">
          <span className="major-mono text-xs text-description text-center">
            RANK
          </span>
          <span className="major-mono text-xs text-description md:col-span-2">
            REPOSITORY
          </span>
          <span className="major-mono text-xs text-description">VELOCITY</span>
          <span className="hidden md:block major-mono text-xs text-description">
            DAYS
          </span>
          <span className="hidden md:block major-mono text-xs text-description">
            MAX
          </span>
        </div>
        <div>
          {repos.map((r, idx) => (
            <RepoRow
              key={r.fullName}
              r={r}
              index={idx}
              onSelect={(cur) => onSelect(cur)}
            />
          ))}
          {repos.length === 0 && (
            <div className="px-3 py-6 text-center major-mono text-sm text-description">
              No repositories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsModal({
  repo,
  onClose,
}: {
  repo: TimeTo300Repo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl">
        <div className="flex justify-end mb-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            CLOSE
          </Button>
        </div>
        <RepoCard
          owner={repo.owner}
          name={repo.name}
          description={repo.description ?? ""}
          url={repo.url}
          language={repo.language}
          topics={repo.topics}
          trendingRecord={[]}
          license={""}
          createdAt={repo.createdAt}
        />
      </div>
    </div>
  );
}

export function TimeTo300StarsSummaryCard() {
  const [age, setAge] = useState<Age>("YTD");
  const { summary, repos, isLoading, error } = useTimeTo300Stars(age);
  const [selected, setSelected] = useState<TimeTo300Repo | null>(null);

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
      <HeaderSection ageFilter={ageFilter} />
      <AgeTabs age={age} onChange={setAge} />
      <StatsGrid
        total={totalAnalyzedRepos}
        avg={averageDays}
        median={medianDays}
        max={maxDays}
      />
      <RepoTable
        repos={repos}
        onSelect={(r) =>
          setSelected((prev) => (prev?.fullName === r.fullName ? null : r))
        }
      />
      {selected && (
        <DetailsModal repo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
