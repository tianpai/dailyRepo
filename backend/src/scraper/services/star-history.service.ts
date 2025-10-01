import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RateLimitService } from './rate-limit.service';

const API_REPO = 'https://api.github.com/repos/';
const DEFAULT_PER_PAGE = 100;

interface StargazerResponse {
  data: Array<{ starred_at: string }>;
  headers: { link?: string };
}

@Injectable()
export class StarHistoryService {
  private readonly githubToken: string;

  constructor(
    private configService: ConfigService,
    private rateLimitService: RateLimitService,
  ) {
    this.githubToken = this.configService.get<string>('GITHUB_TOKEN') || '';
  }

  async fetchStarHistory(
    repo: string,
    maxRequestAmount: number = 60,
  ): Promise<Array<{ date: string; count: number }>> {
    const firstRes = await this.getRepoStargazers(repo, 1);
    const linkHeader = firstRes.headers.link || '';

    let pageCount = 1;
    const match = /next.*&page=(\d+).*last/.exec(linkHeader);
    if (match && match[1]) {
      pageCount = parseInt(match[1], 10);
    }

    if (
      pageCount === 1 &&
      Array.isArray(firstRes.data) &&
      firstRes.data.length === 0
    ) {
      throw new Error(`No stars found or repo doesn't exist`);
    }

    let requestPages: number[] = [];
    if (pageCount < maxRequestAmount) {
      requestPages = this.range(1, pageCount);
    } else {
      const earlyPages = [1, 2, 3].filter((page) => page <= pageCount);
      requestPages = [...earlyPages];

      const startPage = 4;
      const spreadPages = this.range(1, maxRequestAmount)
        .map((i) =>
          Math.max(
            startPage,
            Math.round(
              startPage + (i * (pageCount - startPage + 1)) / maxRequestAmount,
            ),
          ),
        )
        .filter((page) => page <= pageCount && !requestPages.includes(page));

      requestPages = [...requestPages, ...spreadPages];
      requestPages.sort((a, b) => a - b);
    }

    const responses = await Promise.all(
      requestPages.map((pg) => this.getRepoStargazers(repo, pg)),
    );

    const starMap = new Map<string, number>();
    if (requestPages.length < maxRequestAmount) {
      const allStars: Array<{ starred_at: string }> = [];
      responses.forEach((res) => {
        allStars.push(...res.data);
      });
      const step = Math.floor(allStars.length / maxRequestAmount) || 1;
      for (let i = 0; i < allStars.length; i += step) {
        const date = this.getDateString(allStars[i].starred_at);
        const count = i + 1;
        starMap.set(date, count);
      }
    } else {
      const earlyPagesSet = new Set([1, 2, 3]);

      responses.forEach((res, idx) => {
        const data = res.data;
        const pageNum = requestPages[idx];

        if (Array.isArray(data) && data.length > 0) {
          if (earlyPagesSet.has(pageNum)) {
            const baseCount = DEFAULT_PER_PAGE * (pageNum - 1);
            data.forEach((star, starIdx) => {
              const count = baseCount + starIdx + 1;
              if (
                (count <= 100 &&
                  (count % 5 === 0 || count === 1 || count === 100)) ||
                (count > 100 && count % 10 === 0)
              ) {
                const date = this.getDateString(star.starred_at);
                starMap.set(date, count);
              }
            });
          } else {
            const firstStar = data[0];
            const date = this.getDateString(firstStar.starred_at);
            const countApprox = DEFAULT_PER_PAGE * (pageNum - 1);
            starMap.set(date, countApprox);
          }
        }
      });
    }

    const totalStars = await this.getRepoStargazersCount(repo);
    starMap.set(this.getDateString(Date.now()), totalStars);

    const result: Array<{ date: string; count: number }> = [];
    starMap.forEach((count, date) => {
      result.push({ date, count });
    });

    return result;
  }

  private async getRepoStargazers(
    repo: string,
    page: number,
  ): Promise<StargazerResponse> {
    const url =
      API_REPO + repo + `/stargazers?per_page=${DEFAULT_PER_PAGE}&page=${page}`;

    const response = await this.rateLimitService.withRateLimitRetry(() =>
      axios.get(url, {
        headers: {
          Accept: 'application/vnd.github.v3.star+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `token ${this.githubToken}`,
        },
      }),
    );

    return response as StargazerResponse;
  }

  private async getRepoStargazersCount(repo: string): Promise<number> {
    const { data } = await this.rateLimitService.withRateLimitRetry(() =>
      axios.get<{ stargazers_count: number }>(API_REPO + repo, {
        headers: {
          Accept: 'application/vnd.github.v3.star+json',
          Authorization: `token ${this.githubToken}`,
        },
      }),
    );
    return data.stargazers_count;
  }

  private range(from: number, to: number): number[] {
    const arr: number[] = [];
    for (let i = from; i <= to; i++) {
      arr.push(i);
    }
    return arr;
  }

  private getDateString(sometime: number | string | Date): string {
    return new Date(sometime).toISOString().slice(0, 10);
  }
}
