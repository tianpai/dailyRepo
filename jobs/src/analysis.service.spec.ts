import { AnalysisService } from './analysis.service';
import { AnalysisInputService } from './analysis-input.service';
import { ClusteringService } from './clustering.service';
import { Keywords, WeeklyTopicFindings } from '@dailyrepo/database';
import { Model } from 'mongoose';

describe('standalone analysis', () => {
  const keywords = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
  const weekly = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
  const inputs = { load: jest.fn() };
  const clustering = { clusterTopics: jest.fn() };
  let service: AnalysisService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: new Date('2026-10-12T19:00:00Z') });
    keywords.findOne.mockResolvedValue(null);
    weekly.findOne.mockResolvedValue(null);
    inputs.load.mockResolvedValue([
      {
        fullName: 'owner/repo',
        date: '2026-10-09',
        topics: ['observability'],
        language: { TypeScript: 100 },
      },
    ]);
    clustering.clusterTopics.mockResolvedValue({
      originalTopicsCount: 1,
      topKeywords: ['observability'],
      related: { observability: ['observability'] },
      clusterSizes: { observability: 1 },
    });
    service = new AnalysisService(
      keywords as unknown as Model<Keywords>,
      weekly as unknown as Model<WeeklyTopicFindings>,
      inputs as unknown as AnalysisInputService,
      clustering as unknown as ClusteringService,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('backfills a requested day with full related-keyword data', async () => {
    await service.daily('2026-10-09');
    expect(inputs.load).toHaveBeenCalledWith('2026-10-09', '2026-10-09');
    expect(clustering.clusterTopics).toHaveBeenCalledWith(
      expect.objectContaining({
        includeRelated: true,
        topics: ['observability'],
      }),
    );
    expect(keywords.findOneAndUpdate).toHaveBeenCalledWith(
      { date: '2026-10-09' },
      expect.objectContaining({
        $set: expect.objectContaining({ source: 'repository-snapshots-v1' }),
      }),
      { upsert: true, new: true },
    );
  });

  it('preserves already-saved analysis unless a rerun is explicit', async () => {
    keywords.findOne.mockResolvedValue({ analysis: {} });
    expect(await service.daily('2026-10-09')).toEqual({
      status: 'existing',
      date: '2026-10-09',
    });
    expect(inputs.load).not.toHaveBeenCalled();
    expect(keywords.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not report success after a database write fails', async () => {
    keywords.findOneAndUpdate.mockRejectedValue(new Error('write failed'));
    await expect(service.daily('2026-10-09')).rejects.toThrow('write failed');
  });

  it('defaults weekly computation to the preceding completed week', async () => {
    await service.weeklyTopics();
    expect(inputs.load).toHaveBeenCalledWith('2026-10-05', '2026-10-11');
    expect(weekly.findOneAndUpdate).toHaveBeenCalledWith(
      { year: 2026, week: 41 },
      expect.objectContaining({
        $set: expect.objectContaining({
          periodStart: '2026-10-05',
          periodEnd: '2026-10-11',
        }),
      }),
      { upsert: true, new: true },
    );
  });

  it('does not calculate or save output when historical inputs are unavailable', async () => {
    inputs.load.mockRejectedValue(new Error('missing snapshots'));
    await expect(service.daily('2026-10-09')).rejects.toThrow(
      'missing snapshots',
    );
    expect(clustering.clusterTopics).not.toHaveBeenCalled();
    expect(keywords.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
