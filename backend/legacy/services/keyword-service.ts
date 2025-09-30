import { analyzeKeywordInput } from "./ml-keyword-service";
import { Repo } from "@model/Repo";
import { Keywords } from "@model/Keywords";
import { latestRepoTopicsPipeline } from "@utils/db-pipline";
import { filterLanguage } from "@utils/language-list";
import { analyzeKeywordOutput } from "./ml-keyword-service";
import { fetchClusteredKeywordsHF } from "./hf-clustering-service";

export function clusterRequestBody(
  topics: string[],
  includeRelated: boolean = true,
): analyzeKeywordInput {
  return {
    topics: topics,
    topN: 15,
    includeRelated,
    distance_threshold: 0.25, // Same as Python ML service
    includeClusterSizes: true,
    batchSize: 64,
  };
}

// Extract keyword analysis logic to a simple function
export async function fetchKeywordAnalysis(
  today: string,
  includeRelated: boolean = true,
): Promise<analyzeKeywordOutput> {
  // Check the database first
  const dbResult = await Keywords.findOne({ date: today }).sort({ date: -1 });
  if (dbResult) {
    return dbResult.analysis;
  }

  // If not in DB, fetch from ML service
  const repoTopicsResult = await Repo.aggregate(latestRepoTopicsPipeline);
  const allTopics: string[] = repoTopicsResult[0]?.topics || [];
  const topics: string[] = filterLanguage(allTopics);

  if (topics.length === 0) {
    return {
      topKeywords: [],
      related: {},
      clusterSizes: {},
    };
  }

  const requestBody = clusterRequestBody(topics, includeRelated);

  // Use Hugging Face clustering
  const keywordData = await fetchClusteredKeywordsHF(requestBody);
  console.log("[KEYWORDS] Successfully used Hugging Face clustering");

  // If includeRelated is false, remove the related data
  if (!includeRelated) {
    keywordData.related = {};
  }

  // Save to database
  try {
    await Keywords.findOneAndUpdate(
      { date: today },
      { $set: { analysis: keywordData } },
      { upsert: true, new: true },
    );
  } catch (dbError) {
    console.error("Error saving keywords to database:", dbError);
  }

  return keywordData;
}

export async function fetchKeywordAnalysisByDate(
  date: string,
): Promise<analyzeKeywordOutput> {
  // Check the database for the specific date
  const dbResult = await Keywords.findOne({ date }).sort({ date: -1 });
  if (dbResult) {
    return dbResult.analysis;
  }

  // If not in DB, return empty result for historical dates
  return {
    topKeywords: [],
    related: {},
    clusterSizes: {},
  };
}
