import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 14400, // 4 hours in seconds
  checkperiod: 1800, // 30 minutes in seconds
  maxKeys: 50, // <- SAFETY VALVE: Prevent memory leaks
});

/**
 * Assume date is in YYYY-MM-DD format
 * example:
 * getTrendCacheKey("2025-04-02") "trending:2025-04-02"
 */
export function getTrendCacheKey(date: string) {
  return `trending:${date}`;
}

export const TTL = {
  HAPPY_HOUR: 60 * 60, // 1 hour
  ONE_EARTH_ROTATION: 24 * 60 * 60, // 1 day
  SEMAINE: 7 * 24 * 60 * 60, // 1 week
  THIRTY_FLIRTY: 30 * 24 * 60 * 60, // 1 month
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
