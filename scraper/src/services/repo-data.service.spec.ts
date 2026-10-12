import {
  RepoDataService,
  CaptureBatch,
  ProcessedRepo,
} from './repo-data.service';
import {
  DeveloperObservation,
  RepoObservation,
  RepoObservationSchema,
  ScrapeDay,
} from '@dailyrepo/database';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RepoScrapingService } from './repo-scraping.service';
import { ScraperConfigService } from './scraper-config.service';

jest.mock('axios');

const observation: ProcessedRepo = {
  fullName: 'owner/repo',
  date: '2026-10-09',
  owner: 'owner',
  name: 'repo',
  description: '',
  url: 'https://github.com/owner/repo',
  language: { TypeScript: 100 },
  topics: ['observability'],
  createdAt: '2026-01-01T12:34:56Z',
  lastUpdate: '2026-10-09T09:30:00Z',
  license: null,
};

function batch(
  overrides: Partial<CaptureBatch<ProcessedRepo>> = {},
): CaptureBatch<ProcessedRepo> {
  return {
    date: observation.date,
    items: [observation],
    expectedCount: 1,
    failedRecords: [],
    failedPages: [],
    ...overrides,
  };
}

describe('dated repository collection', () => {
  const repos = {
    init: jest.fn(),
    bulkWrite: jest.fn(),
    countDocuments: jest.fn(),
  };
  const developers = { init: jest.fn(), bulkWrite: jest.fn() };
  const days = { init: jest.fn(), updateOne: jest.fn() };
  const mode = { isTestMode: jest.fn(), getDate: () => observation.date };
  let service: RepoDataService;

  beforeEach(() => {
    jest.resetAllMocks();
    repos.countDocuments.mockResolvedValue(1);
    mode.isTestMode.mockReturnValue(false);
    service = new RepoDataService(
      repos as unknown as Model<RepoObservation>,
      developers as unknown as Model<DeveloperObservation>,
      days as unknown as Model<ScrapeDay>,
      { get: () => '' } as unknown as ConfigService,
      {} as RepoScrapingService,
      mode as unknown as ScraperConfigService,
    );
  });

  it('writes complete metadata using the repository/date key and preserves the first capture on reruns', async () => {
    await service.saveTrendingData(batch());
    await service.saveTrendingData(
      batch({
        items: [{ ...observation, topics: ['changed-later'] }],
      }),
    );
    expect(repos.bulkWrite.mock.calls[0][0]).toEqual([
      {
        updateOne: {
          filter: { fullName: observation.fullName, date: observation.date },
          update: { $setOnInsert: observation },
          upsert: true,
        },
      },
    ]);
    expect(
      repos.bulkWrite.mock.calls[1][0][0].updateOne.update,
    ).not.toHaveProperty('$set');
    expect(RepoObservationSchema.indexes()).toContainEqual([
      { fullName: 1, date: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(RepoObservationSchema.path('trendingRecord')).toBeUndefined();
    expect(RepoObservationSchema.path('trendingDate')).toBeUndefined();
  });

  it('stores a later day under a different key instead of replacing the earlier day', async () => {
    await service.saveTrendingData(batch());
    await service.saveTrendingData(
      batch({
        date: '2026-10-10',
        items: [{ ...observation, date: '2026-10-10', topics: ['OCR'] }],
      }),
    );
    expect(
      repos.bulkWrite.mock.calls.map(
        ([operations]) => operations[0].updateOne.filter,
      ),
    ).toEqual([
      { fullName: 'owner/repo', date: '2026-10-09' },
      { fullName: 'owner/repo', date: '2026-10-10' },
    ]);
  });

  it('publishes completion only after observations are persisted and counted', async () => {
    await service.saveTrendingData(batch());
    expect(days.updateOne.mock.calls[0][1]).toMatchObject({
      $set: { status: 'running' },
      $unset: { completedAt: '' },
    });
    expect(days.updateOne.mock.calls[1][1]).toEqual({
      $set: {
        status: 'complete',
        repositoryCount: 1,
        completedAt: expect.any(Date),
      },
    });
    expect(repos.bulkWrite.mock.invocationCallOrder[0]).toBeLessThan(
      days.updateOne.mock.invocationCallOrder[1],
    );
    expect(repos.countDocuments).toHaveBeenCalledWith({
      date: observation.date,
    });
  });

  it('retains successful observations but marks a failed page as partial', async () => {
    await service.saveTrendingData(batch({ failedPages: ['python'] }));
    expect(repos.bulkWrite).toHaveBeenCalled();
    expect(days.updateOne.mock.calls[0][1].$set.failedPages).toEqual([
      'python',
    ]);
    expect(days.updateOne.mock.calls[1][1]).toEqual({
      $set: { status: 'partial', repositoryCount: 1 },
    });
  });

  it('marks missing repository metadata as partial rather than complete', async () => {
    await service.saveTrendingData(
      batch({
        expectedCount: 2,
        failedRecords: ['owner/missing'],
      }),
    );
    expect(days.updateOne.mock.calls[0][1].$set.failedRepositories).toEqual([
      'owner/missing',
    ]);
    expect(days.updateOne.mock.calls[1][1].$set.status).toBe('partial');
    expect(days.updateOne.mock.calls[1][1].$set).not.toHaveProperty(
      'completedAt',
    );
  });

  it('does not report an empty capture as successful collection', async () => {
    repos.countDocuments.mockResolvedValue(0);
    await service.saveTrendingData(batch({ items: [], expectedCount: 0 }));
    expect(repos.bulkWrite).not.toHaveBeenCalled();
    expect(days.updateOne.mock.calls[1][1].$set.status).toBe('failed');
  });

  it('clears earlier completion and leaves the day unfinished when persistence fails', async () => {
    repos.bulkWrite.mockRejectedValue(new Error('write failed'));
    await expect(service.saveTrendingData(batch())).rejects.toThrow(
      'write failed',
    );
    expect(days.updateOne).toHaveBeenCalledTimes(1);
    expect(days.updateOne.mock.calls[0][1]).toMatchObject({
      $set: { status: 'running' },
      $unset: { completedAt: '' },
    });
  });

  it('rejects mixed dates before writing any data', async () => {
    await expect(
      service.saveTrendingData(
        batch({
          items: [{ ...observation, date: '2026-10-10' }],
        }),
      ),
    ).rejects.toThrow('batch UTC date');
    expect(repos.bulkWrite).not.toHaveBeenCalled();
    expect(days.updateOne).not.toHaveBeenCalled();
  });

  it('does not initialize indexes or write data in test-no-save mode', async () => {
    mode.isTestMode.mockReturnValue(true);
    await service.saveTrendingData(batch());
    await service.saveTrendingDevelopers({
      date: observation.date,
      items: [],
      expectedCount: 0,
      failedRecords: [],
      failedPages: [],
    });
    expect(repos.init).not.toHaveBeenCalled();
    expect(repos.bulkWrite).not.toHaveBeenCalled();
    expect(developers.init).not.toHaveBeenCalled();
    expect(developers.bulkWrite).not.toHaveBeenCalled();
    expect(days.updateOne).not.toHaveBeenCalled();
  });

  it('stores developer history using username and date without an embedded date array', async () => {
    const developer = {
      username: 'owner',
      date: observation.date,
      repositoryPath: 'owner/repo',
      profileUrl: 'https://github.com/owner',
      avatar_url: '',
    };
    await service.saveTrendingDevelopers({
      date: observation.date,
      items: [developer],
      expectedCount: 1,
      failedRecords: [],
      failedPages: [],
    });
    expect(developers.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { username: 'owner', date: observation.date },
          update: { $setOnInsert: developer },
          upsert: true,
        },
      },
    ]);
  });
});

describe('collection inputs', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-09T23:59:59Z'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('uses one UTC observation date across midnight and preserves original repository timestamps', async () => {
    const config = new ScraperConfigService();
    const pages = {
      scrapeTrending: jest
        .fn()
        .mockResolvedValue({ items: ['owner/repo'], failedPages: [] }),
      scrapeTrendingDevelopers: jest.fn().mockResolvedValue({
        items: [{ username: 'owner', repositoryPath: 'owner/repo' }],
        failedPages: [],
      }),
    };
    jest.mocked(axios.get).mockImplementation(async (url) => {
      if (url === 'https://api.github.com/repos/owner/repo')
        return {
          data: {
            full_name: 'owner/repo',
            owner: { login: 'owner' },
            name: 'repo',
            description: '',
            html_url: observation.url,
            topics: observation.topics,
            created_at: observation.createdAt,
            updated_at: observation.lastUpdate,
            languages_url: 'https://api.github.com/repos/owner/repo/languages',
          },
        };
      if (url.endsWith('/languages')) return { data: observation.language };
      return { data: { avatar_url: 'avatar', location: null } };
    });
    const service = new RepoDataService(
      null as unknown as Model<RepoObservation>,
      null as unknown as Model<DeveloperObservation>,
      null as unknown as Model<ScrapeDay>,
      { get: () => '' } as unknown as ConfigService,
      pages as unknown as RepoScrapingService,
      config,
    );
    const pending = service.prepTrendingData();
    await jest.runAllTimersAsync();
    const repositories = await pending;
    jest.setSystemTime(new Date('2026-10-10T00:01:00Z'));
    const developers = await service.prepTrendingDevelopers();
    expect(repositories.items[0]).toMatchObject({
      date: '2026-10-09',
      createdAt: observation.createdAt,
      lastUpdate: observation.lastUpdate,
    });
    expect(developers.items[0].date).toBe('2026-10-09');
  });

  it('tracks failed API calls without logging credential-bearing error objects', async () => {
    const pages = {
      scrapeTrending: jest
        .fn()
        .mockResolvedValue({ items: ['owner/repo'], failedPages: [] }),
    };
    jest.mocked(axios.get).mockRejectedValue({
      message: 'request failed',
      config: { headers: { Authorization: 'secret-token' } },
    });
    const service = new RepoDataService(
      null as unknown as Model<RepoObservation>,
      null as unknown as Model<DeveloperObservation>,
      null as unknown as Model<ScrapeDay>,
      { get: () => '' } as unknown as ConfigService,
      pages as unknown as RepoScrapingService,
      new ScraperConfigService(),
    );
    const result = await service.prepTrendingData();
    expect(result.items).toEqual([]);
    expect(result.failedRecords).toEqual(['owner/repo']);
    expect(JSON.stringify(jest.mocked(console.error).mock.calls)).not.toContain(
      'secret-token',
    );
  });
});
