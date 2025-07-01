import cron from "node-cron";
import dotenv from "dotenv";
import {
  prepTrendingData,
  saveTrendingData,
  prepTrendingDevelopers,
  saveTrendingDevelopers,
  saveStarHistoryBatch,
} from "./services/repo-data";
import { logCyan } from "./utils/coloredConsoleLog";
import { DatabaseConnection } from "./services/db-connection";
dotenv.config();

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param startTime - The start time from performance.now()
 * @returns The formatted duration string.
 */
function formatDuration(startTime: number): string {
  const endTime = performance.now();
  const duration = endTime - startTime;
  const seconds = duration / 1000;
  if (seconds > 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute(s) ${remainingSeconds.toFixed(2)} seconds`;
  }
  return `${seconds.toFixed(2)} seconds`;
}

/**
 * Ensure a database connection is established.
 */
async function ensureDatabaseConnected() {
  if (!DatabaseConnection.getConnectionStatus()) {
    await DatabaseConnection.connect();
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
  console.log("Waiting 3 seconds before collecting developer data...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const developers = await prepTrendingDevelopers();
  console.log(
    `Prepared ${developers.length} developers at ${new Date().toISOString()}`,
  );

  await saveTrendingDevelopers(developers);
  developers.forEach((d, i) => {
    console.log(
      ` ${i + 1}. [${d.username}] ${d.repositoryPath} ${d.location || "No location"}`,
    );
  });
  console.log(
    `\nSaved ${developers.length} developers to database at ${new Date().toISOString()}`,
  );
}

/**
 * Process star history for repositories
 */
async function processStarHistory(repoNames: string[]) {
  console.log("Waiting 3 seconds before star history collection...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(
    `Starting star history collection for ${repoNames.length} repos...`,
  );
  const starHistoryResult = await saveStarHistoryBatch(repoNames);
  logCyan(
    `${starHistoryResult.successful} successful, ${starHistoryResult.failed} failed, ${starHistoryResult.skipped} skipped`,
  );
}

/**
 * The main scraping job: orchestrates all data collection processes
 */
export async function runScrapeJob() {
  const jobStartTime = performance.now();
  const timestamp = new Date().toISOString();

  console.log("\n" + "=".repeat(60));
  console.log(`[${timestamp}] GITHUB SCRAPING JOB STARTED`);
  console.log("=".repeat(60));

  try {
    await ensureDatabaseConnected();

    // Step 1: Process repositories
    console.log("\n[1/3] PROCESSING REPOSITORIES");
    console.log("-".repeat(40));
    const repoStartTime = performance.now();
    const repos = await processRepositories();
    logCyan(`Step 1 completed in ${formatDuration(repoStartTime)}\n`);

    // Step 2: Process developers
    console.log("[2/3] PROCESSING DEVELOPERS");
    console.log("-".repeat(40));
    const devStartTime = performance.now();
    await processDevelopers();
    logCyan(`Step 2 completed in ${formatDuration(devStartTime)}\n`);

    // Step 3: Process star history
    console.log("[3/3] PROCESSING STAR HISTORY");
    console.log("-".repeat(40));
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
    await DatabaseConnection.disconnect();

    const totalDuration = formatDuration(jobStartTime);
    const status = process.exitCode === 0 ? "SUCCESS" : "FAILED";

    console.log("\n" + "=".repeat(60));
    console.log(`[${new Date().toISOString()}] JOB COMPLETED`);
    console.log(`Total Duration: ${totalDuration}`);
    console.log(`Status: ${status}`);
    console.log(`Exit Code: ${process.exitCode}`);
    console.log("=".repeat(60) + "\n");
  }
}

// Schedule the job to run daily at 02:00 UTC
const task = cron.schedule("0 0 2 * * *", runScrapeJob);

// Optionally run immediately via CLI flag
if (process.argv.includes("--run-now")) {
  runScrapeJob().finally(() => {
    task.stop();
    console.log("Scheduler stopped.");
    process.exit(0);
  });
}

// Catch unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  try {
    await DatabaseConnection.disconnect();
  } catch {}
  process.exit(1);
});
