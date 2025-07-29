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
    <button type="submit" className="btn btn-primary">
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={localQuery} onChange={setLocalQuery} />
        <LanguageFilter value={localLanguage} onChange={setLocalLanguage} />
        <SearchButton />
      </div>
    </form>
  );
}
