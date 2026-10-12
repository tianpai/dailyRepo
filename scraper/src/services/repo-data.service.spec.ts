import { RepoDataService } from './repo-data.service';
import {
  Repo,
  RepoSnapshot,
  ScrapeDay,
  TrendingDeveloper,
} from '@dailyrepo/database';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RepoScrapingService } from './repo-scraping.service';
import { ScraperConfigService } from './scraper-config.service';

describe('repository capture', () => {
  const repos = { bulkWrite: jest.fn() };
  const snapshots = { bulkWrite: jest.fn(), countDocuments: jest.fn() };
  const days = { updateOne: jest.fn() };
  const mode = { isTestMode: jest.fn() };
  const data = [
    {
      fullName: 'owner/repo',
      owner: 'owner',
      name: 'repo',
      description: '',
      url: '',
      language: { TypeScript: 100 },
      topics: ['observability'],
      createdAt: '2026-01-01',
      lastUpdate: '2026-10-09',
      license: null,
      trendingDate: '2026-10-09',
    },
  ];
  let service: RepoDataService;

  beforeEach(() => {
    jest.resetAllMocks();
    snapshots.countDocuments.mockResolvedValue(1);
    mode.isTestMode.mockReturnValue(false);
    service = new RepoDataService(
      repos as unknown as Model<Repo>,
      {} as Model<TrendingDeveloper>,
      snapshots as unknown as Model<RepoSnapshot>,
      days as unknown as Model<ScrapeDay>,
      { get: () => '' } as unknown as ConfigService,
      {} as RepoScrapingService,
      mode as unknown as ScraperConfigService,
    );
  });

  it('preserves dated inputs on reruns and continues writing the existing repo collection', async () => {
    await service.saveTrendingData(data);
    expect(snapshots.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { date: '2026-10-09', fullName: 'owner/repo' },
          update: {
            $setOnInsert: {
              date: '2026-10-09',
              fullName: 'owner/repo',
              language: { TypeScript: 100 },
              topics: ['observability'],
            },
          },
          upsert: true,
        },
      },
    ]);
    expect(repos.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: {
            $set: data[0],
            $addToSet: { trendingRecord: '2026-10-09' },
          },
        }),
      }),
    ]);
    expect(days.updateOne).toHaveBeenCalledWith(
      { date: '2026-10-09' },
      { $set: { repositoryCount: 1, completedAt: expect.any(Date) } },
      { upsert: true },
    );
    expect(snapshots.bulkWrite.mock.invocationCallOrder[0]).toBeLessThan(
      repos.bulkWrite.mock.invocationCallOrder[0],
    );
    expect(repos.bulkWrite.mock.invocationCallOrder[0]).toBeLessThan(
      days.updateOne.mock.invocationCallOrder[0],
    );
  });

  it('does not publish a complete scrape when repo persistence fails', async () => {
    repos.bulkWrite.mockRejectedValue(new Error('write failed'));
    await expect(service.saveTrendingData(data)).rejects.toThrow(
      'write failed',
    );
    expect(days.updateOne).not.toHaveBeenCalled();
  });

  it('keeps test-no-save mode free of all database writes', async () => {
    mode.isTestMode.mockReturnValue(true);
    await service.saveTrendingData(data);
    expect(snapshots.bulkWrite).not.toHaveBeenCalled();
    expect(repos.bulkWrite).not.toHaveBeenCalled();
    expect(days.updateOne).not.toHaveBeenCalled();
  });
});
