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
}

export function LanguageFilter({ value, onChange }: LanguageFilterProps) {
  return (
    <div className="sm:w-48">
      <div className="border-2 bg-background border-border text-foreground transition-all duration-200">
        <select
          className="w-full bg-background text-foreground major-mono text-lg p-4 outline-none appearance-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All Languages</option>
          {LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
