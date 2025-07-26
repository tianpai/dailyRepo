interface ApiBase {
  isCached: boolean;
  date: string;
  isSuccess: boolean;
}

export interface ApiSuccess<T> extends ApiBase {
  isSuccess: true;
  data: T;
  error?: never;
}

export interface ApiError extends ApiBase {
  isSuccess: false;
  error: { code: number; message: string };
  data?: never;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Pagination is encapsulated in data in ApiResponse
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
