import * as cheerio from "cheerio";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const githubToken = process.env.GITHUB_TOKEN;

const githubTrending = {
  baseURL: "https://github.com/trending/",
  language: "",
  since: ["monthly", "daily", "weekly"],
};

/**
 * Retrieves the repository information from a given repository.
 *
 * @param {string} repo
 *  - The link to the repository.
 * @returns {Promise<Object>}
 *  - A json object containing the repository information.
 * @example await getRepo("/vanna-ai/vanna");
 */
export async function getRepo(repo) {
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
 * Retrieves the trending repositories from GitHub.
 *
 * @param {string} url
 * - The URL to the GitHub trending page. Defaults to www.github.com/trending
 *
 * @returns {Promise<Array>}
 * - Returns a promise that resolves to an array of repository links.
 *   If reject returns an empty array.
 *
 * */
export async function getTrending(url = githubTrending.baseURL) {
  try {
    const $ = await cheerio.fromURL(url);
    const result_list = Array();

    $("div[data-hpc] article h2 a").each((_, el) => {
      const href = $(el).attr("href");
      result_list.push(href);
    });
    return result_list;
  } catch (error) {
    console.error("Error fetching repository links:", error);
    return [];
  }
}

/**
 * Retrieves the README file from a given repository.
 * @param {string} repoLink - The link to the repository.
 * */
export async function getReadme(repo) {
  const res = await axios.get(`https://api.github.com/repos${repo}/readme`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  const readme = res.data;
  return readme;
}
