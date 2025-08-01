/*
 * to get list of strings from the topics field of repos
 * always on the latest trending date
 */
export const latestRepoTopicsPipeline = [
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

export const searchReposPipeline = (
  searchTerms: string[],
  language?: string,
  page: number = 1,
  limit: number = 15,
): any[] => {
  // Build match conditions for each search term
  const searchConditions = searchTerms.map((term) => ({
    $or: [
      { name: { $regex: term, $options: "i" } },
      { owner: { $regex: term, $options: "i" } },
      { topics: { $regex: term, $options: "i" } },
    ],
  }));

  // Add language filter if provided
  const matchStage: any = {
    $and: searchConditions,
  };

  if (language) {
    matchStage.$and.push({
      $expr: {
        $in: [
          { $toLower: language },
          { $map: { 
            input: { $objectToArray: "$language" }, 
            in: { $toLower: "$$this.k" } 
          }}
        ]
      }
    });
  }

  // Build scoring for all search terms
  const scoreConditions = searchTerms.flatMap((term) => [
    {
      $cond: [
        { $regexMatch: { input: "$name", regex: term, options: "i" } },
        15,
        0,
      ],
    },
    {
      $cond: [
        { $regexMatch: { input: "$owner", regex: term, options: "i" } },
        10,
        0,
      ],
    },
    {
      $cond: [
        {
          $in: [
            term.toLowerCase(),
            { $map: { input: "$topics", in: { $toLower: "$$this" } } },
          ],
        },
        20,
        0,
      ],
    },
  ]);

  return [
    { $match: matchStage },
    {
      $addFields: {
        searchScore: { $add: scoreConditions },
      },
    },
    { $sort: { searchScore: -1 as const, trendingDate: -1 as const } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { searchScore: 0 } }, // Remove searchScore from final results
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];
};
