import { useTopDevelopers, type DeveloperProps } from "@/hooks/useDevelopers";
import { MobilePopup } from "@/components/ui/mobile-popup";
import { useMemo, useState, useCallback, memo } from "react";
import { RepoCard } from "@/components/repo/repo-card";
import { useSearch, type SearchProps } from "@/hooks/useSearch";
import { ExternalLink, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const DevRow = memo(function DevRow({
  d,
  rank,
  onSelect,
}: {
  d: DeveloperProps;
  rank: number;
  onSelect: (d: DeveloperProps) => void;
}) {
  const repoName = useMemo(
    () => d.repositoryPath.split("/")[1],
    [d.repositoryPath],
  );
  return (
    <div className="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-6 gap-2 px-3 py-2 border-b border-border text-foreground hover:bg-accent/10">
      <span className="major-mono text-sm text-description text-center">
        {rank}
      </span>
      <div className="flex items-center gap-2 md:col-span-2 overflow-hidden">
        <img
          src={d.avatar_url || `https://github.com/${d.username}.png`}
          alt={d.username}
          className="w-7 h-7 rounded-full flex-shrink-0"
        />
        {/* Mobile: dev/repo combined + trending badge; Desktop: developer only */}
        <div className="truncate flex items-center gap-2">
          <a
            href={d.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="major-mono text-sm text-foreground truncate md:hidden"
          >
            {d.username}/{repoName}
          </a>
          <span className="md:hidden major-mono text-[10px] text-description">
            {d.trendingRecord.length}x
          </span>
          <a
            href={d.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline major-mono text-sm text-foreground truncate"
          >
            {d.username}
          </a>
        </div>
      </div>
      {/* Mobile action button */}
      <div className="flex md:hidden justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="px-2 py-0.5 inline-flex items-center justify-center"
                onClick={() => onSelect(d)}
                aria-label="View repo details"
              >
                <Box className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="major-mono text-xs">View repo details</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Desktop-only columns */}
      <span className="hidden md:block major-mono text-sm truncate">
        {repoName}
      </span>
      <span className="hidden md:block major-mono text-sm">
        {d.trendingRecord.length}x
      </span>
      <div className="hidden md:flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="px-2 py-0.5 inline-flex items-center justify-center"
                onClick={() => onSelect(d)}
                aria-label="View repo details"
              >
                <Box className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="major-mono text-xs">View repo details</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});

function ListHeader() {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-6 gap-2 px-3 py-2 border-b-2 border-border bg-background/80">
      <span className="major-mono text-xs text-description text-center">
        RANK
      </span>
      {/* Mobile label */}
      <span className="major-mono text-xs text-description md:hidden">
        DEV/REPO
      </span>
      {/* Desktop label spans columns */}
      <span className="hidden md:block major-mono text-xs text-description md:col-span-2">
        DEVELOPER
      </span>
      <span className="hidden md:block major-mono text-xs text-description">
        REPOSITORY
      </span>
      <span className="hidden md:block major-mono text-xs text-description">
        TRENDING
      </span>
      <span className="major-mono text-xs text-description text-right">
        POPULAR REPO
      </span>
    </div>
  );
}

function DevDetailsModal({
  developer,
  onClose,
}: {
  developer: DeveloperProps;
  onClose: () => void;
}) {
  const searchQuery = developer.repositoryPath.split("/")[1];
  const { data: searchResults, isLoading } = useSearch({
    query: searchQuery,
    enabled: !!developer,
  });
  const repoData = searchResults?.find(
    (repo: SearchProps) =>
      `${repo.owner}/${repo.name}` === developer.repositoryPath,
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl">
        <div className="flex justify-end mb-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            CLOSE
          </Button>
        </div>
        {isLoading ? (
          <div className="border-2 border-border bg-background text-foreground p-4 text-center major-mono text-sm text-description">
            Loading repo details...
          </div>
        ) : repoData ? (
          <RepoCard {...repoData} />
        ) : (
          <div className="border-2 border-border bg-background text-foreground p-3">
            <div className="major-mono text-sm text-description">
              {developer.username} is trending, but the repository is not in our
              trending list.
            </div>
            <a
              href={`https://github.com/${developer.repositoryPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="major-mono text-sm text-foreground inline-flex items-center gap-2 mt-2"
            >
              <ExternalLink size={14} />
              View on GitHub
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DevelopersList({
  developers,
  loading,
}: {
  developers: DeveloperProps[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<DeveloperProps | null>(null);
  const handleSelect = useCallback((d: DeveloperProps) => setSelected(d), []);

  return (
    <div className="w-full flex flex-col">
      <ListHeader />
      {/* Rows */}
      {loading ? (
        <div className="px-3 py-6 text-center major-mono text-sm text-description">
          Loading...
        </div>
      ) : developers && developers.length > 0 ? (
        <div>
          {developers.map((d, i) => (
            <DevRow
              key={d.username + d.repositoryPath}
              d={d}
              rank={i + 1}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-6 text-center major-mono text-sm text-description">
          No developers
        </div>
      )}

      {/* Floating details modal */}
      {selected && (
        <DevDetailsModal
          developer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function TopDevelopersHeader({ developerCount }: { developerCount: number }) {
  const helpText =
    "Developers ranked by how many times they've appeared in trending. Shows the most consistently popular developers.";

  return (
    <div className="w-full p-4 border-b-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="major-mono text-lg font-normal text-foreground">
            TOP DEVELOPERS
          </h3>
          <p className="major-mono text-sm text-description mt-1">
            {developerCount} trending developers
          </p>
        </div>
        <MobilePopup content={helpText} popupWidth="w-64" />
      </div>
    </div>
  );
}

export function TopDevelopersContainer({
  className,
}: { className?: string } = {}) {
  const [visible, setVisible] = useState(10);
  const { data: developers, loading, error } = useTopDevelopers(visible);

  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-full text-center p-4">
      <span className="major-mono text-lg text-foreground">{message}</span>
    </div>
  );

  return (
    <div
      className={`flex flex-col items-stretch sm:mt-6 border-2 transition-all duration-200 ${className || ""}`}
    >
      <TopDevelopersHeader developerCount={developers?.length || 0} />
      <div className="w-full gap-0 flex flex-col items-start">
        {error ? (
          renderStateMessage("Error: Can't fetch developers")
        ) : (
          <DevelopersList developers={developers || []} loading={loading} />
        )}
        <div className="w-full flex items-center justify-end gap-2 p-3 border-t-2 border-border">
          <Button
            size="sm"
            variant="outline"
            disabled={visible === 10}
            onClick={() => setVisible(10)}
            className="major-mono inline-flex items-center gap-1"
          >
            SHOW TOP 10
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={visible <= 10}
            onClick={() => setVisible((v) => Math.max(10, v - 10))}
            className="major-mono inline-flex items-center gap-1"
          >
            SHOW LESS
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={visible >= 50}
            onClick={() => setVisible((v) => Math.min(50, v + 10))}
            className="major-mono inline-flex items-center gap-1"
          >
            SHOW MORE
          </Button>
        </div>
      </div>
    </div>
  );
}
