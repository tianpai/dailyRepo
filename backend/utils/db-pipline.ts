/*
 * to get list of strings from the topics field of repos
 * always on the latest trending date
 */
export const PIPELINE = [
  {
    $group: {
      _id: null,
      latestTrendingDate: {
        $max: "$trendingDate",
      },
    },
  },
  {
    $lookup: {
      from: "repos", // Ensure this matches your actual collection name if different from 'repos'
      let: {
        latestDate: "$latestTrendingDate",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$trendingDate", "$$latestDate"],
            },
          },
        },
        {
          $project: {
            topics: 1,
            _id: 0,
          },
        },
      ],
      as: "reposWithLatestDate",
    },
  },
  {
    $unwind: "$reposWithLatestDate",
  },
  {
    $unwind: "$reposWithLatestDate.topics",
  },
  {
    $group: {
      _id: null,
      topics: {
        $push: "$reposWithLatestDate.topics",
      },
    },
  },
  {
    $project: {
      _id: 0,
      topics: 1,
    },
  },
];
