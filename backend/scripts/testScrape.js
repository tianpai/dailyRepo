/**
 * One time testing script for mongodb connection and scraping
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import { prepTrendingData, saveTrendingData } from "../jobs/RepoScrapeJob.js";

dotenv.config();

async function runTestScrape() {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO);
    console.log("MongoDB connected");

    // 2. Fetch & transform
    const repos = await prepTrendingData();
    console.log(`🔍 Fetched ${repos.length} repos:`);

    repos.forEach((r, i) => {
      const stars = Object.values(r.stars)[0];
      const forks = Object.values(r.forks)[0];
      console.log(` ${i} [${r.fullName}] stars=${stars}, forks=${forks}`);
    });

    // 3. Persist
    await saveTrendingData(repos);
    console.log("💾 Data saved successfully, check MongoDB");
  } catch (err) {
    console.error("❌ Error during test scrape:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

runTestScrape();
