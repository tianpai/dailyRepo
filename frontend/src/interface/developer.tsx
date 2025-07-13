export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  isCached?: boolean;
  date?: string;
  data: T;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationMetadata;
}

// Raw developer data shape exactly as returned by the API (matches ITrendingDeveloper)
export interface RawDeveloperData {
  _id: string;
  username: string;
  repositoryPath: string;
  profileUrl: string;
  trendingDate: string;
  location?: string;
  avatar_url?: string;
}

// UI-friendly developer data
export interface DeveloperData {
  username: string;
  repositoryPath: string;
  profileUrl: string;
  trendingDate: string;
  location?: string;
  avatar_url?: string;
}

// API response types (matching backend controller response structure)
export interface TrendingDevelopersResponse {
  developers: RawDeveloperData[];
  pagination: PaginationMetadata;
}

// Hook return types
export interface UseTrendingDevelopersResult {
  data: DeveloperData[];
  pagination: PaginationMetadata | null;
  loading: boolean;
  error: string;
}
