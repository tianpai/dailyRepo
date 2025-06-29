// API Response types based on frontend interfaces
export interface ApiResponse<T> {
  isCached: boolean;
  date: string;
  data: T;
}

export interface StarDataPoint {
  date: string;
  count: number;
}

export type StarHistoryData = Record<string, StarDataPoint[]>;

// GitHub API response types (basic)
export interface GitHubRepo {
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  html_url: string;
  languages_url: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  license?: {
    name: string;
  };
}
