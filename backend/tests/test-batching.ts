import {
  calculateBatchSizes,
  estimateProcessingTime,
} from "../services/batch-processor";
import chalk from "chalk";

// Test with a sample of 150 repositories
const sampleRepoCount = 150;

console.log(chalk.bold("Testing Batch Calculation Logic"));
console.log("=".repeat(50));

// Test the batch calculation
const result = calculateBatchSizes(sampleRepoCount);

console.log(chalk.cyan(`\nResults for ${sampleRepoCount} repositories:`));
console.log(`   Batch size: ${result.batchSize} repos per batch`);
console.log(`   Total batches: ${result.totalBatches}`);
console.log(`   Estimated hours: ${result.estimatedHours}`);

// Test the estimation
const estimation = estimateProcessingTime(sampleRepoCount);

console.log(chalk.cyan(`\nTime Estimation:`));
console.log(`   Total estimated hours: ${estimation.estimatedHours}`);
console.log(
  `   Estimated completion: ${estimation.estimatedCompletionTime.toISOString()}`,
);

console.log(chalk.cyan(`\nBatch Schedule:`));
estimation.batchBreakdown.forEach((batch) => {
  console.log(`   ${batch}`);
});

console.log(chalk.green("\nBatch calculation test completed"));