import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 14400, // 4 hours in seconds
  checkperiod: 3600, // 1 hour in seconds
  maxKeys: 1000, // <- SAFETY VALVE: Prevent memory leaks (increased for date-based keys)
  deleteOnExpire: true, // Automatically delete expired keys
} as NodeCache.Options);

/**
 * Assume date is in YYYY-MM-DD format
 * example:
 * getTrendCacheKey("2025-04-02") "trending:2025-04-02"
 */
export function getTrendCacheKey(date: string) {
  return `trending:${date}`;
}

export const TTL = {
  _1_HOUR: 60 * 60, // 1 hour
  _12_HOUR: 12 * 60 * 60, // 12 hour
  _1_DAY: 24 * 60 * 60, // 1 day
  _2_DAYS: 2 * 24 * 60 * 60, // 2 days
  _1_WEEK: 7 * 24 * 60 * 60, // 1 week
  _1_MONTH: 30 * 24 * 60 * 60, // 1 month
};

export function getCache(key: string) {
  return cache.get(key);
}

export function setCache(key: string, value: any, ttl: number) {
  return cache.set(key, value, ttl);
}

export function delCache(key: string) {
  return cache.del(key);
}

export function clearCache() {
  return cache.flushAll();
}

export default cache;
