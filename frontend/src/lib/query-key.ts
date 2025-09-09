export const reposTrendingKey = (
  base: string,
  dateStr?: string,
  page?: number,
) => ["trending-repos", base, dateStr, page ?? 1] as const;

export const devsTrendingKey = (
  base: string,
  dateStr?: string,
  page?: number,
) => ["trending-developers", base, dateStr, page ?? 1] as const;

export const topDevelopersKey = (base: string, limit: number) =>
  ["top-developers", base, limit] as const;

export const searchReposKey = (
  base: string,
  query: string,
  language: string | null | undefined,
  page: number,
  limit: number,
) =>
  ["search-repos", base, query.trim(), language || null, page, limit] as const;

export const keywordsKey = (base: string, date?: string) =>
  ["keywords", base, date || null] as const;

export const topicsByLanguageKey = (base: string) =>
  ["topics-by-language", base] as const;

export const topLanguagesKey = (base: string, top: number) =>
  ["top-languages", base, top] as const;

export const bulkStarHistoryKey = (base: string, names: string[]) =>
  ["bulk-star-history", base, names.join(",")] as const;

export const starHistoryKey = (base: string, fullName: string) =>
  ["star-history", base, fullName] as const;

export const timeTo300StarsKey = (age: string, sort: "fastest" | "slowest") =>
  ["time-to-300-stars", age, sort] as const;
