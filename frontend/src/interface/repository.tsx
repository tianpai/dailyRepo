export interface ApiResponse<T> {
  isCached: boolean;
  date: string; // "2025-04-30" date of trending
  data: T;
}

export interface starDataPoint {
  date: string;
  count: number;
}

// Star history data is a map of repo names to arrays of star data points
export type StarHistoryData = Record<string, starDataPoint[]>;
export type RawStarHistoryApiResponse = ApiResponse<StarHistoryData>;

// Normalized day-based data point
export interface NormalizedDayData {
  day: number;
  [repoName: string]: number; // repo names as keys with star counts as values
}
export type RawRepoApiResponse = ApiResponse<RawRepoData[]>;

// ================ UI PROPS ========================

// the `language` field is just a map from language name → bytes (or whatever unit)
export type LanguageMap = Record<string, number>;

export interface LanguageTableProps {
  language: LanguageMap; // e.g., { "TypeScript": 642272, "JavaScript": 123456 }
}

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

// ================ UI PROPS ========================
export interface RepoData {
  name: string;
  owner: string;
  description: string;
  url: string;
  language: LanguageMap;
  trendingDate: string;
  topics: string[]; // optional, not always present
}

// export interface GraphData {
//
// }

export interface StatsProps {
  stars: number;
  fork: number;
}

export interface RepoCardProps extends RepoData {
  rank: number;
}
