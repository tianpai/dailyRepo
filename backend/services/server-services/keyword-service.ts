import { analyzeKeywordInput } from "./ml-keyword-service";

export function KwRequestBody(topics: string[]): analyzeKeywordInput {
  const topN = 15;
  const distanceThreshold = 0.25;
  const includeClusterSizes = true;
  return {
    topics: topics,
    topN: topN,
    includeRelated: true,
    distance_threshold: distanceThreshold,
    includeClusterSizes: includeClusterSizes,
    batchSize: 64,
  };
}
