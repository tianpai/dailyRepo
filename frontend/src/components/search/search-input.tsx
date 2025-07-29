import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 border-b border-gray-300 focus-within:border-gray-600 pb-2">
        <Search className="h-4 w-4 opacity-70" />
        <input
          type="search"
          placeholder="Search topics (e.g., react typescript)"
          className="grow bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
