import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="input input-bordered input-ghost w-full flex items-center gap-2 bg-transparent focus-within:bg-transparent dark:focus-within:bg-transparent focus-within:outline-none focus-within:ring-1 focus-within:ring-foreground focus-within:border-foreground">
      <Search className="h-[1em] text-neutral-500 dark:text-neutral-400" />
      <input
        type="search"
        required
        placeholder="Search topics (e.g., react typescript)"
        className="grow bg-transparent outline-none text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
