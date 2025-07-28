import { ITrendingDeveloper } from "@/interfaces/database";
import { TrendingDeveloper } from "@model/TrendingDeveloper";

export async function fetchTrendingDevelopers(
  date: string,
): Promise<ITrendingDeveloper[]> {
  let developers = await TrendingDeveloper.find({ trendingDate: date })
    .select("-trendingDate")
    .sort({ username: 1 });

  if (!developers.length) {
    const [{ latestDate } = {}] = await TrendingDeveloper.aggregate([
      { $match: { trendingDate: { $exists: true, $ne: null } } },
      { $sort: { trendingDate: -1 } },
      { $limit: 1 },
      { $group: { _id: null, latestDate: { $first: "$trendingDate" } } },
    ]);

    if (latestDate) {
      developers = await TrendingDeveloper.find({ trendingDate: latestDate })
        .select("-trendingDate")
        .sort({ username: 1 });
    }
  }

  return developers;
}
