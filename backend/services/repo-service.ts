import { setCache, TTL, getTrendCacheKey } from "@utils/caching";
import { IRepo } from "@/interfaces/database";
import { Repo } from "@model/Repo";
import { getTodayUTC } from "@/utils/time";
import { searchReposPipeline } from "@/utils/db-pipline";

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
    setCache(getTrendCacheKey(actualDate), repos, TTL._1_WEEK);

    // If today's data was requested but we served older data, create a short-lived alias
    if (date === today && actualDate !== date) {
      setCache(getTrendCacheKey(date), repos, TTL._1_HOUR);
    }
  }

  return repos;
}

export async function fetchSearchedRepos(
  query: string,
  language?: string,
  page: number = 1,
  limit: number = 15,
): Promise<{ repos: IRepo[]; totalCount: number }> {
  const searchTerms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) {
    return { repos: [], totalCount: 0 };
  }

  const pipeline = searchReposPipeline(searchTerms, language, page, limit);
  const [result] = await Repo.aggregate(pipeline);
  const repos = result.data || [];
  const totalCount = result.totalCount[0]?.count || 0;

  return { repos, totalCount };
}

export async function fetchTimeToFirstHundredStars() {
  // TODO: Re-implement after repopulating star history with granular early data
  // const pipeline = timeToFirstHundredStarsPipeline();
  // const results = await Repo.aggregate(pipeline);
  return null;
  
  /*
  const formattedResults = {
    summary: {
      totalAnalyzedRepos: results.reduce((sum, cat) => sum + cat.totalRepos, 0),
      categories: results.map(cat => ({
        ageCategory: cat.ageCategory,
        totalRepos: cat.totalRepos,
        averageDays: cat.averageDays
      }))
    },
    reposByCategory: results.reduce((acc, cat) => {
      acc[cat.ageCategory] = cat.repos.map(repo => ({
        ...repo,
        starVelocity: repo.daysToHundredStars > 0 ? Math.round(100 / repo.daysToHundredStars * 10) / 10 : 0
      }));
      return acc;
    }, {} as Record<string, any[]>)
  };

  return formattedResults;
  */
}
