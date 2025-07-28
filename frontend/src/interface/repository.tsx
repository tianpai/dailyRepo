export interface PaginationMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  isCached: boolean;
  date: string; // "2025-04-30" date of trending
  data: T;
}

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
