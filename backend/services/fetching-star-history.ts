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

  return axios.get(url, {
    headers: {
      // Required header to receive starred_at timestamps in response
      Accept: "application/vnd.github.v3.star+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  });
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
  const { data } = await axios.get(API_REPO + repo, {
    headers: {
      Accept: "application/vnd.github.v3.star+json",
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  });
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
    // Sample pages evenly across the total range
    requestPages = range(1, maxRequestAmount).map((i) =>
      Math.max(1, Math.round((i * pageCount) / maxRequestAmount) - 1),
    );
    // Ensure first page is always included
    if (!requestPages.includes(1)) {
      requestPages[0] = 1;
    }
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
    // Low-resolution sampling: use first star from each sampled page for approximation
    responses.forEach((res, idx) => {
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        const firstStar = data[0];
        const date = getDateString(firstStar.starred_at);
        const countApprox = DEFAULT_PER_PAGE * (requestPages[idx] - 1);
        starMap.set(date, countApprox);
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
  const { data } = await axios.get(API_USER + owner, {
    headers: {
      Accept: "application/vnd.github.v3.star+json",
      ...(token ? { Authorization: `bearer ${token}` } : {}),
    },
  });
  return data.avatar_url;
}
