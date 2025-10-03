import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GitHubRateLimit {
  rate: {
    limit: number;
    used: number;
    remaining: number;
    reset: number;
  };
  resources: {
    core: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    search: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    graphql: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    integration_manifest: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    source_import: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    code_scanning_upload: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    actions_runner_registration: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    scim: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
  };
}

@Injectable()
export class RateLimitService {
  private readonly githubToken: string;

  constructor(private configService: ConfigService) {
    this.githubToken = this.configService.get<string>('GITHUB_TOKEN') || '';
  }

  async getCurrentRateLimit(): Promise<GitHubRateLimit | null> {
    try {
      const response = await axios<GitHubRateLimit>({
        method: 'get',
        url: 'https://api.github.com/rate_limit',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${this.githubToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log(`Error fetching rate limit: ${(error as Error).message}`);
      return null;
    }
  }

  getTimeUntilReset(rateLimit: GitHubRateLimit): number {
    const resetTime = rateLimit.rate.reset * 1000;
    const now = Date.now();
    return Math.max(0, resetTime - now);
  }

  formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  logRateLimitStatus(rateLimit: GitHubRateLimit): void {
    const { rate } = rateLimit;
    const resetDate = new Date(rate.reset * 1000);
    const timeUntilReset = this.getTimeUntilReset(rateLimit);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console.log(`GitHub API Rate Limit Status:`);
    console.log(`   Used: ${rate.used}/${rate.limit}`);
    console.log(`   Remaining: ${rate.remaining}`);
    console.log(`   Resets at: ${resetDate.toLocaleString()} ${timezone}`);
    console.log(`   Time until reset: ${this.formatDuration(timeUntilReset)}`);
  }

  async handleRateLimitExceeded(): Promise<void> {
    const rateLimit = await this.getCurrentRateLimit();

    if (!rateLimit) {
      console.log('Could not fetch rate limit, waiting 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return;
    }

    this.logRateLimitStatus(rateLimit);

    const { rate } = rateLimit;

    if (rate.remaining === 0 || rate.used >= 5000) {
      const waitTime = this.getTimeUntilReset(rateLimit);
      const resetDate = new Date(rate.reset * 1000);
      console.log(
        `Rate limit exhausted (${rate.used}/${rate.limit}). Waiting ${this.formatDuration(waitTime)} for reset at ${resetDate.toLocaleString()}...`,
      );

      // Just wait without disconnecting - MongoDB Atlas handles idle connections fine
      // Disconnecting/reconnecting in NestJS doesn't work reliably once module is initialized
      console.log(
        'Keeping database connection alive during wait (MongoDB Atlas supports long idle connections)',
      );

      // Add a small buffer to ensure reset has occurred
      await new Promise((resolve) => setTimeout(resolve, waitTime + 10000));

      console.log('Rate limit should be reset, continuing...');
    } else {
      console.log(
        `Got 403 but rate limit not exhausted (${rate.used}/${rate.limit}). Waiting 5 seconds...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  async withRateLimitRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: unknown) {
        lastError = error;

        if (axios.isAxiosError(error) && error.response?.status === 403) {
          console.log(
            `Attempt ${attempt}: Got 403 error, checking rate limit...`,
          );

          if (attempt < maxRetries) {
            await this.handleRateLimitExceeded();
            console.log(
              `Retrying API call (attempt ${attempt + 1}/${maxRetries})...`,
            );
          } else {
            console.log(`Max retries (${maxRetries}) reached for API call`);
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
