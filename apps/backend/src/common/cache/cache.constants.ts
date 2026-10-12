export const CACHE_TTL = {
  NONE: 0,

  // Short-lived (search, dynamic)
  _1_HOUR: 60 * 60 * 1000, // 1 hour in ms
  _4_HOURS: 4 * 60 * 60 * 1000, // 4 hours in ms

  // Daily updates (trending)
  _10_HOURS: 10 * 60 * 60 * 1000, // 10 hours in ms
  _12_HOURS: 12 * 60 * 60 * 1000, // 12 hours in ms

  // Slow-changing (aggregations)
  _2_DAYS: 2 * 24 * 60 * 60 * 1000, // 2 days in ms
  _6_DAYS: 6 * 24 * 60 * 60 * 1000, // 6 days in ms
  _7_DAYS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // Immutable (historical)
  _30_DAYS: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
} as const;
