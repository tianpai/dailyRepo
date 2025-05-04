import cron from "node-cron";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { deleteCached } from "./utils/nodeCache.js";
import { prepTrendingData, saveTrendingData } from "./jobs/RepoScrapeJob.js";

dotenv.config();

const MONGO_URI = process.env.MONGO;
const CACHE_KEY = process.env.CACHE_KEY_TRENDING;

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
    // 1. Connect to DB
    await ensureMongoConnected();

    // 2. Fetch & transform data
    const repos = await prepTrendingData();
    console.log(
      `🔍 Prepared ${repos.length} repos at ${new Date().toISOString()}`,
    );

    // 3. Persist to MongoDB
    await saveTrendingData(repos);
    console.log(
      `💾 Saved ${repos.length} repos to database at ${new Date().toISOString()}`,
    );

    // 4. Invalidate cache if configured
    if (CACHE_KEY) {
      deleteCached(CACHE_KEY);
      console.log(`🔄 Cleared cache key: ${CACHE_KEY}`);
    }

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
cron.schedule("0 0 2 * * *", runScrapeJob);

// Optionally run immediately via CLI flag
if (process.argv.includes("--run-now")) {
  runScrapeJob();
}

// Catch unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
