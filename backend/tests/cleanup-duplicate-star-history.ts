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
dotenv.config();

interface CleanupStats {
  totalDocuments: number;
  duplicateRepos: number;
  documentsRemoved: number;
  documentsKept: number;
  errors: number;
}

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
 * Find and remove duplicate StarHistory documents
 */
async function cleanupDuplicateStarHistory(
  confirmBeforeRemove: boolean = false,
) {
  const stats: CleanupStats = {
    totalDocuments: 0,
    duplicateRepos: 0,
    documentsRemoved: 0,
    documentsKept: 0,
    errors: 0,
  };

  try {
    await connectToDatabase();
    console.log("Connected to database");

    // Get total count first
    stats.totalDocuments = await StarHistory.countDocuments();
    console.log(`Total StarHistory documents: ${stats.totalDocuments}`);

    // Find all repos with multiple StarHistory documents
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

    stats.duplicateRepos = duplicateRepos.length;
    console.log(
      `\nFound ${stats.duplicateRepos} repos with duplicate StarHistory documents`,
    );

    if (duplicateRepos.length === 0) {
      console.log("No duplicates found! Your database is clean.");
      return stats;
    }

    if (confirmBeforeRemove) {
      console.log("\nDuplicate repos found:");
      duplicateRepos.forEach((repo) => {
        const sortedDocs = repo.documents.sort((a, b) => {
          if (a.historyLength !== b.historyLength) {
            return b.historyLength - a.historyLength;
          }
          const dateA = new Date(a.saveDate);
          const dateB = new Date(b.saveDate);
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        const toKeep = sortedDocs[0];
        console.log(
          `${repo._id}    ${repo.count} docs found    keep on date ${toKeep.saveDate}  ${toKeep.historyLength} data points`,
        );
      });

      const shouldProceed = await askForConfirmation(
        "\nProceed with cleanup? (y/N): ",
      );
      if (!shouldProceed) {
        console.log("Cleanup cancelled by user.");
        process.exit(0);
      }
    }

    console.log("\nStarting cleanup...");

    // Process each repo with duplicates
    for (let i = 0; i < duplicateRepos.length; i++) {
      const repo = duplicateRepos[i];

      try {
        // Sort documents by history length (most data points first), then by saveDate
        const sortedDocs = repo.documents.sort((a, b) => {
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

        // Keep the document with most data points (and newest date as tiebreaker), remove the rest
        const toKeep = sortedDocs[0];
        const toRemove = sortedDocs.slice(1);

        if (!confirmBeforeRemove) {
          console.log(
            `\nRepo ${repo._id} (${i + 1}/${duplicateRepos.length}):`,
          );
          console.log(
            `  Keeping: ${toKeep.docId} (${toKeep.saveDate}) - ${toKeep.historyLength} points`,
          );
          console.log(`  Removing: ${toRemove.length} older documents`);
        }

        // Validate we have documents to remove
        if (toRemove.length === 0) {
          console.log(`  No documents to remove for repo ${repo._id}`);
          continue;
        }

        // Remove the older documents with validation
        const removeIds = toRemove
          .map((doc) => doc.docId)
          .filter((id) => id != null);

        if (removeIds.length === 0) {
          console.log(`  No valid document IDs to remove for repo ${repo._id}`);
          continue;
        }

        const deleteResult = await StarHistory.deleteMany({
          _id: { $in: removeIds },
        });

        if (deleteResult.deletedCount !== removeIds.length) {
          console.warn(
            `  ⚠️ Expected to delete ${removeIds.length} documents, but deleted ${deleteResult.deletedCount}`,
          );
        }

        stats.documentsRemoved += deleteResult.deletedCount || 0;
        stats.documentsKept += 1;

        // Progress update
        if (!confirmBeforeRemove && (i + 1) % 10 === 0) {
          console.log(
            `\nProgress: ${i + 1}/${duplicateRepos.length} repos processed`,
          );
        }
      } catch (error) {
        console.error(`Error processing repo ${repo._id}:`, error);
        stats.errors++;
      }
    }

    console.log("\nCleanup Complete!");
    console.log("==========================================");
    console.log(`Total documents before: ${stats.totalDocuments}`);
    console.log(`Repos with duplicates: ${stats.duplicateRepos}`);
    console.log(`Documents removed: ${stats.documentsRemoved}`);
    console.log(`Documents kept: ${stats.documentsKept}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(
      `Expected documents after: ${stats.totalDocuments - stats.documentsRemoved}`,
    );

    // Verify the cleanup
    const remainingTotal = await StarHistory.countDocuments();
    console.log(`Actual documents after: ${remainingTotal}`);

    if (remainingTotal === stats.totalDocuments - stats.documentsRemoved) {
      console.log("Cleanup verification successful!");
    } else {
      console.log("Cleanup verification failed - counts don't match");
    }

    return stats;
  } catch (error) {
    console.error("Fatal error during cleanup:", error);
    throw error;
  }
}

// Dry run function to see what would be cleaned without actually doing it
async function dryRunCleanup() {
  try {
    await connectToDatabase();
    console.log("Connected to database (DRY RUN MODE)");

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
    ]);

    console.log(`\nDRY RUN RESULTS:`);
    console.log(`Found ${duplicateRepos.length} repos with duplicates`);

    let totalToRemove = 0;
    duplicateRepos.forEach((repo) => {
      totalToRemove += repo.count - 1; // Keep 1, remove the rest
    });

    console.log(`Would remove ${totalToRemove} duplicate documents`);
    console.log(`Would keep ${duplicateRepos.length} newest documents`);

    // Show top duplicates
    console.log(`\nTop repos with most duplicates:`);
    duplicateRepos.slice(0, 10).forEach((repo) => {
      console.log(
        `  Repo ${repo._id}: ${repo.count} documents (would remove ${repo.count - 1})`,
      );
    });
  } catch (error) {
    console.error("Error in dry run:", error);
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  const isDryRun = process.argv.includes("--dry-run");
  const confirmBeforeRemove = process.argv.includes("--confirm-before-remove");

  if (isDryRun) {
    console.log("Running dry run to preview cleanup...");
    dryRunCleanup().then(() => {
      console.log("\nTo actually perform cleanup, run without --dry-run flag");
      process.exit(0);
    });
  } else {
    console.log("Starting StarHistory duplicate cleanup...");
    console.log("This will permanently remove duplicate documents!");
    console.log("Make sure you have a database backup!\n");

    cleanupDuplicateStarHistory(confirmBeforeRemove)
      .then(() => {
        console.log("\nDatabase cleanup completed successfully!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Cleanup failed:", error);
        process.exit(1);
      });
  }
}

export { cleanupDuplicateStarHistory, dryRunCleanup };
