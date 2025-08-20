import dotenv from "dotenv";
import fs from "fs";
import { connectToDatabase } from "../services/db-connection";
import { Repo, StarHistory } from "../model/Repo";
import { getRepoStarRecords } from "../scraping/fetching-star-history";
import { withRateLimitRetry } from "../scraping/rate-limit-checker";

dotenv.config();

interface RepoData {
  _id: string;
  fullName: string;
}

const CHECKPOINT_FILE = "remaining-repos.txt";
const COMPLETED_FILE = "completed-repos.txt";
const FAILED_FILE = "failed-repos.txt";

// Global state for tracking progress
let completedRepos: string[] = [];
let failedRepos: string[] = [];
let allRepoNames: string[] = [];

function loadRemainingRepos(): string[] {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const content = fs.readFileSync(CHECKPOINT_FILE, "utf8").trim();
    return content ? content.split("\n") : [];
  }
  return [];
}

function loadCompletedRepos(): string[] {
  if (fs.existsSync(COMPLETED_FILE)) {
    const content = fs.readFileSync(COMPLETED_FILE, "utf8").trim();
    return content ? content.split("\n") : [];
  }
  return [];
}

function loadFailedRepos(): string[] {
  if (fs.existsSync(FAILED_FILE)) {
    const content = fs.readFileSync(FAILED_FILE, "utf8").trim();
    return content ? content.split("\n") : [];
  }
  return [];
}

function saveProgress() {
  // Save completed repos
  if (completedRepos.length > 0) {
    fs.writeFileSync(COMPLETED_FILE, completedRepos.join("\n") + "\n");
  }

  // Save failed repos
  if (failedRepos.length > 0) {
    fs.writeFileSync(FAILED_FILE, failedRepos.join("\n") + "\n");
  }

  // Save remaining repos (excluding completed and failed)
  const remaining = allRepoNames.filter(
    (name) => !completedRepos.includes(name) && !failedRepos.includes(name),
  );
  if (remaining.length > 0) {
    fs.writeFileSync(CHECKPOINT_FILE, remaining.join("\n"));
  } else {
    // All done, cleanup
    if (fs.existsSync(CHECKPOINT_FILE)) {fs.unlinkSync(CHECKPOINT_FILE);}
  }
}

async function updateRemainingWithNewRepos() {
  console.log("Checking for new repos in database...");

  const completedRepos = loadCompletedRepos();
  const remainingRepos = loadRemainingRepos();
  const failedRepos = loadFailedRepos();

  // Fetch all repo fullnames from database
  const allDbRepos = await Repo.find({}, { fullName: 1 }).lean();
  const allCurrentDbRepos = allDbRepos.map((r) => r.fullName);

  // Union of all known repos
  const alreadyProcessed = [
    ...new Set([...completedRepos, ...remainingRepos, ...failedRepos]),
  ];
  // New repos not in any file
  // When scraping adds new repo data
  const newReposToAdd = allCurrentDbRepos.filter(
    (repo) => !alreadyProcessed.includes(repo),
  );

  if (newReposToAdd.length > 0) {
    console.log(
      `Found ${newReposToAdd.length} new repos to add: ${newReposToAdd.join(", ")}`,
    );

    // APPEND new repos to remaining repos text file
    // Always include failed repos back in remaining (for retry)
    const updatedRemaining = [
      ...remainingRepos,
      ...failedRepos,
      ...newReposToAdd,
    ];
    if (updatedRemaining.length > 0) {
      fs.writeFileSync(CHECKPOINT_FILE, updatedRemaining.join("\n"));
      console.log(
        `Added ${newReposToAdd.length} new repos to ${CHECKPOINT_FILE}`,
      );
      if (failedRepos.length > 0) {
        console.log(
          `Also re-added ${failedRepos.length} previously failed repos for retry`,
        );
      }
    }
  } else if (failedRepos.length > 0) {
    // No new repos, but add failed repos back to remaining for retry
    const updatedRemaining = [...remainingRepos, ...failedRepos];
    fs.writeFileSync(CHECKPOINT_FILE, updatedRemaining.join("\n"));
    console.log(
      `Re-added ${failedRepos.length} previously failed repos to ${CHECKPOINT_FILE} for retry`,
    );
  } else {
    console.log("No new repos found in database");
  }
}

async function main() {
  console.log("Starting star history repopulation...");

  // Connect to database
  await connectToDatabase();

  // Update remaining repos with any new repos from database
  await updateRemainingWithNewRepos();

  // Check for existing checkpoint files
  const remainingRepoNames = loadRemainingRepos();
  const alreadyCompleted = loadCompletedRepos();
  const alreadyFailed = loadFailedRepos();
  completedRepos = [...alreadyCompleted]; // Load existing completed repos
  failedRepos = [...alreadyFailed]; // Load existing failed repos
  let repos: RepoData[];

  if (remainingRepoNames.length > 0) {
    console.log(
      `Resuming from checkpoint with ${remainingRepoNames.length} remaining repos`,
    );
    repos = await Repo.find(
      { fullName: { $in: remainingRepoNames } },
      { _id: 1, fullName: 1 },
    ).lean();
    allRepoNames = [...alreadyCompleted, ...remainingRepoNames];
  } else {
    // Get all repo names and IDs, excluding already completed and failed ones
    const allDbRepos = await Repo.find({}, { _id: 1, fullName: 1 }).lean();
    repos = allDbRepos.filter(
      (r) =>
        !alreadyCompleted.includes(r.fullName) &&
        !alreadyFailed.includes(r.fullName),
    );
    allRepoNames = allDbRepos.map((r) => r.fullName);

    if (alreadyCompleted.length > 0) {
      console.log(
        `Found ${alreadyCompleted.length} already completed repos, skipping them`,
      );
    }
    if (alreadyFailed.length > 0) {
      console.log(
        `Found ${alreadyFailed.length} previously failed repos, skipping them (will retry on next run)`,
      );
    }
  }

  console.log(`Found ${repos.length} repositories to process`);

  let processed = 0;
  let failed = 0;

  // Initial 2 second delay to avoid IO race conditions
  console.log("Waiting 2 seconds before starting...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (const repo of repos) {
    try {
      console.log(
        `\n[${processed + 1}/${repos.length}] Processing ${repo.fullName}...`,
      );

      // Fetch star history with rate limiting and 403 handling
      const starHistory = await withRateLimitRetry(
        () => getRepoStarRecords(repo.fullName, process.env.GITHUB_TOKEN),
        3,
        process.env.GITHUB_TOKEN,
      );

      // Upsert star history (replace existing or create new)
      await StarHistory.findOneAndReplace(
        { repoId: repo._id },
        {
          repoId: repo._id,
          saveDate: new Date(),
          history: starHistory,
        },
        { upsert: true, new: true },
      );
      console.log(
        `  ✓ Saved ${starHistory.length} star history points for ${repo.fullName}`,
      );
      processed++;

      // Add to completed list (in memory)
      completedRepos.push(repo.fullName);
    } catch (error) {
      console.error(`  ✗ Failed to process ${repo.fullName}: ${error.message}`);
      failed++;

      // Add to failed list (in memory)
      failedRepos.push(repo.fullName);

      // If it's a 403 that couldn't be handled, log and continue
      if (error.response?.status === 403) {
        console.log(`  → 403 error persisted after retries, marked as failed`);
      }
    }

    // 2 second delay between repos
    if (processed + failed < repos.length) {
      console.log("  → Waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n=== Repopulation Complete ===`);
  console.log(`Total repositories: ${repos.length}`);
  console.log(`Successfully processed: ${processed}`);
  console.log(`Failed: ${failed}`);

  // Save final completed and failed repos lists
  if (completedRepos.length > 0) {
    fs.writeFileSync(COMPLETED_FILE, completedRepos.join("\n") + "\n");
    console.log(`All completed repos saved to: ${COMPLETED_FILE}`);
  }

  if (failedRepos.length > 0) {
    fs.writeFileSync(FAILED_FILE, failedRepos.join("\n") + "\n");
    console.log(`Failed repos saved to: ${FAILED_FILE}`);
  }

  // Clean up remaining repos file since we're done
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
    console.log(`Remaining repos checkpoint cleaned up.`);
  }

  process.exit(0);
}

// Handle Ctrl-C gracefully
process.on("SIGINT", () => {
  console.log("\n\n=== Interrupted by user (Ctrl-C) ===");
  console.log(`Saving progress...`);
  saveProgress();
  console.log(`Completed repos saved to: ${COMPLETED_FILE}`);
  console.log(`Remaining repos saved to: ${CHECKPOINT_FILE}`);
  if (failedRepos.length > 0) {
    console.log(`Failed repos saved to: ${FAILED_FILE}`);
  }
  console.log(
    `Processed ${completedRepos.length} repos successfully, ${failedRepos.length} failed.`,
  );
  console.log(`To resume, run the script again.`);
  process.exit(0);
});

// Handle errors and cleanup
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
