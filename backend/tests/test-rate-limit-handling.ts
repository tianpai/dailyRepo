import {
  getCurrentRateLimit,
  logRateLimitStatus,
  handleRateLimitExceeded,
  withRateLimitRetry,
} from "../utils/rate-limit-checker";
import { getRepoStargazersCount } from "../services/fetching-star-history";
import chalk from "chalk";

async function testRateLimitHandling() {
  console.log(chalk.bold("Testing Rate Limit Handling"));
  console.log("=".repeat(50));

  try {
    // 1. Check current rate limit status
    console.log(chalk.cyan("\n1. Checking current rate limit status..."));
    const rateLimit = await getCurrentRateLimit();

    if (rateLimit) {
      logRateLimitStatus(rateLimit);
    } else {
      console.log(chalk.red("Could not fetch rate limit"));
      return;
    }

    // 2. Test a simple API call with rate limit retry
    console.log(chalk.cyan("\n2. Testing API call with rate limit retry..."));
    const testRepo = "microsoft/vscode"; // Popular repo that should exist

    try {
      const starCount = await getRepoStargazersCount(testRepo);
      console.log(
        chalk.green(
          `Successfully fetched star count for ${testRepo}: ${starCount}`,
        ),
      );
    } catch (error) {
      console.error(chalk.red(`Failed to fetch star count: ${error.message}`));
    }

    // 3. Check rate limit after API call
    console.log(chalk.cyan("\n3. Checking rate limit after API call..."));
    const rateLimitAfter = await getCurrentRateLimit();

    if (rateLimitAfter) {
      logRateLimitStatus(rateLimitAfter);

      const callsUsed = rateLimitAfter.rate.used - rateLimit.rate.used;
      console.log(chalk.yellow(`API calls consumed: ${callsUsed}`));
    }

    console.log(chalk.green("\nRate limit handling test completed successfully"));
  } catch (error) {
    console.error(chalk.red("Test failed:"), error.message);
  }
}

// Run the test
testRateLimitHandling();