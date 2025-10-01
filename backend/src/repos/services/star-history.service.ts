import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repo } from '../../database/schemas/repo.schema';
import {
  StarHistory,
  StarHistoryEntry,
} from '../../database/schemas/star-history.schema';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export interface StarDataPoint {
  date: string;
  count: number;
}

interface PopulatedStarHistory {
  repoId: {
    fullName: string;
  };
  history: StarHistoryEntry[];
  saveDate: Date;
}

@Injectable()
export class StarHistoryService {
  constructor(
    @InjectModel(Repo.name) private repoModel: Model<Repo>,
    @InjectModel(StarHistory.name) private starHistoryModel: Model<StarHistory>,
  ) {}

  async fetchRepoStarHistory(fname: string): Promise<StarDataPoint[]> {
    const repoDoc = await this.repoModel
      .findOne({ fullName: fname })
      .select('_id')
      .lean();

    if (!repoDoc) {
      throw new NotFoundException('Repo not found - Try use "Star History"');
    }

    const existingHistory = await this.starHistoryModel
      .findOne({ repoId: repoDoc._id })
      .sort({ saveDate: -1 });

    // If we have recent data (within 1 month), return it
    if (
      existingHistory &&
      new Date().getTime() - existingHistory.saveDate.getTime() < ONE_MONTH_MS
    ) {
      return existingHistory.history;
    }

    // TODO: Fetch from GitHub API (requires getRepoStarRecords from scraping module)
    // For now, return existing data or empty array
    if (existingHistory) {
      return existingHistory.history;
    }

    return [];
  }

  validateRepoNames(repoNames: unknown): string[] {
    if (!Array.isArray(repoNames) || repoNames.length === 0) {
      throw new BadRequestException('repoNames must be a non-empty array');
    }

    const validRepoNames = repoNames.filter(
      (name): name is string =>
        typeof name === 'string' &&
        name.includes('/') &&
        name.split('/').length === 2,
    );

    if (validRepoNames.length === 0) {
      throw new BadRequestException(
        'No valid repo names provided (format: owner/repo)',
      );
    }

    return validRepoNames;
  }

  async fetchMultipleRepoStarHistory(
    validRepoNames: string[],
  ): Promise<{ data: Record<string, StarDataPoint[]> }> {
    const result: Record<string, StarDataPoint[]> = {};

    // Find repos in database
    const repoIds = await this.repoModel
      .find({ fullName: { $in: validRepoNames } })
      .distinct('_id');

    // Query StarHistory and populate repo.fullName
    const starHistoryRecords = (await this.starHistoryModel
      .find({ repoId: { $in: repoIds } })
      .populate('repoId', 'fullName')
      .lean()) as unknown as PopulatedStarHistory[];

    // Process star history records
    for (const record of starHistoryRecords) {
      const repoName: string = record.repoId.fullName;
      const starHistory: StarDataPoint[] = record.history.map((point) => ({
        date: point.date,
        count: point.count,
      }));

      result[repoName] = starHistory;
    }

    return { data: result };
  }
}
