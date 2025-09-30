export const latestRepoTopicsPipeline = [
  {
    $group: {
      _id: null,
      latestTrendingDate: {
        $max: '$trendingDate',
      },
    },
  },
  {
    $lookup: {
      from: 'repos',
      let: {
        latestDate: '$latestTrendingDate',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$trendingDate', '$$latestDate'],
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
      as: 'reposWithLatestDate',
    },
  },
  {
    $unwind: '$reposWithLatestDate',
  },
  {
    $unwind: '$reposWithLatestDate.topics',
  },
  {
    $group: {
      _id: null,
      topics: {
        $push: '$reposWithLatestDate.topics',
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
      language: '$language',
    },
  },
];
