import { Repo, StarHistory } from "@model/Repo";
import { getRepoStarRecords } from "@/scraping/fetching-star-history";
import { getCache, setCache, TTL } from "@utils/caching";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function fetchRepoStarHistory(fname: string): Promise<any[]> {
  // Check database for existing star history
  const repoDoc = await Repo.findOne({ fullName: fname }).select("_id").lean();

  if (!repoDoc) {
    throw new Error("Repo not found - Try use 'Star History'");
  }

  // Check if we have recent star history data
  const existingHistory = await StarHistory.findOne({
    repoId: repoDoc._id,
  }).sort({ saveDate: -1 });

  // If we have recent data (within 1 month), return it
  if (
    existingHistory &&
    new Date().getTime() - existingHistory.saveDate.getTime() < ONE_MONTH_MS
  ) {
    return existingHistory.history;
  }

  // Fetch from GitHub API
  const data = await getRepoStarRecords(fname);

  // Update existing document or create new one
  if (existingHistory) {
    // Update the existing document with new data
    existingHistory.history = data;
    existingHistory.saveDate = new Date();
    await existingHistory.save();
  } else {
    // Create new document only if none exists
    await StarHistory.create({
      repoId: repoDoc._id,
      history: data,
    });
  }

  return data;
}

export function validateRepoNames(repoNames: any): string[] {
  if (!Array.isArray(repoNames) || repoNames.length === 0) {
    throw new Error("repoNames must be a non-empty array");
  }

  const validRepoNames = repoNames.filter(
    (name) =>
      typeof name === "string" &&
      name.includes("/") &&
      name.split("/").length === 2,
  );

  if (validRepoNames.length === 0) {
    throw new Error("No valid repo names provided (format: owner/repo)");
  }

  return validRepoNames;
}

export interface starDataPoint {
  date: string;
  count: number;
}

export async function fetchMultipleRepoStarHistory(
  validRepoNames: string[],
): Promise<{
  data: Record<string, starDataPoint[]>;
}> {
  const result = {};
  const cacheHits = [];

  // Check cache for each repo
  for (const repoName of validRepoNames) {
    const cacheKey = `star-history:${repoName}`;
    const cached = getCache(cacheKey);
    if (cached) {
      result[repoName] = cached;
      cacheHits.push(repoName);
    }
  }

  // Query database for repos not in cache
  const uncachedRepos = validRepoNames.filter(
    (name) => !cacheHits.includes(name),
  );

  // Find repos in database
  if (uncachedRepos.length > 0) {
    // Just get the IDs
    const repoIds = await Repo.find({
      fullName: { $in: uncachedRepos },
    }).distinct("_id"); // returns ObjectId[] directly

    // Query StarHistory and populate repo.fullName
    const starHistoryRecords = await StarHistory.find({
      repoId: { $in: repoIds },
    })
      // pulls fullName from Repo automatically
      .populate("repoId", "fullName")
      .lean();

    // Process star history records
    for (const record of starHistoryRecords) {
      const repoName = (record.repoId as any).fullName;
      const starHistory = record.history.map((point) => ({
        date: point.date,
        count: point.count,
      }));

      result[repoName] = starHistory;

      // Cache the result
      const cacheKey = `star-history:${repoName}`;
      setCache(cacheKey, starHistory, TTL._2_DAYS);
    }
  }

  return { data: result };
}
