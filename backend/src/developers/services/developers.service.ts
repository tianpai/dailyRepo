import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrendingDeveloper } from '../../database/schemas/developer.schema';

interface DeveloperAggregationResult {
  latestDate?: string;
}

export interface TopTrendingDeveloperResult extends TrendingDeveloper {
  trendingCount: number;
}

@Injectable()
export class DevelopersService {
  constructor(
    @InjectModel(TrendingDeveloper.name)
    private trendingDeveloperModel: Model<TrendingDeveloper>,
  ) {}

  async fetchTrendingDevelopers(date: string) {
    let developers = await this.trendingDeveloperModel
      .find({ trendingRecord: date })
      .sort({ username: 1 });

    if (!developers.length) {
      const [{ latestDate } = {}] =
        await this.trendingDeveloperModel.aggregate<DeveloperAggregationResult>(
          [
            { $unwind: '$trendingRecord' },
            { $sort: { trendingRecord: -1 } },
            { $limit: 1 },
            {
              $group: { _id: null, latestDate: { $first: '$trendingRecord' } },
            },
          ],
        );

      if (latestDate) {
        developers = await this.trendingDeveloperModel
          .find({ trendingRecord: latestDate })
          .sort({ username: 1 });
      }
    }

    return developers;
  }

  async fetchTopTrendingDevelopers(
    limit = 10,
  ): Promise<TopTrendingDeveloperResult[]> {
    return await this.trendingDeveloperModel.aggregate<TopTrendingDeveloperResult>(
      [
        { $addFields: { trendingCount: { $size: '$trendingRecord' } } },
        { $sort: { trendingCount: -1 } },
        { $limit: Math.min(Math.max(limit, 1), 50) },
        { $unset: 'trendingCount' },
      ],
    );
  }
}
