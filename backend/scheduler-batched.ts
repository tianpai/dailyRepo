import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  prepTrendingData,
  saveTrendingData,
  prepTrendingDevelopers,
  saveTrendingDevelopers,
} from "./scraping/repo-data";
import { saveStarHistory } from "./scraping/batched-star-history";
import { logCyan, logYellow } from "./utils/coloredConsoleLog";
import { formatDuration } from "./utils/time";
import {
  connectToDatabase,
  isConnectedToDatabase,
} from "./services/db-connection";

dotenv.config();

/**
 * Ensure a database connection is established.
 */
export async function ensureDatabaseConnected() {
  if (!isConnectedToDatabase()) {
    await connectToDatabase();
    console.log("Database connected");
  }
}

/**
 * Process and save trending repositories
 */
async function processRepositories() {
  const repos = await prepTrendingData();
  console.log(`Prepared ${repos.length} repos at ${new Date().toISOString()}`);

  await saveTrendingData(repos);
  repos.forEach((r, i) => {
    console.log(` ${i + 1}. [${r.fullName}]`);
  });
  console.log(
    `\nSaved ${repos.length} repos to database at ${new Date().toISOString()}`,
  );

  return repos;
}

/**
 * Process and save trending developers
 */
async function processDevelopers() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const developers = await prepTrendingDevelopers();
  await saveTrendingDevelopers(developers);
}

/**
 * Process star history for repositories
 */
async function processStarHistory(repoNames: string[]) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await saveStarHistory(repoNames);
}

/**
 * The main scraping job with star history processing
 */
export async function runBatchedScrapeJob() {
  const jobStartTime = performance.now();
  const MAX_RUNTIME = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  const timeout = setTimeout(async () => {
    console.error("Job exceeded maximum runtime of 4 hours. Terminating...");
    if (isConnectedToDatabase()) {
      await mongoose.disconnect();
      console.log("Database connection closed due to timeout.");
    }
    process.exit(1);
  }, MAX_RUNTIME);

  try {
    await ensureDatabaseConnected();

    logYellow("\n[1/3] PROCESSING REPOSITORIES");
    const repoStartTime = performance.now();
    const repos = await processRepositories();
    logCyan(`Step 1 completed in ${formatDuration(repoStartTime)}\n`);

    logYellow("[2/3] PROCESSING DEVELOPERS");
    const devStartTime = performance.now();
    await processDevelopers();
    logCyan(`Step 2 completed in ${formatDuration(devStartTime)}\n`);

    logYellow("[3/3] PROCESSING STAR HISTORY");
    const repoNames = repos.map((r) => r.fullName);
    const starHistoryStartTime = performance.now();
    await processStarHistory(repoNames);
    logCyan(`Step 3 completed in ${formatDuration(starHistoryStartTime)}\n`);

    process.exitCode = 0;
  } catch (err) {
    console.log("\n" + "!".repeat(60));
    console.error(`[ERROR] Job failed at ${new Date().toISOString()}`);
    console.error(err);
    console.log("!".repeat(60));
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    const totalDuration = formatDuration(jobStartTime);
    const status = process.exitCode === 0 ? "SUCCESS" : "FAILED";

    console.log("\n" + "=".repeat(60));
    console.log(`[${new Date().toISOString()}] JOB COMPLETED`);
    console.log(`Total Duration: ${totalDuration}`);
    console.log(`Status: ${status}`);
    console.log("=".repeat(60) + "\n");
  }
}

if (process.argv.includes("--run-batched")) {
  runBatchedScrapeJob().finally(() => {
    process.exit(0);
  });
} else {
  console.log("no flag");
}

// Catch unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
