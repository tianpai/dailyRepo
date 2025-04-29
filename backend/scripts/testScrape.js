/**
 * One time testing script for mongodb connection and scraping
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import { prepTrendingData, saveData } from "../jobs/RepoScrapeJob.js";

dotenv.config();

async function runTestScrape() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("MongoDB connected");

    const repo = await prepTrendingData();
    console.log(repo);
    await saveData(repo);

    console.log("Data saved successfully, check mongodb");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

runTestScrape();
