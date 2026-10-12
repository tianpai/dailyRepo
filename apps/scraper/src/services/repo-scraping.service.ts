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

export interface TrendingDeveloper {
  username: string;
  repositoryPath: string;
}

export interface TrendingScrape<T> {
  items: T[];
  failedPages: string[];
}

@Injectable()
export class RepoScrapingService {
  scrapeTrending(): Promise<TrendingScrape<string>> {
    return this.collectPages(
      'repositories',
      (lang) =>
        `https://github.com/trending/${encodeURIComponent(lang)}?since=daily`,
      (html) => {
        const $ = cheerio.load(html);
        const repositories: string[] = [];
        $('.Box-row h2 a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && /^\/[^/]+\/[^/]+$/.test(href)) {
            repositories.push(href.slice(1));
          }
        });
        return repositories;
      },
      (repo) => repo,
    );
  }

  scrapeTrendingDevelopers(): Promise<TrendingScrape<TrendingDeveloper>> {
    return this.collectPages(
      'developers',
      (lang) => {
        const path = lang ? `/${encodeURIComponent(lang)}` : '';
        return `https://github.com/trending/developers${path}?since=daily`;
      },
      (html) => {
        const $ = cheerio.load(html);
        const developers: TrendingDeveloper[] = [];
        $('.Box-row.d-flex').each((_, element) => {
          const username = $(element)
            .find('p.f4 a.Link--secondary')
            .text()
            .trim();
          const href = $(element).find('h1.h4 a[href]').attr('href');
          if (username && href && /^\/[^/]+\/[^/]+$/.test(href)) {
            developers.push({ username, repositoryPath: href.slice(1) });
          }
        });
        return developers;
      },
      (developer) => developer.username,
    );
  }

  private async collectPages<T>(
    kind: string,
    url: (language: string) => string,
    extract: (html: string) => T[],
    identity: (item: T) => string,
  ): Promise<TrendingScrape<T>> {
    const results = await Promise.allSettled(
      LANGS.map((language) => this.fetchPage(url(language), extract)),
    );
    const items = new Map<string, T>();
    const failedPages: string[] = [];
    results.forEach((result, index) => {
      const page = LANGS[index] || 'all';
      if (result.status === 'rejected') {
        failedPages.push(page);
        console.error(`Failed to collect ${kind} page: ${page}`);
        return;
      }
      for (const item of result.value) {
        if (!items.has(identity(item))) items.set(identity(item), item);
      }
      console.log(`Collected ${result.value.length} ${kind} from ${page}`);
    });
    console.log(
      `Collected ${items.size} unique ${kind}; ${failedPages.length} failed pages`,
    );
    return { items: [...items.values()], failedPages };
  }

  private async fetchPage<T>(url: string, extract: (html: string) => T[]) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return extract(await response.text());
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempt * 1000),
        );
      }
    }
    throw new Error('Trending page retries exhausted');
  }
}
