import { getRepoStarRecords } from "./fetching-star-history";
import { Repo, StarHistory } from "@model/Repo";

// Type definitions to match repo-data.ts
interface StarHistoryProcessResult {
  repoId: any;
  repoName: string;
  history: any[];
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
    `Repository validation: ${validRepoNames.length} valid, ${skippedCount} skipped`,
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
  const data = await getRepoStarRecords(repoName);

  console.log(
    `[${index + 1}/${total}] ${repoName} ${data?.length || 0} data points`,
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
    console.log("No star history data to save");
    return;
  }

  // Use upsert operations to prevent duplicates
  const upsertOperations = results.map(({ repoId, history }) => ({
    updateOne: {
      filter: { repoId },
      update: {
        repoId,
        saveDate: new Date(),
        history,
      },
      upsert: true,
    },
  }));

  await StarHistory.bulkWrite(upsertOperations);

  console.log(`Successfully saved star history for ${results.length} repos`);
}

/**
 * Process repositories for star history sequentially with delays
 */
async function processStarHistorySequentially(
  repoNames: string[],
): Promise<StarHistoryProcessResult[]> {
  const { validRepoNames, repoMap } =
    await validateRepositoriesInDatabase(repoNames);

  const successfulResults: StarHistoryProcessResult[] = [];

  // Process each repo sequentially with 3-second delays to respect sub-rate limits
  for (let i = 0; i < validRepoNames.length; i++) {
    const repoName = validRepoNames[i];
    const repoId = repoMap.get(repoName);

    try {
      const result = await processStarHistoryForRepo(
        repoName,
        repoId,
        i,
        validRepoNames.length,
      );

      successfulResults.push(result);
    } catch (error) {
      console.log(`  Failed ${repoName}: ${error.message}`);
      // Continue processing other repos
    }

    // Add delay between repos (except for the last one)
    if (i < validRepoNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return successfulResults;
}

/**
 * Process star history for all repositories with rate limit handling
 */
export async function saveStarHistory(repoNames: string[]): Promise<void> {
  if (!repoNames || repoNames.length === 0) {
    console.log("No repos to process for star history");
    return;
  }

  const allSuccessfulResults = await processStarHistorySequentially(repoNames);
  await saveStarHistoryResults(allSuccessfulResults);
}
