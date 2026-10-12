import { datesBetween } from './periods';
import { selectInputs, RepositoryInput } from './analysis-input.service';

const snapshot = (
  date: string,
  topic: string,
  fullName = 'owner/repo',
): RepositoryInput => ({
  date,
  fullName,
  language: { TypeScript: 100 },
  topics: [topic],
});

describe('historical analysis inputs', () => {
  it('loads the requested day rather than the latest data', () => {
    const inputs = [
      snapshot('2026-10-01', 'old-topic'),
      snapshot('2026-10-08', 'new-topic'),
    ];
    expect(
      selectInputs(
        inputs,
        [{ date: '2026-10-01', repositoryCount: 1 }],
        '2026-10-01',
        '2026-10-01',
      ),
    ).toEqual([inputs[0]]);
  });

  it('uses each repo once, with its latest captured metadata inside the week', () => {
    const dates = datesBetween('2026-10-05', '2026-10-11');
    const inputs = dates.map((date) => snapshot(date, date));
    inputs.push(snapshot('2026-10-12', 'outside-period'));
    const days = dates.map((date) => ({ date, repositoryCount: 1 }));
    expect(selectInputs(inputs, days, dates[0], dates[6])).toEqual([inputs[6]]);
  });

  it('refuses to save a week when even one scrape day is missing', () => {
    const dates = datesBetween('2026-10-05', '2026-10-11');
    const inputs = dates.map((date) => snapshot(date, date));
    const days = dates.slice(1).map((date) => ({ date, repositoryCount: 1 }));
    expect(() => selectInputs(inputs, days, dates[0], dates[6])).toThrow(
      '2026-10-05',
    );
  });

  it('refuses a partially persisted capture even when a completion record exists', () => {
    expect(() =>
      selectInputs(
        [snapshot('2026-10-01', 'topic')],
        [{ date: '2026-10-01', repositoryCount: 2 }],
        '2026-10-01',
        '2026-10-01',
      ),
    ).toThrow('snapshot count');
  });
});
