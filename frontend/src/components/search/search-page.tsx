import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, X } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import { useSearch } from "@/hooks/useSearch";
import { PageTitle } from "@/components/page-title";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";

export function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialQ = params.get("q") || "";
  const initialLang = params.get("language") || "";

  const [query, setQuery] = useState(initialQ);
  const [language, setLanguage] = useState(initialLang);
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
    const next = new URLSearchParams(location.search);
    if (searchQuery.trim()) next.set("q", searchQuery.trim());
    else next.delete("q");
    if (language.trim()) next.set("language", language.trim());
    else next.delete("language");
    navigate({ pathname: "/search", search: next.toString() ? `?${next.toString()}` : "" }, { replace: false });
  };

  const handleLanguageFilter = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setCurrentPage(1);
    const next = new URLSearchParams(location.search);
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    if (selectedLanguage.trim()) next.set("language", selectedLanguage.trim());
    else next.delete("language");
    navigate({ pathname: "/search", search: next.toString() ? `?${next.toString()}` : "" }, { replace: false });
  };

  useEffect(() => {
    setQuery(initialQ);
    setLanguage(initialLang);
  }, [initialQ, initialLang]);

  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
          <PageTitle 
            title="Search Repositories"
            description="Search for repositories by name, owner, or topics"
          />
          <div className="w-full">
            <div className="space-y-6">
              <SearchForm
                onSearch={handleSearch}
                onLanguageFilter={handleLanguageFilter}
                initialQuery={query}
                initialLanguage={language}
              />

              {/* Tips + Active filters bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-description">
                  <Lightbulb className="w-4 h-4" />
                  <span className="major-mono text-xs">Tip: you can click keywords anywhere to search quickly.</span>
                </div>
                {(query || language) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {query && (
                      <div className="flex items-center gap-2 px-2 py-1 border-1 border-border bg-background">
                        <span className="major-mono text-xs text-description">QUERY:</span>
                        <span className="major-mono text-xs text-foreground">{query}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-1 py-0.5 h-auto"
                          onClick={() => handleSearch("")}
                          aria-label="Clear query"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {language && (
                      <div className="flex items-center gap-2 px-2 py-1 border-1 border-border bg-background">
                        <span className="major-mono text-xs text-description">LANGUAGE:</span>
                        <span className="major-mono text-xs text-foreground">{language}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-1 py-0.5 h-auto"
                          onClick={() => handleLanguageFilter("")}
                          aria-label="Clear language"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
