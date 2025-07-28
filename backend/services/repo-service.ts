import { setCache, TTL, getTrendCacheKey } from "@utils/caching";
import { IRepo } from "@/interfaces/database";
import { Repo } from "@model/Repo";
import { getTodayUTC } from "@/utils/time";

export async function fetchTrendingRepos(date: string): Promise<IRepo[]> {
  // First try to find repos for the requested date
  let repos = await Repo.find({ trendingDate: date })
    .select("-snapshots")
    .lean();

  // If no repos found for requested date, fall back to latest date
  if (!repos.length) {
    const [{ latestDate } = {}] = await Repo.aggregate([
      { $match: { trendingDate: { $exists: true, $ne: null } } },
      { $sort: { trendingDate: -1 } },
      { $limit: 1 },
      { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
    ]);

    if (latestDate) {
      repos = await Repo.find({ trendingDate: latestDate })
        .select("-snapshots")
        .lean();
    }
  }

  // After fetching, update cache with proper strategy
  if (repos.length > 0) {
    const actualDate = repos[0].trendingDate;
    const today = getTodayUTC();

    // Cache the data against its actual date with a long TTL
    setCache(getTrendCacheKey(actualDate), repos, TTL.SEMAINE);

    // If today's data was requested but we served older data, create a short-lived alias
    if (date === today && actualDate !== date) {
      setCache(getTrendCacheKey(date), repos, TTL.HAPPY_HOUR);
    }
  }

  return repos;
}
