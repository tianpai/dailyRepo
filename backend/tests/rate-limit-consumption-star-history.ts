import axios from "axios";
import { Repo } from "../model/Repo.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { getRepoStarRecords } from "../services/fetching-star-history.js";
dotenv.config();

const testRepo = "ourongxing/newsnow";

async function calculateRateLimitConsumption() {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
  console.log("=== BEFORE fetching stars ===");
  const beforeRateLimit = await getRateLimit();

  const data = await fetchStars(testRepo);
  console.log(data);

  console.log("=== AFTER fetching stars ===");
  const afterRateLimit = await getRateLimit();

  console.log("=== RATE LIMIT COMPARISON ===");
  compareRateLimits(beforeRateLimit, afterRateLimit);

  // Close MongoDB connection to terminate script
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
}

function compareRateLimits(before, after) {
  if (!before || !after) {
    console.log("Cannot compare - missing rate limit data");
    return;
  }

  console.log("Rate Limit Changes:");
  console.log("==================");

  // Compare each resource type
  Object.keys(before.resources).forEach((resourceType) => {
    const beforeResource = before.resources[resourceType];
    const afterResource = after.resources[resourceType];

    const usedDifference = afterResource.used - beforeResource.used;
    const remainingDifference =
      afterResource.remaining - beforeResource.remaining;

    if (usedDifference > 0 || remainingDifference !== 0) {
      console.log(`\n${resourceType.toUpperCase()}:`);
      console.log(
        `  Used: ${beforeResource.used} → ${afterResource.used} (+${usedDifference})`,
      );
      console.log(
        `  Remaining: ${beforeResource.remaining} → ${afterResource.remaining} (${remainingDifference})`,
      );
      console.log(`  Limit: ${afterResource.limit}`);
    }
  });

  // Summary
  const totalUsed = after.rate.used - before.rate.used;
  console.log(
    `\nSUMMARY: ${totalUsed} API calls consumed during star history fetch`,
  );
}

async function getRateLimit() {
  try {
    const response = await axios({
      method: "get",
      url: "https://api.github.com/rate_limit",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });

    // Print the entire rate limit response
    console.log(
      "Full Rate Limit Data:",
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching rate limit:", error);
    return null;
  }
}

async function fetchStars(repoName) {
  const repoDoc = await Repo.findOne({ fullName: repoName })
    .select("_id")
    .lean();
  if (!repoDoc) {
    console.error("Repo not found");
    return null;
  }

  const data = await getRepoStarRecords(repoName);
  console.log("Star history data fetched:", data?.length || 0, "records");

  return data;
}

await calculateRateLimitConsumption();
