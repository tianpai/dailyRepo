import { useTopDevelopers, type DeveloperProps } from "@/hooks/useDevelopers";
import { MobilePopup } from "@/components/ui/mobile-popup";
import { useState } from "react";
import { RepoCard } from "@/components/repo/repo-card";
import { useSearch, type SearchProps } from "@/hooks/useSearch";
import { ExternalLink } from "lucide-react";

function DeveloperCard({
  developer,
  onRepoClick,
}: {
  developer: DeveloperProps;
  onRepoClick: () => void;
}) {
  const trendingCount = developer.trendingRecord.length;

  const handleRepoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRepoClick();
  };

  return (
    <div className="flex items-center gap-3 mt-4 p-3 border-1 border-border bg-background transition-all">
      <img
        src={
          developer.avatar_url || `https://github.com/${developer.username}.png`
        }
        alt={developer.username}
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1">
        <a
          href={developer.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="major-mono text-lg font-medium text-foreground hover:opacity-70 transition-opacity"
        >
          {developer.username}
        </a>
        <a
          href="#"
          onClick={handleRepoClick}
          className="major-mono text-lg text-description hover:opacity-70 transition-opacity block"
        >
          {developer.repositoryPath.split('/')[1]}
        </a>
      </div>
      <div className="major-mono text-lg text-foreground">{trendingCount}x</div>
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
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  // Extract repo name from "owner/repo" format for search
  const searchQuery = expandedRepo ? expandedRepo.split("/")[1] : "";

  const { data: searchResults, isLoading: searchLoading } = useSearch({
    query: searchQuery,
    enabled: !!expandedRepo,
  });

  const handleRepoClick = (repositoryPath: string) => {
    setExpandedRepo(expandedRepo === repositoryPath ? null : repositoryPath);
  };

  const repoData = searchResults?.find(
    (repo: SearchProps) => `${repo.owner}/${repo.name}` === expandedRepo,
  );

  return (
    <div className="w-full flex flex-col p-2">
      {loading ? (
        <span className="major-mono text-lg text-description">
          Loading developers...
        </span>
      ) : developers && developers.length > 0 ? (
        developers.map((developer, index: number) => (
          <div key={index}>
            <DeveloperCard
              developer={developer}
              onRepoClick={() => handleRepoClick(developer.repositoryPath)}
            />
            {expandedRepo === developer.repositoryPath && (
              <div>
                {searchLoading ? (
                  <span className="major-mono text-lg text-description">
                    Loading repository...
                  </span>
                ) : repoData ? (
                  <RepoCard {...repoData} />
                ) : (
                  <div className="border-1">
                    <div className="major-mono text-lg text-description p-2">
                      {developer.username} is on trending but the repo is not
                      yet on trending
                    </div>
                    <a
                      href={`https://github.com/${expandedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="major-mono text-lg text-foreground inline-flex items-center gap-2 p-2"
                    >
                      <ExternalLink size={16} />
                      View on GitHub
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <span className="major-mono text-lg text-description">No data</span>
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
  const { data: developers, loading, error } = useTopDevelopers();

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
      </div>
    </div>
  );
}
