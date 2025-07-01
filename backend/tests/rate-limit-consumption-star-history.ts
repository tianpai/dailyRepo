import axios from "axios";
import { Repo } from "../model/Repo";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { getRepoStarRecords } from "../services/fetching-star-history";
import chalk from "chalk";
dotenv.config();

const testRepo = "ourongxing/newsnow";

export async function calculateRateLimitConsumption() {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log(chalk.green("MongoDB connected"));
    })
    .catch((error) => {
      console.error(chalk.red("MongoDB connection error:"), error);
      process.exit(1);
    });
  console.log(chalk.bold("=== BEFORE fetching stars ==="));
  const beforeRateLimit = await getRateLimit();

  const data = await fetchStars(testRepo);
  console.log(data);

  console.log(chalk.bold("=== AFTER fetching stars ==="));
  const afterRateLimit = await getRateLimit();

  console.log(chalk.bold("=== RATE LIMIT COMPARISON ==="));
  compareRateLimits(beforeRateLimit, afterRateLimit);

  // Close MongoDB connection to terminate script
  await mongoose.connection.close();
  console.log(chalk.yellow("MongoDB connection closed"));
}

function compareRateLimits(before, after) {
  if (!before || !after) {
    console.log(chalk.red("Cannot compare - missing rate limit data"));
    return;
  }

  console.log(chalk.bold("Rate Limit Changes:"));
  console.log("==================");

  // Compare each resource type
  Object.keys(before.resources).forEach((resourceType) => {
    const beforeResource = before.resources[resourceType];
    const afterResource = after.resources[resourceType];

    const usedDifference = afterResource.used - beforeResource.used;
    const remainingDifference =
      afterResource.remaining - beforeResource.remaining;

    if (usedDifference > 0 || remainingDifference !== 0) {
      console.log(chalk.cyan(`\n${resourceType.toUpperCase()}:`));
      console.log(
        `  Used: ${beforeResource.used} → ${afterResource.used} (+${usedDifference})`,
      );
      console.log(
        `  Remaining: ${beforeResource.remaining} → ${afterResource.remaining} (${remainingDifference})`,
      );
      console.log(`  Limit: ${afterResource.limit}`);
    }
  });

  // Summary
  const totalUsed = after.rate.used - before.rate.used;
  console.log(
    chalk.yellow(
      `\nSUMMARY: ${totalUsed} API calls consumed during star history fetch`,
    ),
  );
}

export async function getRateLimitData() {
  try {
    const response = await axios.get("https://api.github.com/rate_limit", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch GitHub rate limit: ${error.message}`);
  }
}

export function displayRateLimit(rateLimitData) {
  if (!rateLimitData) {
    console.log(chalk.yellow("No rate limit data available"));
    return;
  }

  console.log(chalk.bold("GitHub API Rate Limit Status:"));
  console.log("=============================");
  console.log(
    `Core API: ${rateLimitData.rate.used}/${rateLimitData.rate.limit}`,
  );
  console.log(
    `Reset time: ${new Date(rateLimitData.rate.reset * 1000).toISOString()}`,
  );

  if (rateLimitData.resources.search) {
    console.log(
      `Search API: ${rateLimitData.resources.search.used}/${rateLimitData.resources.search.limit}`,
    );
  }
}

export async function getRateLimit() {
  try {
    const rateLimitData = await getRateLimitData();
    displayRateLimit(rateLimitData);
    return rateLimitData;
  } catch (error) {
    console.error(chalk.red("Error fetching GitHub rate limit:"), error.message);
    return null;
  }
}

async function fetchStars(repoName) {
  const repoDoc = await Repo.findOne({ fullName: repoName })
    .select("_id")
    .lean();
  if (!repoDoc) {
    console.error(chalk.red("Repo not found"));
    return null;
  }

  const data = await getRepoStarRecords(repoName);
  console.log("Star history data fetched:", data?.length || 0, "records");

  return data;
}