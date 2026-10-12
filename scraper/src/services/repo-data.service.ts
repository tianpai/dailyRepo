import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  DeveloperObservation,
  RepoObservation,
  ScrapeDay,
} from '@dailyrepo/database';
import { RepoScrapingService } from './repo-scraping.service';
import { ScraperConfigService } from './scraper-config.service';

interface GitHubRepoData {
  id: number;
  full_name: string;
  description: string;
  license?: { name: string } | null;
  created_at: string;
  updated_at: string;
  topics?: string[];
  languages_url: string;
}

export interface ProcessedRepo {
  repo_id: number;
  fullName: string;
  date: string;
  description: string;
  language: Record<string, number>;
  topics: string[];
  createdAt: string;
  lastUpdate: string;
  license: string | null;
}

export interface ProcessedDeveloper {
  username: string;
  date: string;
  repositoryPath: string;
  profileUrl: string;
  location?: string;
  avatar_url: string;
}

interface GitHubUser {
  avatar_url: string;
  location?: string;
}

export interface CaptureBatch<T> {
  date: string;
  items: T[];
  expectedCount: number;
  failedRecords: string[];
  failedPages: string[];
}

export function isCompleteCapture<T>(batch: CaptureBatch<T>): boolean {
  return (
    batch.expectedCount > 0 &&
    batch.items.length === batch.expectedCount &&
    batch.failedRecords.length === 0 &&
    batch.failedPages.length === 0
  );
}

@Injectable()
export class RepoDataService {
  private readonly headers: Record<string, string>;

  constructor(
    @InjectModel(RepoObservation.name)
    private repoModel: Model<RepoObservation>,
    @InjectModel(DeveloperObservation.name)
    private developerModel: Model<DeveloperObservation>,
    @InjectModel(ScrapeDay.name) private scrapeDayModel: Model<ScrapeDay>,
    config: ConfigService,
    private repoScrapingService: RepoScrapingService,
    private scraperConfig: ScraperConfigService,
  ) {
    const token = config.get<string>('GITHUB_TOKEN');
    this.headers = {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async prepTrendingData(): Promise<CaptureBatch<ProcessedRepo>> {
    const date = this.scraperConfig.getDate();
    const scraped = await this.repoScrapingService.scrapeTrending();
    const names = this.scraperConfig.isTestMode()
      ? scraped.items.slice(0, 3)
      : scraped.items;
    const items: ProcessedRepo[] = [];
    const failedRecords: string[] = [];

    for (let index = 0; index < names.length; index++) {
      const name = names[index];
      console.log(`[${index + 1}/${names.length}] ${name}`);
      try {
        items.push(await this.processOneRepo(name, date));
      } catch {
        failedRecords.push(name);
        console.error(`Failed to collect repository metadata: ${name}`);
      }
      if (index < names.length - 1) await this.wait(1000);
    }

    return {
      date,
      items,
      expectedCount: names.length,
      failedRecords,
      failedPages: scraped.failedPages,
    };
  }

  async saveTrendingData(batch: CaptureBatch<ProcessedRepo>) {
    if (this.scraperConfig.isTestMode()) {
      return { date: batch.date, status: 'test-no-save', repositoryCount: 0 };
    }
    this.validateDates(batch);
    await this.repoModel.init();
    await this.scrapeDayModel.init();

    // Clear any earlier completion before starting another persistence attempt.
    // If writing fails, this date remains unfinished rather than reporting success.
    await this.scrapeDayModel.updateOne(
      { date: batch.date },
      {
        $set: {
          status: 'running',
          expectedRepositoryCount: batch.expectedCount,
          failedRepositories: batch.failedRecords,
          failedPages: batch.failedPages,
        },
        $setOnInsert: { repositoryCount: 0 },
        $unset: { completedAt: '' },
      },
      { upsert: true },
    );

    if (batch.items.length) {
      await this.repoModel.bulkWrite(
        batch.items.map((repo) => ({
          updateOne: {
            filter: { fullName: repo.fullName, date: batch.date },
            update: { $setOnInsert: repo },
            upsert: true,
          },
        })),
      );
    }

    const repositoryCount = await this.repoModel.countDocuments({
      date: batch.date,
    });
    const status = isCompleteCapture(batch)
      ? 'complete'
      : batch.items.length
        ? 'partial'
        : 'failed';
    await this.scrapeDayModel.updateOne(
      { date: batch.date },
      {
        $set: {
          status,
          repositoryCount,
          ...(status === 'complete' ? { completedAt: new Date() } : {}),
        },
      },
    );
    return { date: batch.date, status, repositoryCount };
  }

  private async processOneRepo(
    name: string,
    date: string,
  ): Promise<ProcessedRepo> {
    const { data } = await axios.get<GitHubRepoData>(
      `https://api.github.com/repos/${name}`,
      { headers: this.headers, timeout: 30_000 },
    );
    await this.wait(3000);
    const language = await this.fetchLanguages(data.languages_url);
    await this.wait(3000);
    return {
      repo_id: data.id,
      fullName: data.full_name,
      date,
      description: data.description,
      language,
      topics: data.topics || [],
      createdAt: data.created_at,
      lastUpdate: data.updated_at,
      license: data.license?.name || null,
    };
  }

  private async fetchLanguages(url: string): Promise<Record<string, number>> {
    try {
      const response = await axios.get<Record<string, number>>(url, {
        headers: this.headers,
        timeout: 30_000,
      });
      return response.data;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 403)
        throw error;
      await this.wait(2000);
      const response = await axios.get<Record<string, number>>(url, {
        headers: this.headers,
        timeout: 30_000,
      });
      return response.data;
    }
  }

  async prepTrendingDevelopers(): Promise<CaptureBatch<ProcessedDeveloper>> {
    const date = this.scraperConfig.getDate();
    const scraped = await this.repoScrapingService.scrapeTrendingDevelopers();
    const developers = this.scraperConfig.isTestMode()
      ? scraped.items.slice(0, 3)
      : scraped.items;
    const items: ProcessedDeveloper[] = [];
    const failedRecords: string[] = [];

    for (let index = 0; index < developers.length; index++) {
      const developer = developers[index];
      try {
        const { data } = await axios.get<GitHubUser>(
          `https://api.github.com/users/${developer.username}`,
          { headers: this.headers, timeout: 30_000 },
        );
        items.push({
          ...developer,
          date,
          profileUrl: `https://github.com/${developer.username}`,
          location: data.location || undefined,
          avatar_url: data.avatar_url || '',
        });
      } catch {
        failedRecords.push(developer.username);
        console.error(
          `Failed to collect developer metadata: ${developer.username}`,
        );
      }
      if (index < developers.length - 1) await this.wait(2000);
    }

    return {
      date,
      items,
      expectedCount: developers.length,
      failedRecords,
      failedPages: scraped.failedPages,
    };
  }

  async saveTrendingDevelopers(batch: CaptureBatch<ProcessedDeveloper>) {
    if (this.scraperConfig.isTestMode()) return;
    this.validateDates(batch);
    if (!batch.items.length) return;
    await this.developerModel.init();
    await this.developerModel.bulkWrite(
      batch.items.map((developer) => ({
        updateOne: {
          filter: { username: developer.username, date: batch.date },
          update: { $setOnInsert: developer },
          upsert: true,
        },
      })),
    );
  }

  private validateDates<T extends { date: string }>(batch: CaptureBatch<T>) {
    if (batch.items.some((item) => item.date !== batch.date)) {
      throw new Error('All observations must belong to the batch UTC date');
    }
  }

  private wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
