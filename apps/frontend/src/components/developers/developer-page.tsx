import { useState, useEffect } from "react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import {
  useTrendingDevelopers,
  type DeveloperProps,
} from "@/hooks/useDevelopers.tsx";
import { useDateContext } from "@/components/date-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GenericPagination } from "@/components/repo/repo-pagination";
import { PageTitle } from "@/components/page-title";
import { MapPin, TrendingUp, Box } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DeveloperPage() {
  return (
    <PageContainer>
      <SidebarLayout>
        <DeveloperPageContent />
      </SidebarLayout>
    </PageContainer>
  );
}

function DeveloperPageContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const { selectedDate } = useDateContext();
  const { data, pagination, loading, error } = useTrendingDevelopers(
    selectedDate,
    currentPage,
  );

  // Reset to page 1 when date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  if (loading) return <p>Loading developers...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
      <PageTitle
        title="Trending Developers"
        description={`Discover the most active developers - ${pagination?.totalCount || 0} developers`}
      />
      <div className="w-full">
        <DeveloperGrid developers={data} />
        {pagination && (
          <GenericPagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            isLoading={loading}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

function DeveloperGrid({ developers }: { developers: DeveloperProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
      {developers.map((dev) => (
        <DeveloperCard key={dev.username} developer={dev} />
      ))}
    </div>
  );
}

function DeveloperCard({ developer }: { developer: DeveloperProps }) {
  return (
    <div className="flex flex-col items-stretch justify-between border-2 bg-background border-border text-foreground transition-all duration-200 h-full">
      {/* Main Content */}
      <div className="flex flex-col items-center flex-grow border-b-2 border-border p-4">
        <DeveloperAvatar developer={developer} />
        <div className="mt-3 text-center">
          <DeveloperName developer={developer} />
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-4 py-2 flex flex-col gap-2">
        <DeveloperRepository developer={developer} />
        <DeveloperLocation developer={developer} />
        <DeveloperTrendingHistory developer={developer} />
      </div>
    </div>
  );
}

function DeveloperName({ developer }: { developer: DeveloperProps }) {
  return (
    <a
      href={developer.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="major-mono text-sm font-normal text-foreground truncate"
      title={developer.username}
    >
      {developer.username}
    </a>
  );
}

function DeveloperAvatar({ developer }: { developer: DeveloperProps }) {
  return (
    <Avatar className="w-16 h-16 border-2 border-border">
      <AvatarImage src={developer.avatar_url} alt={developer.username} />
      <AvatarFallback className="major-mono text-foreground bg-background">
        {developer.username[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function DeveloperRepository({ developer }: { developer: DeveloperProps }) {
  const repoName =
    developer.repositoryPath.split("/")[1] || developer.repositoryPath;

  return (
    <span className="major-mono text-xs text-description inline-flex items-center gap-1">
      <Box className="w-3 h-3" />
      <a
        href={`https://github.com/${developer.repositoryPath}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground truncate"
        title={developer.repositoryPath}
      >
        {repoName}
      </a>
    </span>
  );
}

function DeveloperLocation({ developer }: { developer: DeveloperProps }) {
  if (!developer.location) return null;

  return (
    <span className="major-mono text-xs text-description inline-flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      <span className="truncate">{developer.location}</span>
    </span>
  );
}

function DeveloperTrendingHistory({
  developer,
}: {
  developer: DeveloperProps;
}) {
  if (!developer.trendingRecord || developer.trendingRecord.length === 0) {
    return null;
  }

  const trendingCount = developer.trendingRecord.length;
  const sortedDates = [...developer.trendingRecord].sort((a, b) =>
    b.localeCompare(a),
  );
  const displayDates = sortedDates.slice(0, 3);
  const hasMoreDates = sortedDates.length > 3;

  const tooltipContent = `Previously trending ${trendingCount} time${trendingCount > 1 ? "s" : ""} on ${displayDates.join(", ")}${hasMoreDates ? ` and ${sortedDates.length - 3} more dates` : ""}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="major-mono text-xs text-description cursor-help inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trendingCount}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

