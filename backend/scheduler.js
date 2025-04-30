import cron from "node-cron";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { deleteCached } from "./utils/nodeCache.js";
import { prepTrendingData, saveData } from "./jobs/RepoScrapeJob.js";

dotenv.config();

async function runScrapeJob() {
  console.log(`Scrape job starts at ${new Date().toISOString()}`);
  try {
    await mongoose.connect(process.env.MONGO, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    console.log("MongoDB connected");

    const repo = await prepTrendingData();
    console.log(`Preparing ${repo.length}`);
    await saveData(repo);

    const cacheKey = process.env.CACHE_KEY_TRENDING;
    if (cacheKey) {
      deleteCached(cacheKey);
      console.log(`Cache key ${cacheKey} deleted`);
    } else {
      console.warn("Cache key not found in environment variables");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
    console.log(`Scrape job ends at ${new Date().toISOString()}`);
  }
}

/* syntax includes seconds */
const schedules = {
  everyDay2amUTC: "0 0 2 * * *",
  everyThreeDay2amUTC: "0 0 2 */3 * *",
};

cron.schedule(schedules.everyDay2amUTC, runScrapeJob);

/* CLI manual trigger (testing only) */
if (process.argv.includes("--run-now")) {
  runScrapeJob();
}

/*
 * handle unhandled promises rejections
 */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
