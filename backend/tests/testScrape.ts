/**
 * One time testing script for mongodb connection and scraping
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";

import { prepTrendingData, saveTrendingData } from "../scraping/repo-data";

dotenv.config();

async function runTestScrape() {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO);
    console.log(chalk.green("MongoDB connected"));

    // 2. Fetch & transform
    const repos = await prepTrendingData();
    console.log(chalk.cyan(`Fetched ${repos.length} repos:`));

    repos.forEach((r, i) => {
      console.log(` ${i} [${r.fullName}]`);
    });

    // 3. Persist
    await saveTrendingData(repos);
    console.log(chalk.green("Data saved successfully, check MongoDB"));
  } catch (err) {
    console.error(chalk.red("Error during test scrape:"), err);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.yellow("MongoDB connection closed"));
  }
}

runTestScrape();
