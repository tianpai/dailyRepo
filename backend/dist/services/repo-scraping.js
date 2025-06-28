/** @fileoverview
 * scrape GitHub DOM and keep useful information
 *
 * No API calls, just DOM scraping
 */
import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
    throw new Error("GitHub token is missing!");
}
const githubTrending = {
    baseURL: "https://github.com/trending/",
    language: "",
    since: ["monthly", "daily", "weekly"],
};
// by languages
// https://github.com/trending/python?since=daily
// https://github.com/trending/c?since=daily
// https://github.com/trending/javascript?since=daily
// https://github.com/trending/typescript?since=daily
// https://github.com/trending/rust?since=daily
// https://github.com/trending/go?since=daily
// https://github.com/trending/java?since=daily
// https://github.com/trending/c++?since=daily
// by developers and their popular projects
// https://github.com/trending/developers/typescript?since=daily
// https://github.com/trending/developers/javascript?since=daily
// https://github.com/trending/developers/rust?since=daily
// https://github.com/trending/developers/go?since=daily
// https://github.com/trending/developers/python?since=daily
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
export async function getTrendingRepoNames(url = githubTrending.baseURL) {
    try {
        console.log(`Fetching trending repositories from: ${url}`);
        const $ = await cheerio.fromURL(url);
        const result_list = Array();
        $("div[data-hpc] article h2 a").each((_, el) => {
            const href = $(el).attr("href");
            result_list.push(href);
        });
        return result_list;
    }
    catch (error) {
        console.error("Error fetching repository links:", error);
        return [];
    }
}
//# sourceMappingURL=repo-scraping.js.map