import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RepoSnapshot, ScrapeDay } from '@dailyrepo/database';
import { Model } from 'mongoose';
import { datesBetween } from './periods';
import { JobInputError } from './errors';

export interface RepositoryInput {
  date: string;
  fullName: string;
  language: Record<string, number>;
  topics: string[];
}

export function selectInputs(
  snapshots: RepositoryInput[],
  days: Array<{ date: string; repositoryCount: number }>,
  start: string,
  end: string,
): RepositoryInput[] {
  const expected = datesBetween(start, end);
  const counts = new Map<string, number>();
  for (const snapshot of snapshots) {
    if (snapshot.date >= start && snapshot.date <= end) {
      counts.set(snapshot.date, (counts.get(snapshot.date) ?? 0) + 1);
    }
  }
  const completed = new Map(days.map((day) => [day.date, day.repositoryCount]));
  const missing = expected.filter((date) => !completed.has(date));
  if (missing.length) {
    throw new JobInputError(
      `Missing completed repository snapshots for: ${missing.join(', ')}. Historical trending dates alone cannot recover the original topics and languages.`,
    );
  }
  for (const date of expected) {
    if ((counts.get(date) ?? 0) !== completed.get(date)) {
      throw new JobInputError(
        `Repository snapshot count does not match the completed scrape for ${date}`,
      );
    }
  }

  const latest = new Map<string, RepositoryInput>();
  for (const snapshot of snapshots) {
    if (snapshot.date < start || snapshot.date > end) continue;
    const previous = latest.get(snapshot.fullName);
    if (!previous || previous.date < snapshot.date) {
      latest.set(snapshot.fullName, snapshot);
    }
  }
  return [...latest.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName),
  );
}

@Injectable()
export class AnalysisInputService {
  constructor(
    @InjectModel(RepoSnapshot.name) private snapshots: Model<RepoSnapshot>,
    @InjectModel(ScrapeDay.name) private days: Model<ScrapeDay>,
  ) {}

  async load(start: string, end: string): Promise<RepositoryInput[]> {
    const date = { $gte: start, $lte: end };
    const [snapshots, days] = await Promise.all([
      this.snapshots.find({ date }).lean(),
      this.days.find({ date }).lean(),
    ]);
    return selectInputs(snapshots, days, start, end);
  }
}
