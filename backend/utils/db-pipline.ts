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

export const language_list_top = (limit: number) => [
  {
    $group: {
      _id: null,
      latestDate: { $max: "$trendingDate" },
      docs: { $push: "$$ROOT" },
    },
  },
  { $unwind: "$docs" },
  { $match: { $expr: { $eq: ["$docs.trendingDate", "$latestDate"] } } },
  { $project: { language: "$docs.language" } },
  {
    $project: {
      languageArray: { $objectToArray: "$language" },
    },
  },
  { $unwind: "$languageArray" },
  {
    $group: {
      _id: "$languageArray.k",
      totalBytes: { $sum: "$languageArray.v" },
    },
  },
  {
    $group: {
      _id: null,
      languages: {
        $push: {
          k: "$_id",
          v: "$totalBytes",
        },
      },
    },
  },
  {
    $project: {
      languages: {
        $slice: [
          { $sortArray: { input: "$languages", sortBy: { v: -1 } } },
          limit,
        ],
      },
    },
  },
  {
    $replaceRoot: {
      newRoot: { $arrayToObject: "$languages" },
    },
  },
];

export const topicLangPipeline = [
  {
    $match: {
      $and: [
        { language: { $exists: true, $not: { $size: 0 } } },
        { topics: { $exists: true, $not: { $size: 0 } } },
      ],
    },
  },
  {
    $project: {
      fullName: 1,
      topics: 1,
      language: "$language",
    },
  },
];
