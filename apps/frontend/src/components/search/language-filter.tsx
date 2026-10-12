import { X } from "lucide-react";
import { useId } from "react";

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
];

interface LanguageFilterProps {
  value: string;
  onChange: (value: string) => void;
  embedded?: boolean; // kept for compatibility
}

export function LanguageFilter({ value, onChange }: LanguageFilterProps) {
  const listId = useId();
  return (
    <div className="w-full">
      <label className="input input-bordered input-ghost w-full flex items-center gap-2 bg-transparent focus-within:bg-transparent dark:focus-within:bg-transparent focus-within:outline-none focus-within:ring-1 focus-within:ring-foreground focus-within:border-foreground">
        <input
          type="text"
          className="grow bg-transparent outline-none text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          placeholder="Language (optional)"
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            onClick={() => onChange("")}
            aria-label="Clear language"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </label>
      <datalist id={listId}>
        {LANGUAGES.map((language) => (
          <option key={language} value={language} />
        ))}
      </datalist>
    </div>
  );
}
