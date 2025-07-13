import chalk from "chalk";
import {
  getCurrentRateLimit,
  getTimeUntilReset,
  formatDuration,
  logRateLimitStatus,
} from "../../utils/rate-limit-checker";
import { logGreen } from "../../utils/coloredConsoleLog";

/**
 * Configuration for rate limiting and batching
 */
interface BatchConfig {
  maxApiCallsPerHour: number;
  estimatedCallsPerRepo: number; // Conservative estimate for star history
  maxRetries: number;
  minRemainingCalls: number; // Minimum calls needed before waiting for reset
}

interface BatchResult<T> {
  processed: T[];
  failed: string[];
  totalBatches: number;
  estimatedHours: number;
}

/**
 * Default configuration for GitHub API rate limiting
 */
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxApiCallsPerHour: 4000, // Conservative limit (GitHub allows 5000, leave room for other ops)
  estimatedCallsPerRepo: 40, // Realistic estimate (can be up to 60)
  maxRetries: 3,
  minRemainingCalls: 100, // Wait for reset if fewer than 100 calls remain
};

/**
 * Calculates optimal batch sizes based on rate limits
 */
export function calculateBatchSizes(
  totalItems: number,
  config: BatchConfig = DEFAULT_BATCH_CONFIG,
): {
  batchSize: number;
  totalBatches: number;
  estimatedHours: number;
  itemsPerBatch: number[];
} {
  const { maxApiCallsPerHour, estimatedCallsPerRepo } = config;

  // Calculate how many repos we can process per hour
  const reposPerHour = Math.floor(maxApiCallsPerHour / estimatedCallsPerRepo);

  // Calculate total batches needed
  const totalBatches = Math.ceil(totalItems / reposPerHour);

  // Calculate items per batch (last batch may be smaller)
  const itemsPerBatch: number[] = [];
  for (let i = 0; i < totalBatches; i++) {
    const remainingItems = totalItems - i * reposPerHour;
    const batchSize = Math.min(reposPerHour, remainingItems);
    itemsPerBatch.push(batchSize);
  }

  console.log(chalk.cyan(`Batch Calculation:`));
  console.log(chalk.cyan(`  Total items: ${totalItems}`));
  console.log(
    chalk.cyan(`  Estimated API calls per item: ${estimatedCallsPerRepo}`),
  );
  console.log(chalk.cyan(`  Max API calls per hour: ${maxApiCallsPerHour}`));
  console.log(chalk.cyan(`  Items per hour: ${reposPerHour}`));
  console.log(chalk.cyan(`  Total batches needed: ${totalBatches}`));
  console.log(
    chalk.cyan(
      `  Note: Processing will continue dynamically based on rate limit status`,
    ),
  );

  return {
    batchSize: reposPerHour,
    totalBatches,
    estimatedHours: totalBatches,
    itemsPerBatch,
  };
}

/**
 * Splits an array into batches based on calculated sizes
 */
export function createBatches<T>(items: T[], itemsPerBatch: number[]): T[][] {
  const batches: T[][] = [];
  let currentIndex = 0;

  for (const batchSize of itemsPerBatch) {
    const batch = items.slice(currentIndex, currentIndex + batchSize);
    batches.push(batch);
    currentIndex += batchSize;
  }

  return batches;
}

/**
 * Checks rate limit status and waits if necessary before processing next batch
 */
async function checkRateLimitBeforeNextBatch(
  config: BatchConfig,
): Promise<void> {
  console.log(
    chalk.cyan(`
Checking GitHub API rate limit before next batch...`),
  );

  const rateLimit = await getCurrentRateLimit();

  if (!rateLimit) {
    console.log(
      chalk.yellow(`Could not fetch rate limit, continuing with caution...`),
    );
    return;
  }

  logRateLimitStatus(rateLimit);

  const { rate } = rateLimit;
  const estimatedCallsForNextBatch =
    config.estimatedCallsPerRepo *
    Math.floor(config.maxApiCallsPerHour / config.estimatedCallsPerRepo);

  // Check if we have enough calls remaining for the next batch
  if (
    rate.remaining <
    Math.max(config.minRemainingCalls, estimatedCallsForNextBatch)
  ) {
    const waitTime = getTimeUntilReset(rateLimit);
    console.log(
      chalk.yellow(
        `Insufficient rate limit remaining (${rate.remaining}). Waiting ${formatDuration(waitTime)} for reset...`,
      ),
    );

    // Add a small buffer to ensure reset has occurred
    await new Promise((resolve) => setTimeout(resolve, waitTime + 10000));
    console.log(chalk.green("Rate limit reset, continuing with next batch..."));
  } else {
    console.log(
      chalk.green(
        `Sufficient rate limit remaining (${rate.remaining}), continuing immediately...`,
      ),
    );
  }
}

/**
 * Generic batch processor that respects rate limits
 */
export async function processBatches<TInput, TOutput>(
  items: TInput[],
  processFunction: (
    batch: TInput[],
    batchIndex: number,
    totalBatches: number,
  ) => Promise<TOutput[]>,
  config: BatchConfig = DEFAULT_BATCH_CONFIG,
): Promise<BatchResult<TOutput>> {
  if (!items || items.length === 0) {
    console.log(chalk.red("No items to process"));
    return { processed: [], failed: [], totalBatches: 0, estimatedHours: 0 };
  }

  const { itemsPerBatch, totalBatches, estimatedHours } = calculateBatchSizes(
    items.length,
    config,
  );
  const batches = createBatches(items, itemsPerBatch);

  const processed: TOutput[] = [];
  const failed: string[] = [];

  console.log(
    chalk.green(
      `Starting batch processing of ${items.length} items in ${totalBatches} batches`,
    ),
  );
  console.log(
    chalk.yellow(`Estimated completion time: ${estimatedHours} hour(s)`),
  );

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchStartTime = Date.now();

    console.log(
      chalk.cyan(`
Processing batch ${i + 1}/${totalBatches} (${batch.length} items)`),
    );
    console.log(chalk.cyan(`   Batch started at: ${new Date().toISOString()}`));

    try {
      const batchResults = await processFunction(batch, i + 1, totalBatches);
      processed.push(...batchResults);

      const batchDuration = Date.now() - batchStartTime;
      console.log(
        chalk.green(
          `Batch ${i + 1} completed in ${(batchDuration / 1000).toFixed(2)}s`,
        ),
      );
    } catch (error) {
      console.log(chalk.red(`Batch ${i + 1} failed: ${error.message}`));
      // Mark all items in this batch as failed
      batch.forEach((item) => {
        failed.push(String(item));
      });
    }

    // Check rate limit before next batch (except for the last one)
    if (i < batches.length - 1) {
      await checkRateLimitBeforeNextBatch(config);
    }
  }

  logGreen(`Batch processing completed!`);
  logGreen(`   Processed: ${processed.length} items`);
  logGreen(`   Failed: ${failed.length} items`);

  return {
    processed,
    failed,
    totalBatches,
    estimatedHours,
  };
}

/**
 * Helper function to estimate processing time
 */
export function estimateProcessingTime(
  itemCount: number,
  config: BatchConfig = DEFAULT_BATCH_CONFIG,
): {
  estimatedHours: number;
  estimatedCompletionTime: Date;
  batchBreakdown: string[];
} {
  const { itemsPerBatch, totalBatches } = calculateBatchSizes(
    itemCount,
    config,
  );
  const startTime = new Date();

  const batchBreakdown: string[] = [];

  itemsPerBatch.forEach((batchSize, index) => {
    batchBreakdown.push(
      `Batch ${index + 1}: ${batchSize} items (dynamic scheduling based on rate limit)`,
    );
  });

  // Since we're using dynamic rate limiting, we can't predict exact timing
  // But we can estimate based on worst-case scenario (1 hour per batch)
  const worstCaseCompletionTime = new Date(
    startTime.getTime() + totalBatches * 3600000, // 1 hour per batch worst case
  );

  return {
    estimatedHours: totalBatches,
    estimatedCompletionTime: worstCaseCompletionTime,
    batchBreakdown,
  };
}
