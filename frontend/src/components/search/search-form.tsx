import { useState } from "react";
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
      className="px-6 py-4 border-2 bg-background border-border text-foreground major-mono text-lg transition-all duration-200 hover:bg-foreground hover:text-background"
    >
      Search
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    onLanguageFilter(localLanguage);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex-1 min-w-0">
          <SearchInput value={localQuery} onChange={setLocalQuery} />
        </div>
        <div className="flex-shrink-0">
          <LanguageFilter value={localLanguage} onChange={setLocalLanguage} />
        </div>
        <div className="flex-shrink-0">
          <SearchButton />
        </div>
      </div>
    </form>
  );
}
