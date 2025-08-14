import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import { useSearch } from "@/hooks/useSearch";
import { PageTitle } from "@/components/page-title";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";

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
        <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
          <PageTitle 
            title="Search Repositories"
            description="Search for repositories by name, owner, or topics"
          />
          <div className="w-full max-w-4xl">
            <div className="space-y-6">
              <SearchForm
                onSearch={handleSearch}
                onLanguageFilter={handleLanguageFilter}
                initialQuery={query}
                initialLanguage={language}
              />

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
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
