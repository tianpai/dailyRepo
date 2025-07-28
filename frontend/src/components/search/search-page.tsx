import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import { useSearch } from "@/hooks/useSearch";
import { RepoCard } from "@/components/repo/repo-card";
import { GenericPagination } from "@/components/repo/repo-pagination";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, pagination, searchInfo, isLoading, error } = useSearch({
    query,
    language: language || undefined,
    page: currentPage,
    enabled: query.trim().length > 0,
  });

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setCurrentPage(1);
  };

  const handleLanguageFilter = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <SidebarLayout>
        <div className="container mx-auto p-6 space-y-6">
          {/* Search Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold major-mono">Search Repositories</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search for repositories by name, owner, or topics
            </p>
          </div>

          {/* Search Form */}
          <SearchForm 
            onSearch={handleSearch}
            onLanguageFilter={handleLanguageFilter}
            initialQuery={query}
            initialLanguage={language}
          />

          {/* Search Results */}
          <SearchResults
            data={data}
            pagination={pagination}
            searchInfo={searchInfo}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}

interface SearchFormProps {
  onSearch: (query: string) => void;
  onLanguageFilter: (language: string) => void;
  initialQuery: string;
  initialLanguage: string;
}

function SearchForm({ onSearch, onLanguageFilter, initialQuery, initialLanguage }: SearchFormProps) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [localLanguage, setLocalLanguage] = useState(initialLanguage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    onLanguageFilter(localLanguage);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label className="input input-bordered flex items-center gap-2">
            <svg 
              className="h-4 w-4 opacity-70" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              type="search"
              placeholder="Search topics (e.g., react typescript, rust cli)"
              className="grow"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </label>
        </div>

        {/* Language Filter */}
        <div className="sm:w-48">
          <select
            className="select select-bordered w-full"
            value={localLanguage}
            onChange={(e) => setLocalLanguage(e.target.value)}
          >
            <option value="">All Languages</option>
            <option value="JavaScript">JavaScript</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="Go">Go</option>
            <option value="Rust">Rust</option>
            <option value="C++">C++</option>
            <option value="C#">C#</option>
            <option value="PHP">PHP</option>
            <option value="Ruby">Ruby</option>
            <option value="Swift">Swift</option>
            <option value="Kotlin">Kotlin</option>
          </select>
        </div>

        {/* Search Button */}
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </div>
    </form>
  );
}

interface SearchResultsProps {
  data: any[];
  pagination: any;
  searchInfo: any;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function SearchResults({ 
  data, 
  pagination, 
  searchInfo, 
  isLoading, 
  error, 
  currentPage, 
  onPageChange 
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
        <div className="text-6xl mb-4">🔍</div>
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
        <div className="text-4xl sm:text-6xl mb-4 font-mono whitespace-nowrap">_(:3 」∠ )_</div>
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
      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {searchInfo.resultsFound} repositories for "{searchInfo.query}"
            {searchInfo.language && ` in ${searchInfo.language}`}
          </p>
        </div>
      </div>

      {/* Repository Cards */}
      <div className="space-y-4">
        {data.map((repo, index) => (
          <RepoCard
            key={`${repo.name}-${repo.owner}`}
            {...repo}
            colorIndex={index}
          />
        ))}
      </div>

      {/* Pagination */}
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