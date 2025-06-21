import { getRepo, getTrendingRepoNames } from "../services/RepoScraping.js";
import { getTodayUTC, getUTCDate, calculateAgeInDays } from "../utils/time.js";
import { Repo } from "../models/Repo.js";

export default async function RepoScrapeJobRunner() {
  await saveTrendingData(await prepTrendingData());
}

/**
 * Fetch the trending from GitHub, process each repo,
 * then return an array of transformed repo objects.
 */
export async function prepTrendingData() {
  const trendingRepoNames = await getTrendingRepoNames();
  const today = getTodayUTC();

  const results = await Promise.allSettled(
    trendingRepoNames.map((repoName) => processOneRepo(repoName, today)),
  );

  const repos = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("Error processing repo:", r.reason);
    }
  });

  return repos;
}

/**
 * Upsert an array of already‑prepared repo objects in one bulkWrite.
 */
export async function saveTrendingData(repos) {
  if (!repos.length) return; // guard against empty ops

  const ops = repos.map((repo) => ({
    updateOne: {
      filter: { owner: repo.owner, name: repo.name },
      update: { $set: repo },
      upsert: true,
    },
  }));

  await Repo.bulkWrite(ops);
}

/* ===========================================================================
 * ===========================================================================
 */

/**
 * Fetch full repo metadata + languages, then transform into DB-ready form.
 * @param {string} rawName  e.g. "facebook/react"
 * @param {string} today    e.g. "2025-05-04"
 */
async function processOneRepo(rawName, today) {
  const fullData = await getRepo(rawName);
  const langs = await fetchLanguages(fullData.languages_url);
  return transformRepo(fullData, langs, today);
}

/**
 * Make request to GitHub API for languages.
 */
async function fetchLanguages(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `fetchLanguages(${url}) failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

/**
 * Turn the full GitHub repo payload + languages into your DB object.
 *
 * @param {Object} data           The raw repo JSON from getRepo()
 * @param {Object} languages      The object from fetchLanguages()
 * @param {string} today          A date string like "2025-05-04"
 * @returns {Object}              Cleaned-up repo document ready to save
 */
function transformRepo(rawdata, languages, today) {
  // API Raw data
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
  const age = calculateAgeInDays(createdAt, lastUpdate);

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
    age,
    license: license?.name || null,
    trendingDate: today,
  };
}
