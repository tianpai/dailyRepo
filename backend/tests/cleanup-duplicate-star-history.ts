/*
 * Star History Duplicate Cleanup Script
 *
 * Removes duplicate StarHistory documents for the same repo,
 * keeping only the most recent one (latest saveDate).
 */

import { StarHistory } from "@model/Repo";
import { connectToDatabase } from "@/services/db-connection";
import dotenv from "dotenv";
import * as readline from "readline";
import { Table } from "console-table-printer";
dotenv.config();

interface AggregatedDocument {
  docId: string;
  saveDate: Date;
  historyLength: number;
}

interface DuplicateRepo {
  _id: string;
  count: number;
  documents: AggregatedDocument[];
}

/**
 * Check if dry run flag is present
 */
function dryRun(): boolean {
  return process.argv.includes("--dry-run");
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Star History Duplicate Cleanup Script

USAGE:
  node cleanup-duplicate-star-history.ts [OPTIONS]

OPTIONS:
  --dry-run                  Preview what would be cleaned without making changes
  --confirm-before-remove    Ask for confirmation before removing duplicates
  --help                     Show this help message

EXAMPLES:
  node cleanup-duplicate-star-history.ts --dry-run
  node cleanup-duplicate-star-history.ts --confirm-before-remove
  node cleanup-duplicate-star-history.ts

DESCRIPTION:
  Removes duplicate StarHistory documents for the same repository,
  keeping only the document with the most data points (history length)
  and newest save date as a tiebreaker.

WARNING:
  This script permanently deletes data. Always backup your database first!
  Use --dry-run to preview changes before running the actual cleanup.
`);
}

/**
 * Check for invalid flags and show help if needed
 */
function checkFlags(): boolean {
  const validFlags = ["--dry-run", "--confirm-before-remove", "--help"];
  const providedFlags = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"));

  // Check for help flag
  if (process.argv.includes("--help")) {
    showHelp();
    return false;
  }

  // Check for invalid flags
  const invalidFlags = providedFlags.filter(
    (flag) => !validFlags.includes(flag),
  );
  if (invalidFlags.length > 0) {
    console.error(`Error: Unknown flag(s): ${invalidFlags.join(", ")}`);
    console.error("Use --help to see available options.");
    showHelp();
    return false;
  }

  return true;
}

/**
 * Fetch repositories with duplicate StarHistory documents
 */
async function fetchDuplicateRepos(): Promise<DuplicateRepo[]> {
  const duplicateRepos: DuplicateRepo[] = await StarHistory.aggregate([
    {
      $group: {
        _id: "$repoId",
        count: { $sum: 1 },
        documents: {
          $push: {
            docId: "$_id",
            saveDate: {
              $ifNull: ["$saveDate", new Date(0)], // Handle null saveDates
            },
            historyLength: { $size: "$history" },
          },
        },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
    {
      $sort: { count: -1 },
    },
  ]).allowDiskUse(true); // Allow disk usage for large datasets

  return duplicateRepos;
}

/**
 * Sort documents by priority (history length first, then save date)
 */
function sortDocumentsByPriority(
  documents: AggregatedDocument[],
): AggregatedDocument[] {
  return documents.sort((a, b) => {
    // First priority: more data points (history length)
    if (a.historyLength !== b.historyLength) {
      return b.historyLength - a.historyLength;
    }

    // Second priority: newer saveDate
    const dateA = new Date(a.saveDate);
    const dateB = new Date(b.saveDate);

    // Handle invalid dates - put them at the end (oldest)
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1; // a is older
    if (isNaN(dateB.getTime())) return -1; // b is older

    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Delete duplicate documents, keeping the best one for each repo
 */
async function deleteDuplicateDocuments(
  duplicateRepos: DuplicateRepo[],
): Promise<{
  documentsRemoved: number;
  errors: number;
  processLog: string[];
}> {
  let documentsRemoved = 0;
  let errors = 0;
  const processLog: string[] = [];

  for (let i = 0; i < duplicateRepos.length; i++) {
    const repo = duplicateRepos[i];

    try {
      const sortedDocs = sortDocumentsByPriority(repo.documents);
      const toKeep = sortedDocs[0];
      const toRemove = sortedDocs.slice(1);

      processLog.push(`Repo ${repo._id} (${i + 1}/${duplicateRepos.length}):`);
      processLog.push(
        `  Keeping: ${toKeep.docId} (${toKeep.saveDate}) - ${toKeep.historyLength} points`,
      );
      processLog.push(`  Removing: ${toRemove.length} older documents`);

      // Validate we have documents to remove
      if (toRemove.length === 0) {
        processLog.push(`  No documents to remove for repo ${repo._id}`);
        continue;
      }

      // Remove the older documents with validation
      const removeIds = toRemove
        .map((doc) => doc.docId)
        .filter((id) => id != null);

      if (removeIds.length === 0) {
        processLog.push(
          `  No valid document IDs to remove for repo ${repo._id}`,
        );
        continue;
      }

      const deleteResult = await StarHistory.deleteMany({
        _id: { $in: removeIds },
      });

      if (deleteResult.deletedCount !== removeIds.length) {
        processLog.push(
          `  WARNING: Expected to delete ${removeIds.length} documents, but deleted ${deleteResult.deletedCount}`,
        );
      }

      documentsRemoved += deleteResult.deletedCount || 0;

      // Progress marker
      if ((i + 1) % 10 === 0) {
        processLog.push(
          `Progress: ${i + 1}/${duplicateRepos.length} repos processed`,
        );
      }
    } catch (error) {
      processLog.push(`Error processing repo ${repo._id}: ${error}`);
      errors++;
    }
  }

  return { documentsRemoved, errors, processLog };
}

/**
 * Generate duplicate report data with table formatting
 */
function generateDuplicateReport(
  duplicateRepos: DuplicateRepo[],
  isDryRun: boolean,
): {
  isEmpty: boolean;
  reportLines: string[];
  table?: Table;
} {
  if (duplicateRepos.length === 0) {
    return {
      isEmpty: true,
      reportLines: ["No duplicates found! Your database is clean."],
    };
  }

  const reportLines: string[] = [];
  const modeText = isDryRun ? " (DRY RUN)" : "";
  reportLines.push(
    `Found ${duplicateRepos.length} repos with duplicate StarHistory documents${modeText}`,
  );

  let totalToRemove = 0;
  duplicateRepos.forEach((repo) => {
    totalToRemove += repo.count - 1; // Keep 1, remove the rest
  });

  // Create table for duplicate repos
  const table = new Table({
    title: isDryRun ? "Duplicate Repos (Dry Run)" : "Duplicate Repos Found",
    columns: [
      { name: "repoId", title: "Repository ID", alignment: "left" },
      { name: "totalDocs", title: "Total Docs", alignment: "center" },
      { name: "toRemove", title: "Will Remove", alignment: "center" },
      { name: "keepDate", title: "Keep Date", alignment: "center" },
      {
        name: "keepHistoryLength",
        title: "Keep History Length",
        alignment: "center",
      },
    ],
  });

  // Add data to table (limit to top 20 for readability)
  const displayRepos = isDryRun ? duplicateRepos.slice(0, 20) : duplicateRepos;
  displayRepos.forEach((repo) => {
    const sortedDocs = sortDocumentsByPriority(repo.documents);
    const toKeep = sortedDocs[0];

    table.addRow({
      repoId: repo._id,
      totalDocs: repo.count,
      toRemove: repo.count - 1,
      keepDate: new Date(toKeep.saveDate).toISOString().split("T")[0], // Format date
      keepHistoryLength: toKeep.historyLength,
    });
  });

  if (isDryRun) {
    reportLines.push("");
    reportLines.push("DRY RUN RESULTS:");
    reportLines.push(`Would remove ${totalToRemove} duplicate documents`);
    reportLines.push(`Would keep ${duplicateRepos.length} newest documents`);
    if (duplicateRepos.length > 20) {
      reportLines.push(
        `(Showing top 20 out of ${duplicateRepos.length} repos with duplicates)`,
      );
    }
  }

  return {
    isEmpty: false,
    reportLines,
    table,
  };
}

/**
 * Prompt user for confirmation
 */
function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

/**
 * Main runner function
 */
async function main(): Promise<void> {
  const isDryRun = dryRun();
  const confirmBeforeRemove = process.argv.includes("--confirm-before-remove");

  try {
    await connectToDatabase();

    const totalDocuments = await StarHistory.countDocuments();
    console.log(`Total StarHistory documents: ${totalDocuments}`);

    const duplicateRepos = await fetchDuplicateRepos();

    // Generate and display report
    const report = generateDuplicateReport(duplicateRepos, isDryRun);
    report.reportLines.forEach((line) => console.log(line));

    // Print table if available
    if (report.table) {
      report.table.printTable();
    }

    if (report.isEmpty) {
      return;
    }

    if (isDryRun) {
      console.log("\nTo actually perform cleanup, run without --dry-run flag");
      return;
    }

    // Ask for confirmation if needed
    if (confirmBeforeRemove) {
      const shouldProceed = await askForConfirmation(
        "\nProceed with cleanup? (y/N): ",
      );
      if (!shouldProceed) {
        console.log("Cleanup cancelled by user.");
        process.exit(0);
      }
    }

    const { documentsRemoved, errors, processLog } =
      await deleteDuplicateDocuments(duplicateRepos);

    // Display process logs
    processLog.forEach((line) => {
      if (line.startsWith("Progress:") || line.startsWith("Repo ")) {
        console.log(`\n${line}`);
      } else {
        console.log(line);
      }
    });

    // Final reporting
    console.log("\nCleanup Complete!");
    console.log("==========================================");
    console.log(`Total documents before: ${totalDocuments}`);
    console.log(`Repos with duplicates: ${duplicateRepos.length}`);
    console.log(`Documents removed: ${documentsRemoved}`);
    console.log(`Documents kept: ${duplicateRepos.length}`);
    console.log(`Errors: ${errors}`);
    console.log(
      `Expected documents after: ${totalDocuments - documentsRemoved}`,
    );

    // Verify the cleanup
    const remainingTotal = await StarHistory.countDocuments();
    console.log(`Actual documents after: ${remainingTotal}`);

    if (remainingTotal === totalDocuments - documentsRemoved) {
      console.log("Cleanup verification successful!");
    } else {
      console.log("Cleanup verification failed - counts don't match");
    }
  } catch (error) {
    console.error("Fatal error during cleanup:", error);
    throw error;
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  // Check flags first - exit if help was shown or invalid flags found
  if (!checkFlags()) {
    process.exit(0);
  }

  main()
    .then(() => {
      console.log("\nDatabase cleanup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}
