import { scrapeTrending, scrapeTrendingDevelopers } from "./repo-scraping";
import { getTodayUTC, getUTCDate } from "@utils/time";
import { Repo, StarHistory } from "@model/Repo";
import { getRepoStarRecords } from "./fetching-star-history";
import axios from "axios";
import { TrendingDeveloper } from "@model/TrendingDeveloper";
import { GithubUser } from "@/interfaces/api";
import { logRed, logGreen, logGray } from "@utils/coloredConsoleLog";
import chalk from "chalk";

// Type definitions
interface GitHubRepoData {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string;
  html_url: string;
  license?: { name: string } | null;
  created_at: string;
  updated_at: string;
  topics: string[];
  languages_url: string;
}

interface LanguageData {
  [language: string]: number;
}

interface ProcessedRepo {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  language: LanguageData;
  topics: string[];
  createdAt: string;
  lastUpdate: string;
  license: string | null;
  trendingDate: string;
}

interface ProcessedDeveloper {
  username: string;
  repositoryPath: string;
  profileUrl: string;
  trendingDate: string;
  location?: string;
  avatar_url: string;
}

interface StarHistoryResult {
  successful: number;
  failed: number;
  skipped: number;
}

interface ValidatedRepos {
  validRepoNames: string[];
  repoMap: Map<string, any>;
  skippedCount: number;
}

interface StarHistoryProcessResult {
  repoId: any;
  repoName: string;
  history: any;
}

const githubToken: string | undefined = process.env.GITHUB_TOKEN;

export default async function RepoScrapeJobRunner(): Promise<void> {
  await saveTrendingData(await prepTrendingData());
  await saveTrendingDevelopers(await prepTrendingDevelopers());
}

/**
 * Fetch the trending from GitHub, process each repo,
 * then return an array of transformed repo objects.
 */
export async function prepTrendingData(): Promise<ProcessedRepo[]> {
  // get the trending repos' fullnames from Github trending DOM
  const trendingData = await scrapeTrending();
  const trendingRepoNames = trendingData || [];
  const today = getTodayUTC();
  // Add leading slash for API calls
  const repoNamesWithSlash = trendingRepoNames.map((name) => `/${name}`);

  console.log(
    `Processing ${repoNamesWithSlash.length} trending repos sequentially...`,
    `there is a 1 second delay between each repo to avoid rate limits`,
  );

  // Process repos sequentially to avoid rate limits
  const repos: ProcessedRepo[] = [];
  for (let i = 0; i < repoNamesWithSlash.length; i++) {
    const repoName = repoNamesWithSlash[i];
    const totalNumRepo = repoNamesWithSlash.length;
    try {
      console.log(`[${i + 1}/${totalNumRepo}] ${chalk.blue(repoName)}...`);
      const repo = await processOneRepo(repoName, today);
      repos.push(repo);
    } catch (error) {
      console.error(`Error processing repo ${repoName}:`, error);
    }

    // Add delay between repos (except for the last one)
    if (i < repoNamesWithSlash.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return repos;
}

/**
 * Upsert an array of already‑prepared repo objects in one bulkWrite.
 */
export async function saveTrendingData(repos: ProcessedRepo[]): Promise<void> {
  if (!repos.length) {
    return;
  } // guard against empty ops
  const ops = repos.map((repo) => ({
    updateOne: {
      filter: { owner: repo.owner, name: repo.name },
      update: {
        $set: repo,
        $addToSet: { trendingRecord: repo.trendingDate },
      },
      upsert: true,
    },
  }));
  await Repo.bulkWrite(ops);
}

/**
 * Validate which repositories exist in the database
 */
async function validateRepositoriesInDatabase(
  repoNames: string[],
): Promise<ValidatedRepos> {
  // Find all existing repos in one query
  const existingRepos = await Repo.find({
    fullName: { $in: repoNames },
  })
    .select("_id fullName")
    .lean();

  // Create a map for quick lookup
  const repoMap = new Map(
    existingRepos.map((repo) => [repo.fullName, repo._id]),
  );

  // Filter out repos that don't exist in DB
  const validRepoNames = repoNames.filter((name) => repoMap.has(name));
  const missingRepos = repoNames.filter((name) => !repoMap.has(name));

  if (missingRepos.length > 0) {
    logRed(`⚠️  Skipping ${missingRepos.length} repos not found in database`);
    console.log("Missing repos:", missingRepos.join(", "));
  }

  return {
    validRepoNames,
    repoMap,
    skippedCount: missingRepos.length,
  };
}

/**
 * Process star history for a single repository
 */
async function processStarHistoryForRepo(
  repoName: string,
  repoId: any,
  index: number,
  total: number,
): Promise<StarHistoryProcessResult> {
  console.log(`[${index + 1}/${total}] Processing ${repoName}...`);

  const data = await getRepoStarRecords(repoName);

  logGreen(`✓ ${repoName}: ${data?.length || 0} data points fetched`);

  return {
    repoId,
    repoName,
    history: data,
  };
}

/**
 * Save star history results to database
 */
async function saveStarHistoryResults(
  results: StarHistoryProcessResult[],
): Promise<void> {
  if (results.length === 0) {
    logRed("No star history data to save");
    return;
  }

  await StarHistory.insertMany(
    results.map(({ repoId, history }) => ({
      repoId,
      history,
    })),
  );

  logGreen(`💾 Successfully saved star history for ${results.length} repos`);
}

export async function saveStarHistoryBatch(
  repoNames: string[],
): Promise<StarHistoryResult> {
  if (!repoNames || repoNames.length === 0) {
    logRed("No repos to process for star history");
    return { successful: 0, failed: 0, skipped: 0 };
  }

  console.log(`Processing star history for ${repoNames.length} repos...`);

  // Step 1: Validate repositories exist in database
  const { validRepoNames, repoMap, skippedCount } =
    await validateRepositoriesInDatabase(repoNames);

  if (validRepoNames.length === 0) {
    logRed("No valid repositories found in database");
    return { successful: 0, failed: 0, skipped: skippedCount };
  }

  // Step 2: Process star history for each repo sequentially
  const successfulResults: StarHistoryProcessResult[] = [];
  const failedCount = { count: 0 };

  for (let i = 0; i < validRepoNames.length; i++) {
    const repoName = validRepoNames[i];
    const repoId = repoMap.get(repoName);

    try {
      const result = await processStarHistoryForRepo(
        repoName,
        repoId,
        i,
        validRepoNames.length,
      );
      successfulResults.push(result);
    } catch (error) {
      logRed(`❌ Error processing ${repoName}: ${error.message}`);
      failedCount.count++;
    }

    // Add 3-second delay between repos (except for the last one)
    if (i < validRepoNames.length - 1) {
      logGray("Waiting 3 seconds before next repo...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Step 3: Save successful results to database
  if (successfulResults.length > 0) {
    await saveStarHistoryResults(successfulResults);
  }

  // Step 4: Return summary
  const summary = {
    successful: successfulResults.length,
    failed: failedCount.count,
    skipped: skippedCount,
  };
  console.log(`Star history processing complete:`, summary);
  return summary;
}

/* ===========================================================================
 * ===========================================================================
 */

/**
 * Fetch full repo metadata + languages, then transform into DB-ready form.
 * @param {string} rawName  e.g. "facebook/react"
 * @param {string} today    e.g. "2025-05-04"
 */
async function processOneRepo(
  rawName: string,
  today: string,
): Promise<ProcessedRepo> {
  const fullData = await getRepo(rawName);
  //add 2 second delay to avoid rate limits
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const langs = await fetchLanguages(fullData.languages_url);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return transformRepo(fullData, langs, today);
}

/**
 * Retrieves the repository information from a given repository.
 *
 * @param {string} repo
 *  - The link to the repository.
 * @returns {Promise<Object>}
 *  - A json object containing the repository information.
 * @example await getRepo("/vanna-ai/vanna");
 */
export async function getRepo(repo: string): Promise<GitHubRepoData | null> {
  try {
    const res = await axios.get(`https://api.github.com/repos${repo}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching repository information:", error);
    return null;
  }
}

/**
 * Make request to GitHub API for languages.
 * It handles 403 rate limit errors by waiting 2 seconds and retrying.
 */
async function fetchLanguages(url: string): Promise<LanguageData> {
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log("Rate limit hit, waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Retry the request
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      return res.data;
    }
    throw error;
  }
}

/**
 * Turn the full GitHub repo payload + languages into your DB object.
 *
 * @param {Object} rawdata           The raw repo JSON from getRepo()
 * @param {Object} languages      The object from fetchLanguages()
 * @param {string} today          A date string like "2025-05-04"
 * @returns {Object}              Cleaned-up repo document ready to save
 */
function transformRepo(
  rawdata: GitHubRepoData,
  languages: LanguageData,
  today: string,
): ProcessedRepo {
  // API  Raw data
  const {
    full_name,
    name,
    owner: { login: owner },
    description,
    html_url,
    license,
    created_at, // "2015-05-26T20:55:45Z",
    updated_at, // "2025-06-09T14:05:17Z",
    topics = [],
  } = rawdata;

  // Timestamps as Numbers
  const createdAt = getUTCDate(created_at);
  const lastUpdate = getUTCDate(updated_at);

  return {
    fullName: full_name,
    owner,
    name,
    description,
    url: html_url,
    language: languages,
    topics,
    createdAt,
    lastUpdate,
    license: license?.name || null,
    trendingDate: today,
  } satisfies ProcessedRepo;
}

/**
 * Retrieves the README file from a given repository.
 * @param {string} repo
 * */
export async function getReadme(repo: string): Promise<string> {
  const res = await axios.get(`https://api.github.com/repos${repo}/readme`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  const readme = res.data;
  return readme;
}

/**
 * Fetch GitHub user information
 */
async function getGitHubUser(username: string): Promise<GithubUser | null> {
  try {
    const res = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error);
    return null;
  }
}

/**
 * Process scraped developer data and enrich with GitHub API data
 */
export async function prepTrendingDevelopers(): Promise<ProcessedDeveloper[]> {
  const trendingDevelopers = await scrapeTrendingDevelopers();
  const today = getTodayUTC();
  // Process developers with sequential delays to respect GitHub API rate limits
  const processedDevelopers: ProcessedDeveloper[] = [];

  for (let i = 0; i < trendingDevelopers.length; i++) {
    const dev = trendingDevelopers[i];
    try {
      const userInfo = await getGitHubUser(dev.username);
      const processedDev: ProcessedDeveloper = {
        username: dev.username,
        repositoryPath: dev.repositoryPath,
        profileUrl: `https://github.com/${dev.username}`,
        trendingDate: today,
        location: userInfo?.location || undefined,
        avatar_url: userInfo?.avatar_url || "",
      };
      processedDevelopers.push(processedDev);

      console.log(`${i + 1}/${trendingDevelopers.length}:`, dev.username);
      // Add 2-second delay between API calls to stay under 5000/hour limit
      if (i < trendingDevelopers.length - 1) {
        // console.log(chalk.gray("Waiting 2 seconds before next API call..."));
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error processing developer ${dev.username}:`, error);
    }
  }

  return processedDevelopers;
}

/**
 * Save processed developer data to database
 */
export async function saveTrendingDevelopers(
  developers: ProcessedDeveloper[],
): Promise<void> {
  if (!developers.length) {
    return;
  }

  const ops = developers.map((dev) => ({
    updateOne: {
      filter: { username: dev.username },
      update: {
        $set: dev,
        $addToSet: { trendingRecord: dev.trendingDate },
      },
      upsert: true,
    },
  }));

  await TrendingDeveloper.bulkWrite(ops);
}
