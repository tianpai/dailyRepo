/*
 * GitHub Star History API Implementation
 *
 * Fetches star history data for GitHub repositories by sampling stargazer
 * data across time periods and calculating historical star counts.
 *
 * Features:
 * - Fetches stargazer data with timestamps
 * - Samples data points for efficient API usage
 * - Returns time-series data of star counts
 * - Handles rate limiting and pagination
 */

import axios from "axios";
import dotenv from "dotenv";
import { withRateLimitRetry } from "./rate-limit-checker";
dotenv.config();

// GitHub API base URLs
const API_REPO = "https://api.github.com/repos/";
const API_USER = "https://api.github.com/users/";

const DEFAULT_PER_PAGE = 100;

/**
 * Generates an array of consecutive integers from start to end (inclusive)
 *
 * @param from - starting number
 * @param to - ending number
 * @returns array of integers [from, from+1, ..., to]
 *
 * @example
 * range(1, 5) // returns [1, 2, 3, 4, 5]
 * range(10, 12) // returns [10, 11, 12]
 */
export function range(from: number, to: number): number[] {
  const arr = [];
  for (let i = from; i <= to; i++) {
    arr.push(i);
  }
  return arr;
}

/**
 * Converts a timestamp, date string, or Date object to YYYY-MM-DD format
 *
 * @param sometime - timestamp (number), date string, or Date object
 * @returns date string in ISO format (YYYY-MM-DD)
 *
 * @example
 * getDateString(1640995200000) // returns "2022-01-01"
 * getDateString("2022-12-25") // returns "2022-12-25"
 */
export function getDateString(sometime: number | string | Date): string {
  return new Date(sometime).toISOString().slice(0, 10);
}

/**
 * Fetches a single page of stargazers with starred_at timestamps from GitHub API
 *
 * @param repo - repository identifier in "owner/name" format
 * @param token - GitHub personal access token for authentication
 * @param page - page number to fetch (1-based indexing)
 * @returns Promise resolving to axios response with stargazer data
 */
export async function getRepoStargazers(
  repo: string,
  token: string,
  page: number,
) {
  let url = API_REPO + repo + `/stargazers?per_page=${DEFAULT_PER_PAGE}`;
  if (page !== undefined) {
    url += `&page=${page}`;
  }

  return withRateLimitRetry(
    () =>
      axios.get(url, {
        headers: {
          // Required header to receive starred_at timestamps in response
          Accept: "application/vnd.github.v3.star+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `token ${token}` } : {}),
        },
      }),
    3,
    token,
  );
}

/**
 * Fetches the total star count for a repository
 *
 * @param repo - repository identifier in "owner/name" format
 * @param token - GitHub personal access token for authentication
 * @returns Promise resolving to total stargazers count
 */
export async function getRepoStargazersCount(
  repo: string,
  token?: string,
): Promise<number> {
  const { data } = await withRateLimitRetry(
    () =>
      axios.get(API_REPO + repo, {
        headers: {
          Accept: "application/vnd.github.v3.star+json",
          ...(token ? { Authorization: `token ${token}` } : {}),
        },
      }),
    3,
    token,
  );
  return data.stargazers_count;
}

/**
 * Generates historical star count data for a repository by sampling stargazer timestamps
 *
 * This function implements an intelligent sampling strategy:
 * 1. Fetches first page to determine total pages via Link header
 * 2. If total pages < maxRequestAmount: fetches all pages and samples evenly
 * 3. If total pages >= maxRequestAmount: samples pages evenly across the range
 * 4. Constructs time-series data points showing cumulative star counts over time
 * 5. Adds current date with actual total star count as final data point
 *
 * @param repo - repository identifier in "owner/name" format
 * @param token - GitHub personal access token (defaults to GITHUB_TOKEN env var)
 * @param maxRequestAmount - maximum number of API requests to make (default: 60)
 * @returns Promise resolving to array of {date, count} objects representing star history
 *
 * @throws Error if repository has no stars or doesn't exist
 */
export async function getRepoStarRecords(
  repo: string,
  token: string = process.env.GITHUB_TOKEN,
  maxRequestAmount: number = 60,
): Promise<Array<{ date: string; count: number }>> {
  // Fetch first page to extract pagination info from Link header
  const firstRes = await getRepoStargazers(repo, token, 1);
  const linkHeader = firstRes.headers.link || "";

  // Parse total page count from Link header pagination info
  let pageCount = 1;
  const match = /next.*&page=(\d+).*last/.exec(linkHeader);
  if (match && match[1]) {
    pageCount = parseInt(match[1], 10);
  }

  // Handle repositories with no stars
  if (
    pageCount === 1 &&
    Array.isArray(firstRes.data) &&
    firstRes.data.length === 0
  ) {
    throw new Error(`No stars found or repo doesn't exist`);
  }

  // Determine which pages to fetch based on total pages and request limit
  let requestPages: number[] = [];
  if (pageCount < maxRequestAmount) {
    // Fetch all pages if under the request limit
    requestPages = range(1, pageCount);
  } else {
    // Always include first 3 pages for better early-stage resolution (for 100-star analysis)
    const earlyPages = [1, 2, 3].filter((page) => page <= pageCount);
    requestPages = [...earlyPages];

    // Add maxRequestAmount spread-out pages starting from page 4
    const startPage = 4;
    const spreadPages = range(1, maxRequestAmount)
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

    // Sort all pages
    requestPages.sort((a, b) => a - b);
  }

  // Fetch all selected pages concurrently
  const responses = await Promise.all(
    requestPages.map((pg) => getRepoStargazers(repo, token, pg)),
  );

  // Build date-to-count mapping using different strategies based on data density
  const starMap = new Map<string, number>();
  if (requestPages.length < maxRequestAmount) {
    // High-resolution sampling: combine all stargazer data and sample evenly
    const allStars = [];
    responses.forEach((res) => {
      allStars.push(...res.data);
    });
    const step = Math.floor(allStars.length / maxRequestAmount) || 1;
    for (let i = 0; i < allStars.length; i += step) {
      const date = getDateString(allStars[i].starred_at);
      const count = i + 1;
      starMap.set(date, count);
    }
  } else {
    // Enhanced sampling with dense early data points for 100-star analysis
    const earlyPagesSet = new Set([1, 2, 3]);

    responses.forEach((res, idx) => {
      const data = res.data;
      const pageNum = requestPages[idx];

      if (Array.isArray(data) && data.length > 0) {
        if (earlyPagesSet.has(pageNum)) {
          // For early pages (1-3), add multiple data points for granular early history
          const baseCount = DEFAULT_PER_PAGE * (pageNum - 1);
          data.forEach((star, starIdx) => {
            const count = baseCount + starIdx + 1;
            // Add every 5th star for first 100 stars, then every 10th
            if (
              count <= 100 &&
              (count % 5 === 0 || count === 1 || count === 100)
            ) {
              const date = getDateString(star.starred_at);
              starMap.set(date, count);
            } else if (count > 100 && count % 10 === 0) {
              const date = getDateString(star.starred_at);
              starMap.set(date, count);
            }
          });
        } else {
          // For later pages, use existing approximation logic
          const firstStar = data[0];
          const date = getDateString(firstStar.starred_at);
          const countApprox = DEFAULT_PER_PAGE * (pageNum - 1);
          starMap.set(date, countApprox);
        }
      }
    });
  }

  // Add current date with accurate total star count as final data point
  const totalStars = await getRepoStargazersCount(repo, token);
  starMap.set(getDateString(Date.now()), totalStars);

  // Convert Map to array of date-count objects
  const result: Array<{ date: string; count: number }> = [];
  starMap.forEach((count, date) => {
    result.push({ date, count });
  });

  return result;
}

/**
 * Fetches the avatar URL for a repository owner
 *
 * @param repo - repository identifier in "owner/name" format
 * @param token - GitHub personal access token for authentication
 * @returns Promise resolving to avatar URL string
 */
export async function getRepoLogoUrl(
  repo: string,
  token?: string,
): Promise<string> {
  const owner = repo.split("/")[0];
  const { data } = await withRateLimitRetry(
    () =>
      axios.get(API_USER + owner, {
        headers: {
          Accept: "application/vnd.github.v3.star+json",
          ...(token ? { Authorization: `bearer ${token}` } : {}),
        },
      }),
    3,
    token,
  );
  return data.avatar_url;
}
