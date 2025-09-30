import { ITrendingDeveloper } from "@/interfaces/database";
import { TrendingDeveloper } from "@model/TrendingDeveloper";

export async function fetchTrendingDevelopers(
  date: string,
): Promise<ITrendingDeveloper[]> {
  let developers = await TrendingDeveloper.find({ trendingRecord: date }).sort({
    username: 1,
  });

  if (!developers.length) {
    const [{ latestDate } = {}] = await TrendingDeveloper.aggregate([
      { $unwind: "$trendingRecord" },
      { $sort: { trendingRecord: -1 } },
      { $limit: 1 },
      { $group: { _id: null, latestDate: { $first: "$trendingRecord" } } },
    ]);

    if (latestDate) {
      developers = await TrendingDeveloper.find({
        trendingRecord: latestDate,
      }).sort({ username: 1 });
    }
  }

  return developers;
}

export async function fetchTopTrendingDevelopers(
  limit: number = 10,
): Promise<any[]> {
  return await TrendingDeveloper.aggregate([
    { $addFields: { trendingCount: { $size: "$trendingRecord" } } },
    { $sort: { trendingCount: -1 } },
    { $limit: Math.min(Math.max(limit, 1), 50) },
    { $unset: "trendingCount" },
  ]);
}
