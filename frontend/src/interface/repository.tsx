// ================ UI PROPS ========================

// the `language` field is just a map from language name → bytes (or whatever unit)
export type LanguageMap = Record<string, number>;

export interface LanguageTableProps {
  language: LanguageMap; // e.g., { "TypeScript": 642272, "JavaScript": 123456 }
}

export interface StatsProps {
  stars: number;
  fork: number;
}
