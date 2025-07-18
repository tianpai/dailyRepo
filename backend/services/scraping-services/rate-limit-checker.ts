import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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

/**
 * Fetches current GitHub API rate limit status
 */
export async function getCurrentRateLimit(
  token?: string,
): Promise<GitHubRateLimit | null> {
  try {
    const response = await axios({
      method: "get",
      url: "https://api.github.com/rate_limit",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token || process.env.GITHUB_TOKEN}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log(`Error fetching rate limit: ${error.message}`);
    return null;
  }
}

/**
 * Checks if we have sufficient API calls remaining
 */
export function hasEnoughRateLimit(
  rateLimit: GitHubRateLimit,
  requiredCalls: number = 100,
): boolean {
  const remaining = rateLimit.rate.remaining;
  return remaining >= requiredCalls;
}

/**
 * Calculates time until rate limit reset
 */
export function getTimeUntilReset(rateLimit: GitHubRateLimit): number {
  const resetTime = rateLimit.rate.reset * 1000; // Convert to milliseconds
  const now = Date.now();
  return Math.max(0, resetTime - now);
}

/**
 * Formats time duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Logs current rate limit status
 */
export function logRateLimitStatus(rateLimit: GitHubRateLimit): void {
  const { rate } = rateLimit;
  const resetDate = new Date(rate.reset * 1000);
  const timeUntilReset = getTimeUntilReset(rateLimit);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log(`GitHub API Rate Limit Status:`);
  console.log(`   Used: ${rate.used}/${rate.limit}`);
  console.log(`   Remaining: ${rate.remaining}`);
  console.log(`   Resets at: ${resetDate.toLocaleString()} ${timezone}`);
  console.log(`   Time until reset: ${formatDuration(timeUntilReset)}`);
}

/**
 * Intelligent wait strategy for rate limit handling
 * If rate limit is at max (5000), wait for reset
 * If rate limit is below max, wait 5 seconds and retry
 */
export async function handleRateLimitExceeded(token?: string): Promise<void> {
  const rateLimit = await getCurrentRateLimit(token);

  if (!rateLimit) {
    console.log("Could not fetch rate limit, waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return;
  }

  logRateLimitStatus(rateLimit);

  const { rate } = rateLimit;

  // If we're at the maximum limit (5000), wait for reset
  if (rate.remaining === 0 || rate.used >= 5000) {
    const waitTime = getTimeUntilReset(rateLimit);
    const resetDate = new Date(rate.reset * 1000);
    console.log(
      `Rate limit exhausted (${
        rate.used
      }/${rate.limit}). Waiting ${formatDuration(
        waitTime,
      )} for reset at ${resetDate.toLocaleString()}...`,
    );

    // Add a small buffer to ensure reset has occurred
    await new Promise((resolve) => setTimeout(resolve, waitTime + 10000));
    console.log("Rate limit should be reset, continuing...");
  } else {
    // If we're not at max limit, something else caused the 403, wait briefly
    console.log(
      `Got 403 but rate limit not exhausted (${rate.used}/${rate.limit}). Waiting 5 seconds...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

/**
 * Wrapper function that retries an API call with intelligent rate limit handling
 */
export async function withRateLimitRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  token?: string,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Check if it's a 403 (rate limit) error
      if (error.response?.status === 403) {
        console.log(
          `Attempt ${attempt}: Got 403 error, checking rate limit...`,
        );

        if (attempt < maxRetries) {
          await handleRateLimitExceeded(token);
          console.log(
            `Retrying API call (attempt ${attempt + 1}/${maxRetries})...`,
          );
        } else {
          console.log(`Max retries (${maxRetries}) reached for API call`);
          throw error;
        }
      } else {
        // For non-403 errors, don't retry
        throw error;
      }
    }
  }

  throw lastError;
}
