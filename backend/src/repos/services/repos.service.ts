/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repo } from '../../database/schemas/repo.schema';
import { StarHistory } from '../../database/schemas/star-history.schema';

@Injectable()
export class ReposService {
  constructor(
    @InjectModel(Repo.name) private repoModel: Model<Repo>,
    @InjectModel(StarHistory.name)
    private starHistoryModel: Model<StarHistory>,
  ) {}

  async fetchTrendingRepos(date: string) {
    let repos = await this.repoModel
      .find({ trendingDate: date })
      .select('-snapshots')
      .lean();

    if (!repos.length) {
      const [{ latestDate } = {}] = await this.repoModel.aggregate([
        { $match: { trendingDate: { $exists: true, $ne: null } } },
        { $sort: { trendingDate: -1 } },
        { $limit: 1 },
        { $group: { _id: null, latestDate: { $first: '$trendingDate' } } },
      ]);

      if (latestDate) {
        repos = await this.repoModel
          .find({ trendingDate: latestDate })
          .select('-snapshots')
          .lean();
      }
    }
    return repos;
  }

  async fetchSearchedRepos(
    query: string,
    language?: string,
    page = 1,
    limit = 15,
  ): Promise<{ repos: any[]; totalCount: number }> {
    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) {
      return { repos: [], totalCount: 0 };
    }

    const pipeline = this.buildSearchPipeline(
      searchTerms,
      language,
      page,
      limit,
    );
    const [result] = await this.repoModel.aggregate(pipeline);
    const repos = result?.data || [];
    const totalCount = result?.totalCount[0]?.count || 0;

    return { repos, totalCount };
  }

  async fetchTimeToFirstThreeHundredStars(age?: string, limit = 20) {
    const allData = await this.fetchAllTimeToFirstThreeHundredStars(age);
    if (!allData) return null;

    return {
      summary: allData.summary,
      repos: allData.repos.slice(0, limit),
    };
  }

  async fetchSlowestTimeToFirstThreeHundredStars(age?: string, limit = 20) {
    const allData = await this.fetchAllTimeToFirstThreeHundredStars(age);
    if (!allData) return null;

    const slowest = [...allData.repos]
      .sort((a, b) => (b?.daysToThreeHundredStars || 0) - (a?.daysToThreeHundredStars || 0))
      .slice(0, limit);

    return { summary: allData.summary, repos: slowest };
  }

  private async fetchAllTimeToFirstThreeHundredStars(age?: string) {
    const ageFilter = this.getAgeFilter(age);
    const repos = await this.repoModel.find(ageFilter).lean();
    const repoIds = repos.map((repo) => repo._id);

    const starHistories = await this.starHistoryModel
      .find({ repoId: { $in: repoIds } })
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
        if (!starHistory?.history) return null;

        const history = starHistory.history;
        const maxStars = Math.max(...history.map((h) => h.count));
        if (maxStars < 300) return null;

        const firstThreeHundred = history.find((h) => h.count >= 300);
        if (!firstThreeHundred) return null;

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
          daysToThreeHundredStars:
            Math.round(daysToThreeHundredStars * 10) / 10,
          maxStars,
          velocity,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.velocity || 0) - (a?.velocity || 0));

    if (!validRepos.length) return null;

    const days = validRepos.map((r) => r?.daysToThreeHundredStars || 0);
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
        ageFilter: age || 'YTD',
      },
      repos: validRepos,
    };
  }

  private buildSearchPipeline(
    searchTerms: string[],
    language: string | undefined,
    page: number,
    limit: number,
  ) {
    const searchConditions = searchTerms.map((term) => ({
      $or: [
        { fullName: { $regex: term, $options: 'i' } },
        { owner: { $regex: term, $options: 'i' } },
        { topics: { $regex: term, $options: 'i' } },
      ],
    }));

    const matchStage: any = { $and: searchConditions };
    if (language) {
      matchStage.$and.push({ [`language.${language}`]: { $exists: true } });
    }

    return [
      { $match: matchStage },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];
  }

  private getAgeFilter(age?: string) {
    if (!age || age === 'all') return {};
    const startDate = this.calculateStartDate(age);
    return startDate ? { createdAt: { $gte: startDate.toISOString() } } : {};
  }

  private calculateStartDate(age: string): Date | null {
    const now = new Date();
    const calculators = {
      YTD: () => new Date(now.getFullYear(), 0, 1),
      '5y': () =>
        new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      '10y': () =>
        new Date(now.getFullYear() - 10, now.getMonth(), now.getDate()),
    };
    return calculators[age]?.() || null;
  }
}
