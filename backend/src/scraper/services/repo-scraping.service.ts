import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

const LANGS = [
  '',
  'javascript',
  'typescript',
  'python',
  'go',
  'c',
  'rust',
  'c++',
  'java',
];

interface TrendingDeveloper {
  username: string;
  repositoryPath: string;
}

@Injectable()
export class RepoScrapingService {
  async scrapeTrending(): Promise<string[]> {
    try {
      console.log('Starting parallel trending repositories scraping...');

      const langUrl = (l: string): string => {
        return `https://github.com/trending/${l}?since=daily`;
      };

      const scrapingPromises = LANGS.map(async (lang) => {
        console.log(
          `Fetching trending repositories for language: ${lang || 'all'}`,
        );
        return await this.extractTrendingReposWithRetry(
          langUrl(lang),
          lang || 'all',
        );
      });

      const results = await Promise.allSettled(scrapingPromises);

      const allRepos: string[] = [];
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        const lang = LANGS[index] || 'all';
        if (result.status === 'fulfilled') {
          allRepos.push(...result.value);
          successCount++;
          console.log(
            `Successfully scraped ${result.value.length} repos for ${lang}`,
          );
        } else {
          failureCount++;
          console.log(`Failed to scrape language ${lang}: ${result.reason}`);
        }
      });

      const uniqueRepos = [...new Set(allRepos)];

      console.log(
        `Scraping completed: ${uniqueRepos.length} unique repositories`,
      );
      console.log(`Success rate: ${successCount}/${LANGS.length} languages`);
      if (failureCount > 0) {
        console.log(`Failed languages: ${failureCount}`);
      }

      return uniqueRepos;
    } catch (error) {
      console.log(`Error in trending scraping: ${error}`);
      return [];
    }
  }

  private async extractTrendingReposWithRetry(
    url: string,
    language: string,
    maxRetries: number = 3,
  ): Promise<string[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const repos = await this.extractTrendingRepos(url);
        if (attempt > 1) {
          console.log(`Retry successful for ${language} on attempt ${attempt}`);
        }
        return repos;
      } catch (error: unknown) {
        const is403 =
          (error instanceof Error && error.message?.includes('403')) ||
          (typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            error.status === 403);
        const isLastAttempt = attempt === maxRetries;

        if (is403 && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `403 detected for ${language}, retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.log(
            `Failed to scrape ${language} after ${attempt} attempts: ${errorMsg}`,
          );
          return [];
        }
      }
    }
    return [];
  }

  private async extractTrendingRepos(url: string): Promise<string[]> {
    const response = await fetch(url);

    if (response.status === 403) {
      throw new Error(`403 Forbidden: ${url}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const repositories: string[] = [];

    $('.Box-row').each((_, element) => {
      const repoLink = $(element).find("h2 a[href*='/']");
      if (repoLink.length > 0) {
        const fullName: string = repoLink.text().trim();
        const cleanName = fullName
          .replace(/\s+/g, ' ')
          .replace(' / ', '/')
          .trim();
        repositories.push(cleanName);
      }
    });

    return repositories;
  }

  async scrapeTrendingDevelopers(): Promise<TrendingDeveloper[]> {
    try {
      console.log('Starting parallel trending developers scraping...');

      const devUrl = (l: string) => {
        const langPath = l ? `/${l}` : '';
        return `https://github.com/trending/developers${langPath}?since=daily`;
      };

      const scrapingPromises = LANGS.map(async (lang) => {
        console.log(
          `Fetching trending developers for language: ${lang || 'all'}`,
        );
        return await this.extractTrendingDevelopersWithRetry(
          devUrl(lang),
          lang || 'all',
        );
      });

      const results = await Promise.allSettled(scrapingPromises);

      const allDevelopers: TrendingDeveloper[] = [];
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        const lang = LANGS[index] || 'all';
        if (result.status === 'fulfilled') {
          allDevelopers.push(...result.value);
          successCount++;
          console.log(
            `Successfully scraped ${result.value.length} developers for ${lang}`,
          );
        } else {
          failureCount++;
          console.log(
            `Failed to scrape developers for ${lang}: ${result.reason}`,
          );
        }
      });

      const uniqueDevelopers = allDevelopers.filter(
        (dev, index, arr) =>
          arr.findIndex((d) => d.username === dev.username) === index,
      );

      console.log(
        `Developer scraping completed: ${uniqueDevelopers.length} unique developers`,
      );
      console.log(`Success rate: ${successCount}/${LANGS.length} languages`);
      if (failureCount > 0) {
        console.log(`Failed languages: ${failureCount}`);
      }

      return uniqueDevelopers;
    } catch (error) {
      console.log(`Error in developers scraping: ${error}`);
      return [];
    }
  }

  private async extractTrendingDevelopersWithRetry(
    url: string,
    language: string,
    maxRetries: number = 3,
  ): Promise<TrendingDeveloper[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const developers = await this.extractTrendingDevelopers(url);
        if (attempt > 1) {
          console.log(
            `Retry successful for ${language} developers on attempt ${attempt}`,
          );
        }
        return developers;
      } catch (error: unknown) {
        const is403 =
          (error instanceof Error && error.message?.includes('403')) ||
          (typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            error.status === 403);
        const isLastAttempt = attempt === maxRetries;

        if (is403 && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `403 detected for ${language} developers, retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.log(
            `Failed to scrape ${language} developers after ${attempt} attempts: ${errorMsg}`,
          );
          return [];
        }
      }
    }
    return [];
  }

  private async extractTrendingDevelopers(
    url: string,
  ): Promise<TrendingDeveloper[]> {
    const response = await fetch(url);

    if (response.status === 403) {
      throw new Error(`403 Forbidden: ${url}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const developers: TrendingDeveloper[] = [];

    $('.Box-row.d-flex').each((_, element) => {
      const usernameLink = $(element).find('p.f4 a.Link--secondary');
      const username = usernameLink.text().trim();
      const repoLink = $(element).find("h1.h4 a[href*='/'][href*='/']");

      if (username && repoLink.length > 0) {
        const href = repoLink.attr('href');
        if (href) {
          developers.push({
            username,
            repositoryPath: href.startsWith('/') ? href.slice(1) : href,
          });
        }
      }
    });

    return developers;
  }
}
