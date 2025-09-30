import { Request } from "express";
import { getCache, setCache } from "./caching";
import { isValidDate } from "./time";

export function parsePagination(
  req: Request,
  defaultLimit = 20,
  maxLimit = 50,
) {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = Math.min(
    parseInt((req.query.limit as string) ?? String(defaultLimit), 10),
    maxLimit,
  );
  return { page, limit };
}

export function parseDateParam(req: Request, defaultDate: string) {
  const date = (req.query.date as string) || defaultDate;
  if (!isValidDate(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return date;
}

export async function withCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  shouldCache?: (data: T) => boolean,
): Promise<{ data: T; fromCache: boolean }> {
  const cached = getCache(cacheKey) as T;
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const data = await fetchFn();

  // Only cache if shouldCache function returns true (defaults to true if not provided)
  if (!shouldCache || shouldCache(data)) {
    setCache(cacheKey, data, ttl);
  }

  return { data, fromCache: false };
}

export function paginateArray<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const skip = (page - 1) * limit;
  return {
    items: items.slice(skip, skip + limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
}
