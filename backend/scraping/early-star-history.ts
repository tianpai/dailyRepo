/*
 * Early Star History Scraper
 * 
 * Focuses specifically on capturing dense data points for the first 100 stars
 * of repositories to improve accuracy of time-to-100-stars analysis.
 */

import { getRepoStargazers, getDateString } from "./fetching-star-history";

/**
 * Fetches detailed star history for the first 100 stars of a repository
 * 
 * @param repo - repository identifier in "owner/name" format
 * @param token - GitHub personal access token
 * @returns Promise resolving to array of {date, count} objects for first 100 stars
 */
export async function getEarlyStarHistory(
  repo: string,
  token: string = process.env.GITHUB_TOKEN,
): Promise<Array<{ date: string; count: number }>> {
  const earlyPages = [1, 2]; // First 200 stars to ensure we cover first 100
  
  try {
    // Fetch first two pages of stargazers
    const responses = await Promise.all(
      earlyPages.map((page) => getRepoStargazers(repo, token, page))
    );

    // Combine all early stargazers
    const allEarlyStars = [];
    responses.forEach((res) => {
      if (Array.isArray(res.data)) {
        allEarlyStars.push(...res.data);
      }
    });

    if (allEarlyStars.length === 0) {
      throw new Error(`No early stars found for ${repo}`);
    }

    // Create dense data points for first 100 stars (or all if less than 100)
    const result: Array<{ date: string; count: number }> = [];
    const maxStars = Math.min(100, allEarlyStars.length);
    
    // Add data points at intervals: every 5 stars for first 50, then every 10
    for (let i = 0; i < maxStars; i++) {
      const shouldInclude = 
        i < 50 ? (i + 1) % 5 === 0 || i === 0 || i === maxStars - 1 :
        (i + 1) % 10 === 0 || i === maxStars - 1;
      
      if (shouldInclude) {
        const star = allEarlyStars[i];
        const date = getDateString(star.starred_at);
        const count = i + 1;
        result.push({ date, count });
      }
    }

    // Always include exact 100th star if it exists
    if (allEarlyStars.length >= 100) {
      const hundredthStar = allEarlyStars[99]; // 0-indexed
      const date = getDateString(hundredthStar.starred_at);
      // Replace or add the 100th star data point
      const existingIndex = result.findIndex(point => point.count === 100);
      if (existingIndex >= 0) {
        result[existingIndex] = { date, count: 100 };
      } else {
        result.push({ date, count: 100 });
      }
    }

    return result.sort((a, b) => a.count - b.count);
    
  } catch (error) {
    console.error(`Failed to fetch early star history for ${repo}:`, error);
    throw error;
  }
}

/**
 * Merges early star history data with existing star history
 * Removes overlapping data points and sorts chronologically
 * 
 * @param existingHistory - current star history data
 * @param earlyHistory - new early star history data
 * @returns merged and sorted star history
 */
export function mergeStarHistory(
  existingHistory: Array<{ date: string; count: number }>,
  earlyHistory: Array<{ date: string; count: number }>,
): Array<{ date: string; count: number }> {
  const merged = new Map<string, number>();
  
  // Add existing data
  existingHistory.forEach((point) => {
    merged.set(point.date, point.count);
  });
  
  // Add early data (will overwrite if same date exists)
  earlyHistory.forEach((point) => {
    merged.set(point.date, point.count);
  });
  
  // Convert back to array and sort by count
  const result: Array<{ date: string; count: number }> = [];
  merged.forEach((count, date) => {
    result.push({ date, count });
  });
  
  return result.sort((a, b) => a.count - b.count);
}