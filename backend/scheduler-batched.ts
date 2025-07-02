import chalk from "chalk";
import dotenv from "dotenv";
import {
  prepTrendingData,
  saveTrendingData,
  prepTrendingDevelopers,
  saveTrendingDevelopers,
} from "./services/repo-data";
import {
  saveStarHistoryBatched,
  estimateStarHistoryProcessing,
} from "./services/batched-star-history";
import { logCyan, logGreen, logYellow } from "./utils/coloredConsoleLog";
import { getRateLimit } from "./tests/rate-limit-consumption-star-history";
import { formatDuration } from "./utils/time";
import { runScrapeJob } from "./scheduler";
import { scrapeTrending } from "./services/repo-scraping";
import { DatabaseConnection } from "./services/db-connection";

dotenv.config();
const LOG = console.log;

/**
 * Ensure a database connection is established.
 */
export async function ensureDatabaseConnected() {
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
 * Process star history for repositories using batched approach
 */
async function processStarHistoryBatched(repoNames: string[]) {
  console.log("Waiting 3 seconds before star history collection...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // First, show the estimation
  logCyan("\n📊 Estimating star history processing requirements...");
  estimateStarHistoryProcessing(repoNames);

  // Ask for confirmation in production (or proceed automatically)
  console.log(
    chalk.yellow(
      "\nIMPORTANT: This will process repositories in batches over multiple hours",
    ),
  );
  LOG(
    chalk.yellow(
      "to respect GitHub API rate limits. Each batch will be processed with",
    ),
  );
  LOG(
    chalk.yellow(
      "a 1-hour delay between batches to stay under the 5000 requests/hour limit.",
    ),
  );

  // Start the batched processing
  LOG(
    `\nStarting batched star history collection for ${repoNames.length} repos...`,
  );
  const starHistoryResult = await saveStarHistoryBatched(repoNames);

  LOG(chalk.green("Batched processing completed:"));
  LOG(
    chalk.green(`successful ${starHistoryResult.successful}\n`),
    chalk.bgRed(`failed     ${starHistoryResult.failed} \n`),
    chalk.bgGray(`skipped    ${starHistoryResult.skipped}`),
    `Total batches ${starHistoryResult.batchInfo.totalBatches}`,
  );

  return starHistoryResult;
}

/**
 * The main scraping job with batched star history processing
 */
export async function runBatchedScrapeJob() {
  const jobStartTime = performance.now();
  const timestamp = new Date().toISOString();

  console.log("\n" + "=".repeat(60));
  console.log(`[${timestamp}] BATCHED GITHUB SCRAPING JOB STARTED`);
  console.log("=".repeat(60));

  try {
    await ensureDatabaseConnected();
    /*
     * step 1 and 2 comsume very minimal rate limits
     * around 2-4 API calss per repo
     */

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

    // Step 3: Process star history with batching
    console.log("[3/3] PROCESSING STAR HISTORY (BATCHED)");
    console.log("-".repeat(40));
    const repoNames = repos.map((r) => r.fullName);
    const starHistoryStartTime = performance.now();
    const starHistoryResult = await processStarHistoryBatched(repoNames);
    logCyan(`Step 3 initiated in ${formatDuration(starHistoryStartTime)}\n`);

    logGreen(`Job completed successfully!`);
    logGreen(
      `Note: Star history processing will continue in batches over ${starHistoryResult.batchInfo.estimatedHours} hour(s)`,
    );

    process.exitCode = 0;
  } catch (err) {
    console.log("\n" + "!".repeat(60));
    console.error(`[ERROR] Job failed at ${new Date().toISOString()}`);
    console.error(err);
    console.log("!".repeat(60));
    process.exitCode = 1;
  } finally {
    // Note: Don't disconnect database if batched processing is still ongoing
    if (process.exitCode !== 0) {
      await DatabaseConnection.disconnect();
    }

    const totalDuration = formatDuration(jobStartTime);
    const status = process.exitCode === 0 ? "SUCCESS" : "FAILED";

    console.log("\n" + "=".repeat(60));
    console.log(`[${new Date().toISOString()}] JOB PHASE 1 COMPLETED`);
    console.log(`Total Duration: ${totalDuration}`);
    console.log(`Status: ${status}`);
    console.log(`Exit Code: ${process.exitCode}`);
    if (process.exitCode === 0) {
      logYellow("Note: Star history batching will continue in the background");
    }
    console.log("=".repeat(60) + "\n");
  }
}

/**
 * Estimation-only function to see what the processing would look like
 */
export async function estimateBatchedJob() {
  console.log("\n" + "=".repeat(60));
  console.log("BATCHED SCRAPING JOB ESTIMATION");
  console.log("=".repeat(60));

  try {
    // Get repository list
    const repos = await scrapeTrending();
    console.log(repos);
    console.log(`\n📊 Found ${repos.length} repositories to process`);

    // Show estimation
    estimateStarHistoryProcessing(repos);

    console.log(
      "\n✅ Estimation complete. Use --run-batched to start actual processing.",
    );
  } catch (err) {
    console.error("Error during estimation:", err);
  } finally {
    await getRateLimit();
  }
}

// CLI handling
if (process.argv.includes("--estimate")) {
  estimateBatchedJob().finally(() => {
    console.log("Estimation completed.");
    process.exit(0);
  });
} else if (process.argv.includes("--run-batched")) {
  runBatchedScrapeJob().finally(() => {
    console.log("Batched scraping job initiated.");
    process.exit(0);
  });
} else if (process.argv.includes("--run-now")) {
  runScrapeJob().finally(() => {
    console.log("Original scraping job completed.");
    process.exit(0);
  });
} else {
  // Default: show help
  console.log("\nBatched GitHub Scraper");
  console.log("=====================");
  console.log("Options:");
  console.log("  --estimate      Show processing estimation without running");
  console.log("  --run-batched   Run the batched scraping job");
  console.log(
    "  --run-now       Run the original scraping job (may hit rate limits)",
  );
  console.log("");
  console.log("Example usage:");
  console.log("  bun run dev:scraper --estimate");
  console.log("  bun run dev:scraper --run-batched");
  process.exit(0);
}

// Catch unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  try {
    await DatabaseConnection.disconnect();
  } catch {}
  process.exit(1);
});
