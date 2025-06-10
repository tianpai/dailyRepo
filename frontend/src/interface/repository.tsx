// the `language` field is just a map from language name → bytes (or whatever unit)
type LanguageMap = Record<string, number>;

// Raw data shape exactly as returned by the API
export interface RawRepoData {
  _id: string;
  __v: number;
  fullName: string; // e.g. "codexu/note-gen"
  name: string; // repo name, e.g. "note-gen"
  owner: string; // e.g. "codexu"
  description: string;
  url: string; // full URL to GitHub
  language: LanguageMap; // e.g. { "TypeScript": 642272, ... }
  topics: string[]; // e.g. ["assistant", "chatbot", …]
  createdAt: string; //
  lastUpdate: string; // e.g. "2025-06-09"
  age: number; // in days
  license: string; // e.g. "MIT"
  trendingDate: string; // e.g. "2025-06-09"
}

export interface ApiResponse {
  isCached: boolean;
  date: string; // "2025-04-30" date of trending
  data: RawRepoData[];
}

// Trimmed shape for UI. stars and forks are extracted numbers.
export interface RepoData {
  name: string;
  description: string;
  url: string;
  trendingDate: string;
  // stars: number;
  // forks: number;
}

export interface StatsProps {
  stars: number;
  fork: number;
}

export interface RepoCardProps extends RepoData {
  rank: number;
}
