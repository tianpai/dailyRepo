import cron from "node-cron";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { deleteCached } from "./utils/nodeCache.js";
import { prepTrendingData, saveData } from "./jobs/RepoScrapeJob.js";

dotenv.config();

/* ------------------------------------------------------------------ */
/* DB helpers                                                         */
/* ------------------------------------------------------------------ */
async function ensureMongoConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("MongoDB connected");
  }
}

/* ------------------------------------------------------------------ */
/* Job                                                                */
/* ------------------------------------------------------------------ */
export async function runScrapeJob() {
  console.log(`[${new Date().toISOString()}] ▶ Scrape job starts`);
  try {
    await ensureMongoConnected();

    const repos = await prepTrendingData();
    console.log(`Preparing ${repos.length} repos…`);
    await saveData(repos);

    const cacheKey = process.env.CACHE_KEY_TRENDING;
    if (cacheKey) {
      deleteCached(cacheKey);
      console.log(`Cache key ${cacheKey} deleted`);
    }
    process.exitCode = 0; // let platforms mark success
  } catch (err) {
    console.error("❌ Job error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect(); // always close the socket
    console.log(
      `[${new Date().toISOString()}] ⏹ Scrape job ends (exit ${process.exitCode})`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Local cron trigger (Node‑Cron keeps the process running)           */
/* ------------------------------------------------------------------ */
const schedules = {
  everyDay2amUTC: "0 0 2 * * *",
  everyThreeDay2amUTC: "0 0 2 */3 * *",
};

cron.schedule(schedules.everyDay2amUTC, runScrapeJob);

/* Manual CLI trigger: `node scheduler.js --run-now` */
if (process.argv.includes("--run-now")) {
  runScrapeJob();
}

/* Guard for unhandled promise rejections */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
