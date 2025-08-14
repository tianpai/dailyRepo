import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 p-4 border-2 bg-background border-border text-foreground transition-all duration-200 focus-within:border-border">
        <Search className="h-4 w-4 text-foreground flex-shrink-0" />
        <input
          type="search"
          placeholder="Search topics (e.g., react typescript)"
          className="flex-1 bg-transparent outline-none major-mono text-lg text-foreground placeholder:text-foreground/70"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
