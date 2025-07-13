import { processBatches, calculateBatchSizes } from "./batch-processor";
import chalk from "chalk";
import { getRepoStarRecords } from "../fetching-star-history";
import { Repo, StarHistory } from "../../model/Repo";

// Type definitions to match repo-data.ts
interface StarHistoryProcessResult {
  repoId: any;
  repoName: string;
  history: any[];
}

interface StarHistoryResult {
  successful: number;
  failed: number;
  skipped: number;
}

interface ValidatedRepos {
  validRepoNames: string[];
  repoMap: Map<string, any>;
  skippedCount: number;
}

/**
 * Validate which repositories exist in the database
 */
async function validateRepositoriesInDatabase(
  repoNames: string[],
): Promise<ValidatedRepos> {
  // Find all existing repos in one query
  const existingRepos = await Repo.find({
    fullName: { $in: repoNames },
  })
    .select("_id fullName")
    .lean();

  // Create a map for quick lookup
  const repoMap = new Map<string, any>();
  const validRepoNames: string[] = [];

  existingRepos.forEach((repo) => {
    repoMap.set(repo.fullName, repo._id);
    validRepoNames.push(repo.fullName);
  });

  const skippedCount = repoNames.length - validRepoNames.length;

  console.log(
    chalk.cyan(
      `Repository validation: ${validRepoNames.length} valid, ${skippedCount} skipped`,
    ),
  );

  return {
    validRepoNames,
    repoMap,
    skippedCount,
  };
}

/**
 * Process star history for a single repository
 */
async function processStarHistoryForRepo(
  repoName: string,
  repoId: any,
  index: number,
  total: number,
): Promise<StarHistoryProcessResult> {
  console.log(`[${index + 1}/${total}] Processing ${repoName}...`);

  const data = await getRepoStarRecords(repoName);

  console.log(
    chalk.green(`${repoName}: ${data?.length || 0} data points fetched`),
  );

  return {
    repoId,
    repoName,
    history: data,
  };
}

/**
 * Save star history results to database
 */
async function saveStarHistoryResults(
  results: StarHistoryProcessResult[],
): Promise<void> {
  if (results.length === 0) {
    console.log(chalk.red("No star history data to save"));
    return;
  }

  await StarHistory.insertMany(
    results.map(({ repoId, history }) => ({
      repoId,
      history,
    })),
  );

  console.log(
    chalk.green(`Successfully saved star history for ${results.length} repos`),
  );
}

/**
 * Configuration for star history batching
 */
const STAR_HISTORY_CONFIG = {
  maxApiCallsPerHour: 4000, // Conservative GitHub API limit (leave room for other operations)
  estimatedCallsPerRepo: 40, // More realistic estimate (actual can be up to 60)
  maxRetries: 3,
  minRemainingCalls: 100, // Wait for reset if fewer than 100 calls remain
};

/**
 * Process a batch of repositories for star history
 */
async function processStarHistoryBatch(
  repoNames: string[],
  batchIndex: number,
  totalBatches: number,
): Promise<StarHistoryProcessResult[]> {
  console.log(
    chalk.cyan(`\nProcessing star history batch ${batchIndex}/${totalBatches}`),
  );
  console.log(chalk.cyan(`   Repositories in this batch: ${repoNames.length}`));

  // Validate repositories exist in database
  const { validRepoNames, repoMap, skippedCount } =
    await validateRepositoriesInDatabase(repoNames);

  if (validRepoNames.length === 0) {
    console.log(
      chalk.red(`No valid repositories found in batch ${batchIndex}`),
    );
    return [];
  }

  if (skippedCount > 0) {
    console.log(
      chalk.yellow(
        `Skipped ${skippedCount} repositories (not found in database)`,
      ),
    );
  }

  const successfulResults: StarHistoryProcessResult[] = [];

  // Process each repo in the batch with 3-second delays
  for (let i = 0; i < validRepoNames.length; i++) {
    const repoName = validRepoNames[i];
    const repoId = repoMap.get(repoName);

    try {
      console.log(
        chalk.cyan(
          `  Processing ${i + 1}/${validRepoNames.length}: ${repoName}`,
        ),
      );

      const result = await processStarHistoryForRepo(
        repoName,
        repoId,
        i,
        validRepoNames.length,
      );

      successfulResults.push(result);
      console.log(chalk.green(`  Completed ${repoName}`));
    } catch (error) {
      console.log(chalk.red(`  Failed ${repoName}: ${error.message}`));
      // Continue processing other repos in the batch
    }

    // Add delay between repos (except for the last one)
    if (i < validRepoNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log(
    chalk.green(
      `Batch ${batchIndex} completed: ${successfulResults.length}/${validRepoNames.length} successful`,
    ),
  );
  return successfulResults;
}

/**
 * Batched version of saveStarHistoryBatch that respects rate limits
 */
export async function saveStarHistoryBatched(
  repoNames: string[],
): Promise<StarHistoryResult & { batchInfo: any }> {
  if (!repoNames || repoNames.length === 0) {
    console.log(chalk.red("No repos to process for star history"));
    return {
      successful: 0,
      failed: 0,
      skipped: 0,
      batchInfo: { totalBatches: 0, estimatedHours: 0 },
    };
  }

  console.log(
    chalk.cyan(
      `\nStarting batched star history processing for ${repoNames.length} repositories`,
    ),
  );

  // Calculate and show batch information
  const batchCalc = calculateBatchSizes(repoNames.length, STAR_HISTORY_CONFIG);
  console.log(chalk.cyan(`   Repositories per batch: ${batchCalc.batchSize}`));
  console.log(chalk.cyan(`   Total batches: ${batchCalc.totalBatches}`));
  console.log(
    chalk.cyan(
      `   Estimated processing time: ${batchCalc.estimatedHours} hour(s)`,
    ),
  );

  // Process in batches
  const batchResult = await processBatches(
    repoNames,
    processStarHistoryBatch,
    STAR_HISTORY_CONFIG,
  );

  // Flatten all successful results
  const allSuccessfulResults = batchResult.processed.flat();

  // Save all successful results to database
  if (allSuccessfulResults.length > 0) {
    console.log(
      chalk.cyan(
        `Saving ${allSuccessfulResults.length} star history results to database...`,
      ),
    );
    await saveStarHistoryResults(allSuccessfulResults);
    console.log(
      chalk.green(
        `Successfully saved star history for ${allSuccessfulResults.length} repositories`,
      ),
    );
  }

  const result = {
    successful: allSuccessfulResults.length,
    failed: batchResult.failed.length,
    skipped:
      repoNames.length -
      allSuccessfulResults.length -
      batchResult.failed.length,
    batchInfo: {
      totalBatches: batchCalc.totalBatches,
      estimatedHours: batchCalc.estimatedHours,
    },
  };

  console.log(chalk.cyan(`\nFinal Results:`));
  console.log(chalk.green(`   Successful: ${result.successful}`));
  console.log(chalk.red(`   Failed: ${result.failed}`));
  console.log(chalk.yellow(`   Skipped: ${result.skipped}`));
  console.log(chalk.cyan(`   Total batches: ${result.batchInfo.totalBatches}`));
  console.log(
    chalk.cyan(
      `   Processing time: ${result.batchInfo.estimatedHours} hour(s)`,
    ),
  );

  return result;
}

/**
 * Dry run function to estimate processing without actually doing it
 */
export function estimateStarHistoryProcessing(repoNames: string[]) {
  if (!repoNames || repoNames.length === 0) {
    return { message: "No repositories to process" };
  }

  const batchCalc = calculateBatchSizes(repoNames.length, STAR_HISTORY_CONFIG);

  const now = new Date();
  const completionTime = new Date(
    now.getTime() + batchCalc.estimatedHours * 3600000,
  );

  console.log(chalk.cyan(`\nStar History Processing Estimate:`));
  console.log(chalk.cyan(`   Total repositories: ${repoNames.length}`));
  console.log(chalk.cyan(`   Repositories per batch: ${batchCalc.batchSize}`));
  console.log(chalk.cyan(`   Total batches: ${batchCalc.totalBatches}`));
  console.log(
    chalk.cyan(
      `   Estimated API calls per repo: ${STAR_HISTORY_CONFIG.estimatedCallsPerRepo}`,
    ),
  );
  console.log(
    chalk.cyan(
      `   Total estimated API calls: ${repoNames.length * STAR_HISTORY_CONFIG.estimatedCallsPerRepo}`,
    ),
  );
  console.log(
    chalk.cyan(
      `   Processing will complete around: ${completionTime.toISOString()}`,
    ),
  );

  // Show batch schedule
  console.log(chalk.cyan(`\nBatch Schedule:`));
  batchCalc.itemsPerBatch.forEach((size, index) => {
    console.log(
      chalk.cyan(
        `   Batch ${index + 1}: ${size} repos (dynamic scheduling based on rate limit)`,
      ),
    );
  });

  return {
    totalRepos: repoNames.length,
    totalBatches: batchCalc.totalBatches,
    estimatedHours: batchCalc.estimatedHours,
    estimatedApiCalls:
      repoNames.length * STAR_HISTORY_CONFIG.estimatedCallsPerRepo,
    completionTime: completionTime.toISOString(),
    batchSchedule: batchCalc.itemsPerBatch.map((size, index) => ({
      batch: index + 1,
      repos: size,
      scheduledTime: "Dynamic scheduling based on rate limit",
    })),
  };
}
