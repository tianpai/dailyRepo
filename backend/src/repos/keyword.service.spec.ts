import { KeywordService } from './keyword.service';
import { Keywords, WeeklyTopicFindings } from '@dailyrepo/database';
import { Model } from 'mongoose';

describe('saved analysis reads', () => {
  it('returns missing daily data without computing or writing results', async () => {
    const keywords = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn(),
    };
    const service = new KeywordService(
      keywords as unknown as Model<Keywords>,
      {} as Model<WeeklyTopicFindings>,
    );
    expect(await service.fetchKeywordAnalysis('2026-10-09')).toEqual({
      originalTopicsCount: 0,
      topKeywords: [],
      related: {},
      clusterSizes: {},
    });
    expect(keywords.findOne).toHaveBeenCalledWith({ date: '2026-10-09' });
    expect(keywords.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('can omit related topics in a response without altering stored analysis', async () => {
    const analysis = {
      originalTopicsCount: 1,
      topKeywords: ['observability'],
      related: new Map([['observability', ['logging']]]),
      clusterSizes: new Map([['observability', 1]]),
    };
    const keywords = { findOne: jest.fn().mockResolvedValue({ analysis }) };
    const service = new KeywordService(
      keywords as unknown as Model<Keywords>,
      {} as Model<WeeklyTopicFindings>,
    );
    expect(
      (await service.fetchKeywordAnalysis('2026-10-09', false)).related,
    ).toEqual({});
    expect(analysis.related.get('observability')).toEqual(['logging']);
  });

  it('serves the latest saved weekly analysis without starting a job', async () => {
    const sort = jest.fn().mockResolvedValue({
      languageTopicMap: { TypeScript: { observability: 3 } },
    });
    const weekly = {
      findOne: jest.fn().mockReturnValue({ sort }),
      findOneAndUpdate: jest.fn(),
    };
    const service = new KeywordService(
      {} as Model<Keywords>,
      weekly as unknown as Model<WeeklyTopicFindings>,
    );
    expect(await service.groupTopicsByLanguage()).toEqual({
      TypeScript: { observability: 3 },
    });
    expect(sort).toHaveBeenCalledWith({ year: -1, week: -1 });
    expect(weekly.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
