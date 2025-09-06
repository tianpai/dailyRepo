import { IRepo } from "@/interfaces/database";
import { Repo, StarHistory } from "@model/Repo";
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

/**
 * Internal function: Analyzes repositories to determine how long it takes to reach first 300 stars
 * Returns ALL repos for internal analysis - use fetchTopTimeToFirstThreeHundredStars for endpoints
 * WARNING: never expose this to public endpoints.
 * This will potentially expose all repos in db
 *
 * @param age - Age filter: 'YTD', 'all', '5y', '10y'
 * @returns Analysis with all repos ranked by velocity
 */
async function fetchAllTimeToFirstThreeHundredStars(age?: string) {
  const ageFilter = getAgeFilter(age);

  const repos = await Repo.find(ageFilter).lean();
  const repoIds = repos.map((repo) => repo._id);

  const starHistories = await StarHistory.find({ repoId: { $in: repoIds } })
    .sort({ saveDate: -1 })
    .lean();

  const repoStarHistoryMap = new Map();
  starHistories.forEach((starHistory) => {
    if (!repoStarHistoryMap.has(starHistory.repoId.toString())) {
      repoStarHistoryMap.set(starHistory.repoId.toString(), starHistory);
    }
  });

  const validRepos = repos
    .map((repo) => {
      const starHistory = repoStarHistoryMap.get(repo._id.toString());
      if (!starHistory?.history) {
        return null;
      }

      const history = starHistory.history;
      const maxStars = Math.max(...history.map((h) => h.count));

      if (maxStars < 300) {
        return null;
      }

      const firstThreeHundred = history.find((h) => h.count >= 300);
      if (!firstThreeHundred) {
        return null;
      }

      const createdAt = new Date(repo.createdAt);
      const targetDate = new Date(firstThreeHundred.date);
      const daysToThreeHundredStars =
        (targetDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      const velocity =
        daysToThreeHundredStars > 0
          ? Math.round((300 / daysToThreeHundredStars) * 10) / 10
          : 0;

      return {
        fullName: repo.fullName,
        owner: repo.owner,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        language: repo.language,
        topics: repo.topics,
        createdAt: repo.createdAt,
        daysToThreeHundredStars: Math.round(daysToThreeHundredStars * 10) / 10,
        maxStars,
        velocity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.velocity - a.velocity);

  if (!validRepos.length) {
    return null;
  }

  const days = validRepos.map((r) => r.daysToThreeHundredStars);
  const sortedDays = days.sort((a, b) => a - b);

  return {
    summary: {
      totalAnalyzedRepos: validRepos.length,
      averageDays:
        Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) /
        10,
      medianDays:
        Math.round(sortedDays[Math.floor(sortedDays.length / 2)] * 10) / 10,
      minDays: Math.round(Math.min(...days) * 10) / 10,
      maxDays: Math.round(Math.max(...days) * 10) / 10,
      ageFilter: age || "YTD",
    },
    repos: validRepos,
  };
}

/**
 * Returns top N repositories ranked by velocity to reach 300 stars
 * Wraps internal function and limits results for frontend consumption
 *
 * @param age - Age filter: 'YTD', 'all', '5y', '10y'
 * @param limit - Maximum number of repos to return (default: 50)
 * @returns Analysis with top N repos and summary statistics
 */
export async function fetchTimeToFirstThreeHundredStars(
  age?: string,
  limit: number = 50,
) {
  const allData = await fetchAllTimeToFirstThreeHundredStars(age);

  if (!allData) {
    return null;
  }

  return {
    summary: allData.summary,
    repos: allData.repos.slice(0, limit),
  };
}

/*
 * Returns a mongodb query
 */
function getAgeFilter(age?: string) {
  if (!age || age === "all") {
    return {};
  }
  const startDate = calculateStartDate(age);
  return startDate ? { createdAt: { $gte: startDate.toISOString() } } : {};
}

function calculateStartDate(age: string): Date | null {
  const now = new Date();
  const calculators = {
    YTD: () => new Date(now.getFullYear(), 0, 1),
    "5y": () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
    "10y": () =>
      new Date(now.getFullYear() - 10, now.getMonth(), now.getDate()),
  };

  return calculators[age]?.() || null;
}
