import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import { useSearch } from "@/hooks/useSearch";
import { SearchHeader } from "./search-header";
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
        <div className="container mx-auto p-6 space-y-6">
          <SearchHeader />

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
      </SidebarLayout>
    </PageContainer>
  );
}
