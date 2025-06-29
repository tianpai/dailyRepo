/** @fileoverview
 * scrape GitHub DOM and keep useful information
 * No API calls, no Github token used, just DOM scraping
 *
 */

import * as cheerio from "cheerio";

/* =============================================================================
 *
 *                Scrape GitHub trending repositories by language
 *
 * =============================================================================
 */

const LANGS = [
  "",
  "javascript",
  "typescript",
  "python",
  "go",
  "c",
  "rust",
  "c++",
  "java",
];

/**
 * Scrapes trending repositories from GitHub across multiple programming
 * languages
 */
export async function scrapeTrending(): Promise<string[]> {
  try {
    function unionStrings(...arrays: string[][]): string[] {
      return [...new Set(arrays.flat())];
    }
    const langUrl = (l: string): string => {
      return `https://github.com/trending/${l}?since=daily`;
    };
    let repos: string[] = [];
    for (const lang of LANGS) {
      // take unique repos from all languages
      repos = unionStrings(repos, await extractTrendingRepos(langUrl(lang)));
      setTimeout(() => {}, 1500);
    }
    console.log("Trending repositories by language:", repos);
    return repos;
  } catch (error) {
    console.error("Error fetching or parsing HTML:", error);
    return [];
  }
}

/**
 * this function handles scraping GitHub trending repositories by language.
 * When lang is "", it will scrape all languages. (the default trending page)
 *
 */
async function extractTrendingRepos(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const repositories: string[] = [];
    $(".Box-row").each((index, element) => {
      const repoLink = $(element).find('h2 a[href*="/"]');
      if (repoLink.length > 0) {
        const fullName: string = repoLink.text().trim();
        // Remove extra spaces and normalize the format
        const cleanName = fullName
          .replace(/\s+/g, " ")
          .replace(" / ", "/")
          .trim();
        repositories.push(cleanName);
      }
    });
    return repositories;
  } catch (error) {
    console.error("Error fetching or parsing HTML:", error);
    return [];
  }
}

/* =============================================================================
 *
 *            Scrape GitHub trending developers and their projects
 *
 * =============================================================================
 */

interface TrendingDeveloper {
  username: string;
  repositoryPath: string;
}

/**
 * Scrapes trending developers and their popular repositories from GitHub
 */
export async function scrapeTrendingDevelopers(): Promise<TrendingDeveloper[]> {
  try {
    const devUrl = (l: string) => {
      return `https://github.com/trending/developers${l}?since=daily`;
    };
    const devs: TrendingDeveloper[] = [];
    for (const lang of LANGS) {
      devs.push(...(await extractTrendingDevelopers(devUrl(lang))));
      setTimeout(() => {}, 2000);
    }
    console.log("Trending developers:", devs);
    return devs;
  } catch (error) {
    console.error("Error fetching or parsing HTML:", error);
    return [];
  }
}

/**
 * Extracts trending developer information from GitHub trending developers page
 */
async function extractTrendingDevelopers(
  url: string,
): Promise<TrendingDeveloper[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const developers: TrendingDeveloper[] = [];
    $(".Box-row.d-flex").each((index, element) => {
      // Extract username from the profile link
      const usernameLink = $(element).find("p.f4 a.Link--secondary");
      const username = usernameLink.text().trim();
      // Try to find popular repository
      const repoLink = $(element).find('h1.h4 a[href*="/"][href*="/"]');
      // Only include developers who have both username and repository
      if (username && repoLink.length > 0) {
        const href = repoLink.attr("href");
        if (href) {
          developers.push({
            username,
            repositoryPath: href.startsWith("/") ? href.slice(1) : href,
          });
        }
      }
    });
    return developers;
  } catch (error) {
    console.error("Error fetching or parsing HTML:", error);
    return [];
  }
}
