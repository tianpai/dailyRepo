import { parseDate, weeklyPeriod } from './periods';
import { parseCommand } from './cli';

describe('analysis periods', () => {
  it('runs Monday analysis over the preceding complete UTC week', () => {
    expect(weeklyPeriod(undefined, new Date('2026-10-12T19:00:00Z'))).toEqual({
      start: '2026-10-05',
      end: '2026-10-11',
      year: 2026,
      week: 41,
    });
  });

  it('keeps a completed year-crossing week under its Monday key', () => {
    expect(
      weeklyPeriod('2026-01-02', new Date('2026-01-05T00:00:00Z')),
    ).toEqual({
      start: '2025-12-29',
      end: '2026-01-04',
      year: 2025,
      week: 53,
    });
  });

  it('does not calculate an incomplete week', () => {
    expect(() =>
      weeklyPeriod('2026-10-11', new Date('2026-10-11T23:59:59Z')),
    ).toThrow('completed');
  });

  it('rejects dates that JavaScript would silently roll into another month', () => {
    expect(() => parseDate('2026-02-30')).toThrow('Invalid UTC date');
    expect(() => parseDate('2026-2-03')).toThrow('Invalid UTC date');
  });

  it('rejects a daily date passed to the weekly command', () => {
    expect(() => parseCommand(['weekly', '--date', '2026-10-01'])).toThrow(
      '--date is only valid for daily',
    );
  });
});
