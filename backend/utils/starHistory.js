/*
 * A partial reimplementation in JS of the GitHub Star History API under
 * backend/shared/common/
 *
 * Star-History Repo: github.com/StarHistory/star-history
 * Star-History LICENSE: MIT
 *
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_PER_PAGE = 100;

/**
 * returns an array of integers from `from` to `to`, inclusive.
 * example: range(1, 5) → [1, 2, 3, 4, 5]
 */
export function range(from, to) {
  const arr = [];
  for (let i = from; i <= to; i++) {
    arr.push(i);
  }
  return arr;
}

/**
 * returns a date string in YYYY-MM-DD format
 *
 * @param sometime - a timestamp or Date object
 * sometime must be parseable by Date constructor
 */
export function getDateString(sometime) {
  return new Date(sometime).toISOString().slice(0, 10);
}

/**
 * Fetches a page of stargazers with starred_at timestamps.
 * @param {string} repo - the repository in "owner/name" format
 * @param {string} [token] - optional GitHub token for authenticated requests
 * @param {number} [page] - page number to fetch (default is 1)
 */
export async function getRepoStargazers(repo, token, page) {
  let url = `https://api.github.com/repos/${repo}/stargazers?per_page=${DEFAULT_PER_PAGE}`;
  if (page !== undefined) {
    url += `&page=${page}`;
  }

  return axios.get(url, {
    headers: {
      // this header is required to get starred_at timestamps
      Accept: "application/vnd.github.v3.star+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  });
}

/**
 * Fetches total star count for the repo.
 * @param {string} repo - the repository in "owner/name" format
 * @param {string} [token] - optional GitHub token for authenticated requests
 * @returns {Promise<number>} - total stargazers count
 */
export async function getRepoStargazersCount(repo, token) {
  const { data } = await axios.get(`https://api.github.com/repos/${repo}`, {
    headers: {
      Accept: "application/vnd.github.v3.star+json",
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  });
  return data.stargazers_count;
}

/**
 * Returns an array of { date, count } points (up to maxRequestAmount).
 *
 * 1. Fetches page 1 to read the Link header and get total pageCount.
 * 2. Builds a list of pages to request (either all or sampled).
 * 3. Fetches those pages in parallel.
 * 4. If pages < maxRequestAmount, combines all starred_at and picks evenly.
 *    Otherwise, takes first star of each sampled page to approximate count.
 * 5. Adds a "today" point with the real total count.
 */
export async function getRepoStarRecords(
  repo,
  token = process.env.GITHUB_TOKEN,
  maxRequestAmount = 40,
) {
  // 1) initial request to get Link header
  const firstRes = await getRepoStargazers(repo, token, 1);
  const linkHeader = firstRes.headers.link || "";

  // 2) extract pageCount from Link (if available)
  let pageCount = 1;
  const match = /next.*&page=(\d+).*last/.exec(linkHeader);
  if (match && match[1]) {
    pageCount = parseInt(match[1], 10);
  }

  // If no stars
  if (
    pageCount === 1 &&
    Array.isArray(firstRes.data) &&
    firstRes.data.length === 0
  ) {
    // TODO: Decide how to handle this case
    throw new Error(`No stars found or repo doesn't exist`);
    // return [];
  }

  // 3) build array of pages to fetch
  let requestPages = [];
  if (pageCount < maxRequestAmount) {
    requestPages = range(1, pageCount);
  } else {
    // sample pages evenly
    requestPages = range(1, maxRequestAmount).map((i) =>
      Math.max(1, Math.round((i * pageCount) / maxRequestAmount) - 1),
    );
    if (!requestPages.includes(1)) {
      requestPages[0] = 1;
    }
  }

  // 4) fetch all those pages in parallel
  const responses = await Promise.all(
    requestPages.map((pg) => getRepoStargazers(repo, token, pg)),
  );

  // 5) build the date→count map
  const starMap = new Map();
  if (requestPages.length < maxRequestAmount) {
    // combine all starred_at entries
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
    // take first star of each sampled page for approximate count
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

  // 6) add "today" with real total
  const totalStars = await getRepoStargazersCount(repo, token);
  starMap.set(getDateString(Date.now()), totalStars);

  // 7) convert Map to array of { date, count }
  const result = [];
  starMap.forEach((count, date) => {
    result.push({ date, count });
  });

  return result;
}

// Optional: fetch owner avatar URL
export async function getRepoLogoUrl(repo, token) {
  const owner = repo.split("/")[0];
  const { data } = await axios.get(`https://api.github.com/users/${owner}`, {
    headers: {
      Accept: "application/vnd.github.v3.star+json",
      ...(token ? { Authorization: `bearer ${token}` } : {}),
    },
  });
  return data.avatar_url;
}
