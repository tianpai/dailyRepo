import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import {
  ClusteringInput,
  ClusteringOutput,
} from '@/common/interfaces/clustering.interface';

@Injectable()
export class ClusteringService {
  private readonly logger = new Logger(ClusteringService.name);

  constructor(private configService: ConfigService) {}

  async clusterTopics(input: ClusteringInput): Promise<ClusteringOutput> {
    const { topics, topN, distance_threshold, batchSize } = input;

    this.logger.debug(`Clustering ${topics.length} topics with HuggingFace`);

    const embeddings = await this.getHuggingFaceEmbeddings(topics, batchSize);
    const { related, clusterSizes } = this.performClustering(
      topics,
      embeddings,
      distance_threshold,
    );

    const sortedClusters = Object.entries(clusterSizes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN);

    const topKeywords = sortedClusters.map(([clusterName]) => clusterName);

    const topRelated: { [key: string]: string[] } = {};
    const topClusterSizes: { [key: string]: number } = {};

    for (const [clusterName] of sortedClusters) {
      topRelated[clusterName] = related[clusterName];
      topClusterSizes[clusterName] = clusterSizes[clusterName];
    }

    this.logger.debug(`Clustered into ${topKeywords.length} top keywords`);

    return {
      topKeywords,
      related: topRelated,
      clusterSizes: topClusterSizes,
      originalTopicsCount: topics.length,
    };
  }

  private async getHuggingFaceEmbeddings(
    texts: string[],
    batchSize: number = 64,
  ): Promise<number[][]> {
    const apiToken = this.configService.get<string>('HUGGING_FACE');
    if (!apiToken) {
      throw new Error('HUGGING_FACE environment variable is not set');
    }

    if (texts.length === 0) {
      return [];
    }

    const client = new InferenceClient(apiToken);
    const uniqueTexts: string[] = [];
    const textIndex = new Map<string, number>();

    for (const text of texts) {
      if (!textIndex.has(text)) {
        textIndex.set(text, uniqueTexts.length);
        uniqueTexts.push(text);
      }
    }

    const safeBatchSize = Math.max(1, Math.min(batchSize || 64, 128));

    try {
      this.logger.debug(
        `Making HuggingFace API call for ${uniqueTexts.length} unique texts`,
      );

      const uniqueEmbeddings: number[][] = [];

      for (let i = 0; i < uniqueTexts.length; i += safeBatchSize) {
        const batch = uniqueTexts.slice(i, i + safeBatchSize);
        const output = await client.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: batch,
          provider: 'hf-inference',
        });

        const batchEmbeddings: number[][] = Array.isArray(output[0])
          ? (output as number[][])
          : ([output] as number[][]);

        if (batchEmbeddings.length !== batch.length) {
          throw new Error(
            `Unexpected embedding batch size: expected ${batch.length}, got ${batchEmbeddings.length}`,
          );
        }

        uniqueEmbeddings.push(...batchEmbeddings);
      }

      if (uniqueEmbeddings.length !== uniqueTexts.length) {
        throw new Error(
          `Unexpected embedding count: expected ${uniqueTexts.length}, got ${uniqueEmbeddings.length}`,
        );
      }

      const embeddings: number[][] = texts.map((text) => {
        const index = textIndex.get(text);
        if (index === undefined) {
          throw new Error(`Missing embedding for text: ${text}`);
        }
        return uniqueEmbeddings[index];
      });

      this.logger.debug(`Generated embeddings for ${texts.length} texts`);
      return embeddings;
    } catch (error) {
      this.logger.error('HuggingFace API error', error);
      const status =
        typeof error === 'object' && error !== null && 'httpResponse' in error
          ? (
              error as {
                httpResponse?: {
                  status?: number;
                };
              }
            ).httpResponse?.status
          : undefined;

      if (
        status === 429 ||
        (error instanceof Error && error.message.includes('429'))
      ) {
        throw new Error('HuggingFace API rate limit exceeded');
      }
      if (
        status === 503 ||
        (error instanceof Error && error.message.includes('503'))
      ) {
        throw new Error(
          'HuggingFace model is loading, please try again in a few moments',
        );
      }
      if (status === 504) {
        throw new Error(
          'HuggingFace inference timed out; try a smaller batch size or retry later',
        );
      }
      throw error;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  private performClustering(
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

    for (let i = 0; i < topics.length; i++) {
      if (assigned.has(i)) {
        continue;
      }

      const clusterName = topics[i];
      clusters[clusterName] = [topics[i]];
      assigned.add(i);

      for (let j = i + 1; j < topics.length; j++) {
        if (assigned.has(j)) {
          continue;
        }

        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
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
}
