/** @fileoverview
 * scrape GitHub DOM and keep useful information
 * No API calls, no Github token used, just DOM scraping
 *
 */

import * as cheerio from "cheerio";
import chalk from "chalk";

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
 * languages using parallel processing
 */
export async function scrapeTrending(): Promise<string[]> {
  try {
    console.log(
      chalk.cyan("Starting parallel trending repositories scraping..."),
    );

    const langUrl = (l: string): string => {
      return `https://github.com/trending/${l}?since=daily`;
    };

    // Process all languages in parallel
    const scrapingPromises = LANGS.map(async (lang) => {
      console.log(
        chalk.blue(
          `Fetching trending repositories for language: ${lang || "all"}`,
        ),
      );
      return await extractTrendingReposWithRetry(langUrl(lang), lang || "all");
    });

    const results = await Promise.allSettled(scrapingPromises);

    // Collect successful results and log failures
    const allRepos: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const lang = LANGS[index] || "all";
      if (result.status === "fulfilled") {
        allRepos.push(...result.value);
        successCount++;
        console.log(
          chalk.green(
            `Successfully scraped ${result.value.length} repos for ${lang}`,
          ),
        );
      } else {
        failureCount++;
        console.log(
          chalk.red(`Failed to scrape language ${lang}: ${result.reason}`),
        );
      }
    });

    // Remove duplicates
    const uniqueRepos = [...new Set(allRepos)];

    console.log(
      chalk.cyan(
        `Scraping completed: ${uniqueRepos.length} unique repositories`,
      ),
    );
    console.log(
      chalk.green(`Success rate: ${successCount}/${LANGS.length} languages`),
    );
    if (failureCount > 0) {
      console.log(chalk.red(`Failed languages: ${failureCount}`));
    }

    return uniqueRepos;
  } catch (error) {
    console.log(chalk.red(`Error in trending scraping: ${error}`));
    return [];
  }
}

/**
 * Extracts trending repos with retry logic for 403 errors
 */
async function extractTrendingReposWithRetry(
  url: string,
  language: string,
  maxRetries: number = 3,
): Promise<string[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const repos = await extractTrendingRepos(url);
      if (attempt > 1) {
        console.log(
          chalk.green(`Retry successful for ${language} on attempt ${attempt}`),
        );
      }
      return repos;
    } catch (error: unknown) {
      const is403 = (error as any)?.message?.includes("403") || (error as any)?.status === 403;
      const isLastAttempt = attempt === maxRetries;

      if (is403 && !isLastAttempt) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          chalk.yellow(
            `403 detected for ${language}, retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`,
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.log(
          chalk.red(
            `Failed to scrape ${language} after ${attempt} attempts: ${(error as any)?.message || error}`,
          ),
        );
        return [];
      }
    }
  }
  return [];
}

/**
 * this function handles scraping GitHub trending repositories by language.
 * When lang is "", it will scrape all languages. (the default trending page)
 */
async function extractTrendingRepos(url: string): Promise<string[]> {
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

  $(".Box-row").each((_, element) => {
    const repoLink = $(element).find("h2 a[href*='/']");
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
 * using parallel processing
 */
export async function scrapeTrendingDevelopers(): Promise<TrendingDeveloper[]> {
  try {
    console.log(
      chalk.cyan("Starting parallel trending developers scraping..."),
    );

    const devUrl = (l: string) => {
      const langPath = l ? `/${l}` : "";
      return `https://github.com/trending/developers${langPath}?since=daily`;
    };

    // Process all languages in parallel
    const scrapingPromises = LANGS.map(async (lang) => {
      console.log(
        chalk.blue(
          `Fetching trending developers for language: ${lang || "all"}`,
        ),
      );
      return await extractTrendingDevelopersWithRetry(
        devUrl(lang),
        lang || "all",
      );
    });

    const results = await Promise.allSettled(scrapingPromises);

    // Collect successful results and log failures
    const allDevelopers: TrendingDeveloper[] = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const lang = LANGS[index] || "all";
      if (result.status === "fulfilled") {
        allDevelopers.push(...result.value);
        successCount++;
        console.log(
          chalk.green(
            `Successfully scraped ${result.value.length} developers for ${lang}`,
          ),
        );
      } else {
        failureCount++;
        console.log(
          chalk.red(
            `Failed to scrape developers for ${lang}: ${result.reason}`,
          ),
        );
      }
    });

    // Remove duplicates based on username
    const uniqueDevelopers = allDevelopers.filter(
      (dev, index, arr) =>
        arr.findIndex((d) => d.username === dev.username) === index,
    );

    console.log(
      chalk.cyan(
        `Developer scraping completed: ${uniqueDevelopers.length} unique developers`,
      ),
    );
    console.log(
      chalk.green(`Success rate: ${successCount}/${LANGS.length} languages`),
    );
    if (failureCount > 0) {
      console.log(chalk.red(`Failed languages: ${failureCount}`));
    }

    return uniqueDevelopers;
  } catch (error) {
    console.log(chalk.red(`Error in developers scraping: ${error}`));
    return [];
  }
}

/**
 * Extracts trending developers with retry logic for 403 errors
 */
async function extractTrendingDevelopersWithRetry(
  url: string,
  language: string,
  maxRetries: number = 3,
): Promise<TrendingDeveloper[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const developers = await extractTrendingDevelopers(url);
      if (attempt > 1) {
        console.log(
          chalk.green(
            `Retry successful for ${language} developers on attempt ${attempt}`,
          ),
        );
      }
      return developers;
    } catch (error: unknown) {
      const is403 = (error as any)?.message?.includes("403") || (error as any)?.status === 403;
      const isLastAttempt = attempt === maxRetries;

      if (is403 && !isLastAttempt) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          chalk.yellow(
            `403 detected for ${language} developers, retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`,
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.log(
          chalk.red(
            `Failed to scrape ${language} developers after ${attempt} attempts: ${(error as any)?.message || error}`,
          ),
        );
        return [];
      }
    }
  }
  return [];
}

/**
 * Extracts trending developer information from GitHub trending developers page
 */
async function extractTrendingDevelopers(
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

  $(".Box-row.d-flex").each((_, element) => {
    // Extract username from the profile link
    const usernameLink = $(element).find("p.f4 a.Link--secondary");
    const username = usernameLink.text().trim();
    // Try to find popular repository
    const repoLink = $(element).find("h1.h4 a[href*='/'][href*='/']");
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
}
