import { Loading } from "@/components/loading";
import { RepoCard } from "@/components/repo/repo-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomDrawer } from "@/components/ui/drawer";
import { MobilePopup } from "@/components/ui/mobile-popup";
import type { TimeTo300Repo } from "@/hooks/useTimeTo300Stars";
import { useTimeTo300Stars } from "@/hooks/useTimeTo300Stars";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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

// Order from shortest to longest period
const AGES = ["YTD", "5y", "10y", "all"] as const;
const SORTS = ["fastest", "slowest"] as const;

function isNewRepo(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const now = Date.now();
  const days = (now - created) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

type Age = (typeof AGES)[number];
type Sort = (typeof SORTS)[number];

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

function FiltersBar({
  age,
  sort,
  onAge,
  onSort,
}: {
  age: Age;
  sort: Sort;
  onAge: (a: Age) => void;
  onSort: (s: Sort) => void;
}) {
  return (
    <div className="px-4 pt-3 sm:px-4 sm:pt-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Age buttons (left) */}
        <div className="flex items-center gap-2">
          {AGES.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === age ? "default" : "outline"}
              onClick={() => onAge(a)}
              className="major-mono"
            >
              {a}
            </Button>
          ))}
        </div>
        {/* Sort buttons (right on md+, wrap under on small) */}
        <div className="flex items-center gap-2 md:ml-auto">
          {SORTS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === sort ? "default" : "outline"}
              onClick={() => onSort(s)}
              className="major-mono"
            >
              {s.toUpperCase()}
            </Button>
          ))}
        </div>
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
      className="w-full grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[2.5rem_1fr_5.5rem_5.5rem_5.5rem] gap-2 px-3 py-2 border-b border-border text-foreground hover:bg-accent/10 cursor-pointer"
      onClick={() => onSelect(r)}
    >
      <span className="major-mono text-sm text-description text-center">
        {index + 1}
      </span>
      <span className="min-w-0 flex items-center gap-2">
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
  isLoading,
}: {
  repos: TimeTo300Repo[];
  onSelect: (r: TimeTo300Repo) => void;
  isLoading: boolean;
}) {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
      <div className="w-full border-2 border-border">
        <div className="w-full grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[2.5rem_1fr_5.5rem_5.5rem_5.5rem] gap-2 px-3 py-2 border-b-2 border-border bg-background/80">
          <span className="major-mono text-xs text-description text-center">
            RANK
          </span>
          <span className="major-mono text-xs text-description">
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
          {isLoading ? (
            <Loading className="h-24" />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function aggregateKeywords(
  repos: TimeTo300Repo[],
): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const r of repos) {
    for (const t of r.topics || []) {
      if (!t) continue;
      const key = t.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function KeywordsSummary({ repos }: { repos: TimeTo300Repo[] }) {
  const items = aggregateKeywords(repos).slice(0, 10);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const languageParam =
    new URLSearchParams(location.search).get("language") || "";
  if (!items.length) return null;
  const visible = expanded ? items : items.slice(0, 3);
  return (
    <div className="px-3 sm:px-4 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="major-mono text-xs text-description">KEYWORDS:</span>
        {visible.map(({ key, count }) => {
          const qp = new URLSearchParams();
          qp.set("q", key);
          if (languageParam) qp.set("language", languageParam);
          return (
            <Link
              key={key}
              to={`/search?${qp.toString()}`}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className="major-mono text-xs px-2 py-0.5"
              >
                {key} ({count})
              </Badge>
            </Link>
          );
        })}
        {items.length > 3 && (
          <Button
            size="sm"
            variant="ghost"
            className="major-mono text-[10px] px-2 py-0.5 inline-flex items-center gap-1 border-none"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <ChevronLeft className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
      <p className="major-mono text-xs text-description mt-1">
        Keywords aggregated from the 20 repos shown (top 10).
      </p>
    </div>
  );
}

function DetailsModal({
  repo,
  onClose,
}: {
  repo: TimeTo300Repo | null;
  onClose: () => void;
}) {
  // Keep the last shown repo during close animation so content doesn't disappear instantly
  const [displayRepo, setDisplayRepo] = useState<TimeTo300Repo | null>(repo);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (repo) {
      // Opening: immediately show new repo
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setDisplayRepo(repo);
    } else {
      // Closing: delay clearing until animation finishes (~300ms)
      closeTimer.current = window.setTimeout(() => {
        setDisplayRepo(null);
        closeTimer.current = null;
      }, 320);
    }
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [repo]);

  return (
    <BottomDrawer open={!!repo} onClose={onClose}>
      {displayRepo && (
        <>
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              CLOSE
            </Button>
          </div>
          <RepoCard
            owner={displayRepo.owner}
            name={displayRepo.name}
            description={displayRepo.description ?? ""}
            url={displayRepo.url}
            language={displayRepo.language}
            topics={displayRepo.topics}
            trendingRecord={[]}
            license={""}
            createdAt={displayRepo.createdAt}
          />
        </>
      )}
    </BottomDrawer>
  );
}

export function TimeTo300StarsSummaryCard() {
  const [age, setAge] = useState<Age>("YTD");
  const [sort, setSort] = useState<Sort>("fastest");
  const { summary, repos, isLoading, error } = useTimeTo300Stars(age, sort);
  const [selected, setSelected] = useState<TimeTo300Repo | null>(null);

  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-24">{message}</div>
  );

  if (error) return renderStateMessage(`Error: ${error}`);
  const ageFilter = summary?.ageFilter ?? age;

  return (
    <div className="w-full border-2 border-border bg-background text-foreground">
      <HeaderSection ageFilter={ageFilter} />
      <FiltersBar age={age} sort={sort} onAge={setAge} onSort={setSort} />
      {summary && (
        <StatsGrid
          total={summary.totalAnalyzedRepos}
          avg={summary.averageDays}
          median={summary.medianDays}
          max={summary.maxDays}
        />
      )}
      {/* Keywords aggregated from the 20 displayed repos */}
      <KeywordsSummary repos={repos} />
      <RepoTable
        repos={repos}
        isLoading={isLoading}
        onSelect={(r) =>
          setSelected((prev) => (prev?.fullName === r.fullName ? null : r))
        }
      />
      <DetailsModal repo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
