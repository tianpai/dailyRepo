import { RepoCard } from "@/components/repo/repo-card";
import { GenericPagination } from "@/components/repo/repo-pagination";
import { type Pagination } from "@/interface/endpoint";
import { type SearchProps } from "@/hooks/useSearch";

interface SearchInfo {
  query: string;
  language: string | null;
  resultsFound: number;
}

interface SearchResultsProps {
  data: SearchProps[];
  pagination: Pagination | null;
  searchInfo: SearchInfo | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function SearchResults({
  data,
  pagination,
  searchInfo,
  isLoading,
  error,
  currentPage,
  onPageChange,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error: {error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-32 w-full"></div>
        ))}
      </div>
    );
  }

  if (!searchInfo) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">( -_・)?</div>
        <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter topics, repository names, or owner names to find repositories
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl sm:text-6xl mb-4 font-mono whitespace-nowrap">
          _(:3 」∠ )_
        </div>
        <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No repositories found for "{searchInfo.query}"
          {searchInfo.language && ` in ${searchInfo.language}`}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Try different keywords or remove the language filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {searchInfo.resultsFound} repositories for "{searchInfo.query}
            "{searchInfo.language && ` in ${searchInfo.language}`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((repo, index) => (
          <RepoCard
            key={`${repo.name}-${repo.owner}`}
            {...repo}
            colorIndex={index}
          />
        ))}
      </div>

      {pagination && (
        <GenericPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
