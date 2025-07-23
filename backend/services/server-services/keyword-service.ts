import { analyzeKeywordInput } from "./ml-keyword-service";
import { Repo } from "../../model/Repo";
import { Keywords } from "../../model/Keywords";
import { PIPELINE } from "../../utils/db-pipline";
import { filterLanguage } from "../../utils/language-list";
import {
  fetchClusteredKeywords,
  analyzeKeywordOutput,
} from "../../services/server-services/ml-keyword-service";

export function clusterRequestBody(topics: string[]): analyzeKeywordInput {
  return {
    topics: topics,
    topN: 15,
    includeRelated: true,
    distance_threshold: 0.25,
    includeClusterSizes: true,
    batchSize: 64,
  };
}

// Extract keyword analysis logic to a simple function
export async function fetchKeywordAnalysis(
  today: string,
): Promise<analyzeKeywordOutput> {
  // Check the database first
  const dbResult = await Keywords.findOne({ date: today }).sort({ date: -1 });
  if (dbResult) {
    return dbResult.analysis;
  }

  // If not in DB, fetch from ML service
  const repoTopicsResult = await Repo.aggregate(PIPELINE);
  const allTopics: string[] = repoTopicsResult[0]?.topics || [];
  const topics: string[] = filterLanguage(allTopics);

  if (topics.length === 0) {
    return {
      topKeywords: [],
      related: {},
      clusterSizes: {},
    };
  }

  const requestBody = clusterRequestBody(topics);
  const keywordData = await fetchClusteredKeywords(requestBody);

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
