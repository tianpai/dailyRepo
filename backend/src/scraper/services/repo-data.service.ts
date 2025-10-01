import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Repo } from '../../database/schemas/repo.schema';
import { TrendingDeveloper } from '../../database/schemas/developer.schema';
import { getTodayUTC, getUTCDate } from '../../common/utils/time.util';
import { RepoScrapingService } from './repo-scraping.service';
import { ScraperConfigService } from './scraper-config.service';

interface GitHubRepoData {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string;
  html_url: string;
  license?: { name: string } | null;
  created_at: string;
  updated_at: string;
  topics: string[];
  languages_url: string;
}

interface LanguageData {
  [language: string]: number;
}

interface ProcessedRepo {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  language: LanguageData;
  topics: string[];
  createdAt: string;
  lastUpdate: string;
  license: string | null;
  trendingDate: string;
}

interface ProcessedDeveloper {
  username: string;
  repositoryPath: string;
  profileUrl: string;
  location?: string;
  avatar_url: string;
}

interface GithubUser {
  login: string;
  avatar_url: string;
  location?: string;
}

@Injectable()
export class RepoDataService {
  private readonly githubToken: string;

  constructor(
    @InjectModel(Repo.name) private repoModel: Model<Repo>,
    @InjectModel(TrendingDeveloper.name)
    private developerModel: Model<TrendingDeveloper>,
    private configService: ConfigService,
    private repoScrapingService: RepoScrapingService,
    private scraperConfig: ScraperConfigService,
  ) {
    this.githubToken = this.configService.get<string>('GITHUB_TOKEN') || '';
  }

  async prepTrendingData(): Promise<ProcessedRepo[]> {
    const trendingData = await this.repoScrapingService.scrapeTrending();
    let trendingRepoNames = trendingData || [];
    const today = getTodayUTC();

    if (this.scraperConfig.isTestMode()) {
      trendingRepoNames = trendingRepoNames.slice(0, 3);
    }

    const repoNamesWithSlash = trendingRepoNames.map((name) => `/${name}`);

    console.log(
      `Processing ${repoNamesWithSlash.length} trending repos sequentially...`,
    );
    console.log(
      'There is a 1 second delay between each repo to avoid rate limits',
    );

    const repos: ProcessedRepo[] = [];
    for (let i = 0; i < repoNamesWithSlash.length; i++) {
      const repoName = repoNamesWithSlash[i];
      const totalNumRepo = repoNamesWithSlash.length;
      try {
        console.log(`[${i + 1}/${totalNumRepo}] ${repoName}...`);
        const repo = await this.processOneRepo(repoName, today);
        repos.push(repo);
      } catch (error) {
        console.error(`Error processing repo ${repoName}:`, error);
      }

      if (i < repoNamesWithSlash.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return repos;
  }

  async saveTrendingData(repos: ProcessedRepo[]): Promise<void> {
    if (!repos.length) {
      return;
    }

    if (this.scraperConfig.isTestMode()) {
      return;
    }

    const ops = repos.map((repo) => ({
      updateOne: {
        filter: { owner: repo.owner, name: repo.name },
        update: {
          $set: repo,
          $addToSet: { trendingRecord: repo.trendingDate },
        },
        upsert: true,
      },
    }));

    await this.repoModel.bulkWrite(ops);
  }

  private async processOneRepo(
    rawName: string,
    today: string,
  ): Promise<ProcessedRepo> {
    const fullData = await this.getRepo(rawName);
    if (!fullData) {
      throw new Error(`Failed to fetch repo data for ${rawName}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const langs = await this.fetchLanguages(fullData.languages_url);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return this.transformRepo(fullData, langs, today);
  }

  private async getRepo(repo: string): Promise<GitHubRepoData | null> {
    try {
      const res = await axios.get<GitHubRepoData>(
        `https://api.github.com/repos${repo}`,
        {
          headers: {
            Authorization: `Bearer ${this.githubToken}`,
            Accept: 'application/vnd.github.v3.raw',
          },
        },
      );
      return res.data;
    } catch (error) {
      console.error('Error fetching repository information:', error);
      return null;
    }
  }

  private async fetchLanguages(url: string): Promise<LanguageData> {
    try {
      const res = await axios.get<LanguageData>(url, {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.log('Rate limit hit, waiting 2 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const res = await axios.get<LanguageData>(url, {
          headers: {
            Authorization: `Bearer ${this.githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        return res.data;
      }
      throw error;
    }
  }

  private transformRepo(
    rawdata: GitHubRepoData,
    languages: LanguageData,
    today: string,
  ): ProcessedRepo {
    const {
      full_name,
      name,
      owner: { login: owner },
      description,
      html_url,
      license,
      created_at,
      updated_at,
      topics = [],
    } = rawdata;

    const createdAt = getUTCDate(created_at);
    const lastUpdate = getUTCDate(updated_at);

    return {
      fullName: full_name,
      owner,
      name,
      description,
      url: html_url,
      language: languages,
      topics,
      createdAt,
      lastUpdate,
      license: license?.name || null,
      trendingDate: today,
    };
  }

  async prepTrendingDevelopers(): Promise<ProcessedDeveloper[]> {
    let trendingDevelopers =
      await this.repoScrapingService.scrapeTrendingDevelopers();

    if (this.scraperConfig.isTestMode()) {
      trendingDevelopers = trendingDevelopers.slice(0, 3);
    }

    const processedDevelopers: ProcessedDeveloper[] = [];

    for (let i = 0; i < trendingDevelopers.length; i++) {
      const dev = trendingDevelopers[i];
      try {
        const userInfo = await this.getGitHubUser(dev.username);
        const processedDev: ProcessedDeveloper = {
          username: dev.username,
          repositoryPath: dev.repositoryPath,
          profileUrl: `https://github.com/${dev.username}`,
          location: userInfo?.location || undefined,
          avatar_url: userInfo?.avatar_url || '',
        };
        processedDevelopers.push(processedDev);

        console.log(`${i + 1}/${trendingDevelopers.length}:`, dev.username);
        if (i < trendingDevelopers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing developer ${dev.username}:`, error);
      }
    }

    return processedDevelopers;
  }

  private async getGitHubUser(username: string): Promise<GithubUser | null> {
    try {
      const res = await axios.get<GithubUser>(
        `https://api.github.com/users/${username}`,
        {
          headers: {
            Authorization: `Bearer ${this.githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );
      return res.data;
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error);
      return null;
    }
  }

  async saveTrendingDevelopers(
    developers: ProcessedDeveloper[],
  ): Promise<void> {
    if (!developers.length) {
      return;
    }

    if (this.scraperConfig.isTestMode()) {
      return;
    }

    const today = getTodayUTC();
    const ops = developers.map((dev) => ({
      updateOne: {
        filter: { username: dev.username },
        update: {
          $set: dev,
          $addToSet: { trendingRecord: today },
        },
        upsert: true,
      },
    }));

    await this.developerModel.bulkWrite(ops);
  }
}
