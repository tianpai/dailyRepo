import { InferenceClient } from "@huggingface/inference";
import {
  analyzeKeywordInput,
  analyzeKeywordOutput,
} from "./ml-keyword-service";

/**
 * Get text embeddings from Hugging Face Inference API using official client
 */
async function getHuggingFaceEmbeddings(texts: string[]): Promise<number[][]> {
  const apiToken = process.env.HUGGING_FACE;
  if (!apiToken) {
    throw new Error("HUGGING_FACE environment variable is not set");
  }

  const client = new InferenceClient(apiToken);

  try {
    console.log("making hugging face call");

    // Process all texts in batch for efficiency
    const output = await client.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: texts,
      provider: "hf-inference",
    });

    // Handle both single and batch responses
    const embeddings: number[][] = Array.isArray(output[0])
      ? (output as number[][])
      : ([output] as number[][]);

    console.log(`Generated embeddings for ${texts.length} texts`);
    return embeddings;
  } catch (error) {
    console.error("Hugging Face API error:", error);
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        throw new Error("Hugging Face API rate limit exceeded");
      }
      if (error.message.includes("503")) {
        throw new Error(
          "Hugging Face model is loading, please try again in a few moments",
        );
      }
    }
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Perform hierarchical clustering based on cosine similarity
 */
function performClustering(
  topics: string[],
  embeddings: number[][],
  distanceThreshold: number = 0.3,
): {
  related: { [key: string]: string[] };
  clusterSizes: { [key: string]: number };
} {
  const clusters: { [key: string]: string[] } = {};
  const clusterSizes: { [key: string]: number } = {};
  const assigned = new Set<number>();

  // For each topic, find similar topics and group them
  for (let i = 0; i < topics.length; i++) {
    if (assigned.has(i)) continue;

    const clusterName = topics[i];
    clusters[clusterName] = [topics[i]];
    assigned.add(i);

    // Find similar topics
    for (let j = i + 1; j < topics.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);

      // Much more restrictive: use distance instead of similarity
      const distance = 1 - similarity;
      if (distance <= distanceThreshold) {
        clusters[clusterName].push(topics[j]);
        assigned.add(j);
      }
    }

    clusterSizes[clusterName] = clusters[clusterName].length;
  }

  return { related: clusters, clusterSizes };
}

/**
 * Main function to replace fetchClusteredKeywords with Hugging Face approach
 */
export async function fetchClusteredKeywordsHF(
  requestBody: analyzeKeywordInput,
): Promise<analyzeKeywordOutput> {
  const { topics, topN, distance_threshold } = requestBody;

  // Get embeddings from Hugging Face
  const embeddings = await getHuggingFaceEmbeddings(topics);

  // Perform clustering
  const { related, clusterSizes } = performClustering(
    topics,
    embeddings,
    distance_threshold,
  );

  // Get top clusters by size
  const sortedClusters = Object.entries(clusterSizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  // Get top keywords (cluster names)
  const topKeywords = sortedClusters.map(([clusterName]) => clusterName);

  // Filter related clusters to only include top ones
  const topRelated: { [key: string]: string[] } = {};
  const topClusterSizes: { [key: string]: number } = {};

  for (const [clusterName] of sortedClusters) {
    topRelated[clusterName] = related[clusterName];
    topClusterSizes[clusterName] = clusterSizes[clusterName];
  }

  return {
    topKeywords,
    related: topRelated,
    clusterSizes: topClusterSizes,
  };
}
