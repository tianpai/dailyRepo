import { useEffect, useState } from "react";
import { SearchInput } from "./search-input";
import { LanguageFilter } from "./language-filter";

interface SearchFormProps {
  onSearch: (query: string) => void;
  onLanguageFilter: (language: string) => void;
  initialQuery: string;
  initialLanguage: string;
}

export function SearchButton() {
  return (
    <button
      type="submit"
      className="px-4 py-2 border-l-2 border-border text-foreground major-mono text-base transition-all duration-200 hover:text-foreground/80"
    >
      SEARCH
    </button>
  );
}

export function SearchForm({
  onSearch,
  onLanguageFilter,
  initialQuery,
  initialLanguage,
}: SearchFormProps) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [localLanguage, setLocalLanguage] = useState(initialLanguage);

  // Sync internal state if the initial props change (e.g., URL-driven search)
  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setLocalLanguage(initialLanguage);
  }, [initialLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    onLanguageFilter(localLanguage);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="w-full grid grid-cols-1 sm:grid-cols-[1fr_16rem_auto] gap-2">
        <SearchInput value={localQuery} onChange={setLocalQuery} />
        <LanguageFilter value={localLanguage} onChange={setLocalLanguage} />
        <div className="hidden sm:flex items-center">
          <SearchButton />
        </div>
      </div>
      {/* Mobile submit button */}
      <div className="sm:hidden">
        <SearchButton />
      </div>
    </form>
  );
}
