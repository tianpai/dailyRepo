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
      <select
        className="w-full bg-transparent border-b border-gray-300 focus:border-gray-600 outline-none pb-2 appearance-none"
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
  );
}
