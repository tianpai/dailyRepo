import cron from "node-cron";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  prepTrendingData,
  saveTrendingData,
  saveStarHistoryBatch,
} from "./services/repo-data.js";
dotenv.config();

const MONGO_URI = process.env.MONGO;

/**
 * Ensure a MongoDB connection is established.
 */
async function ensureMongoConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
  }
}

/**
 * The main scraping job: fetch, transform, persist, and clear cache.
 */
export async function runScrapeJob() {
  const start = new Date().toISOString();
  console.log(`[${start}] => Starting scrape job`);

  try {
    await ensureMongoConnected();
    // Fetch & transform data
    const repos = await prepTrendingData();
    console.log(
      `🔍 Prepared ${repos.length} repos at ${new Date().toISOString()}`,
    );

    // Persist to MongoDB
    await saveTrendingData(repos);
    repos.forEach((r, i) => {
      console.log(` ${i} • [${r.fullName}] `);
    });
    console.log(
      `\n💾 Saved ${repos.length} repos to database at ${new Date().toISOString()}`,
    );

    // one second delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // fetch and save star history for each repo
    const repoNames = repos.map((r) => r.fullName);
    console.log(
      `⭐ Starting star history collection for ${repoNames.length} repos...`,
    );
    const starHistoryResult = await saveStarHistoryBatch(repoNames);
    console.log(
      `⭐ Star history completed: ${starHistoryResult.successful} successful, ${starHistoryResult.failed} failed, ${starHistoryResult.skipped} skipped`,
    );

    process.exitCode = 0;
  } catch (err) {
    console.error(`❌ Job error at ${new Date().toISOString()}:`, err);
    process.exitCode = 1;
  } finally {
    // 5. Clean up DB connection
    await mongoose.disconnect();
    console.log(
      `[${new Date().toISOString()}] ⏹ Scrape job completed with exit code ${process.exitCode}`,
    );
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
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
