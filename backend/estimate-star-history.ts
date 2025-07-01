import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";
import { estimateStarHistoryProcessing } from "./services/batched-star-history.js";
import { Repo } from "./model/Repo.js";

dotenv.config();

const MONGO_URI = process.env.MONGO;

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(chalk.green("MongoDB connected"));

    // Get current repository count from database
    const repoCount = await Repo.countDocuments();
    console.log(`Found ${repoCount} repositories in database`);

    if (repoCount === 0) {
      console.log(chalk.yellow("No repositories found. Run the scraper first to get repository data."));
      process.exit(0);
    }

    // Get sample repository names
    const sampleRepos = await Repo.find({})
      .select("fullName")
      .limit(Math.min(repoCount, 200)) // Limit to 200 for estimation
      .lean();

    const repoNames = sampleRepos.map(repo => repo.fullName);

    console.log(chalk.cyan(`\nEstimating star history processing for ${repoNames.length} repositories:`));
    console.log("=" .repeat(70));

    // Run estimation
    const estimation = estimateStarHistoryProcessing(repoNames);

    console.log(chalk.bold(`\nSummary:`));
    console.log(`   This will process ${estimation.totalRepos} repositories`);
    console.log(`   Estimated total API calls: ${estimation.estimatedApiCalls}`);
    console.log(`   Processing time: ${estimation.estimatedHours} hour(s)`);
    console.log(`   Expected completion: ${estimation.completionTime}`);

    if (estimation.totalBatches > 1) {
      console.log(chalk.yellow(`\nNote: Processing will be split into ${estimation.totalBatches} batches`));
      console.log(chalk.yellow(`   with 1-hour delays between batches to respect GitHub API limits.`));
    }

  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.yellow("\nDisconnected from MongoDB"));
  }
}

main();
