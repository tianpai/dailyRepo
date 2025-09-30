import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import {
  ClusteringInput,
  ClusteringOutput,
} from '../../common/interfaces/clustering.interface';

@Injectable()
export class ClusteringService {
  private readonly logger = new Logger(ClusteringService.name);

  constructor(private configService: ConfigService) {}

  async clusterTopics(input: ClusteringInput): Promise<ClusteringOutput> {
    const { topics, topN, distance_threshold } = input;

    this.logger.debug(`Clustering ${topics.length} topics with HuggingFace`);

    const embeddings = await this.getHuggingFaceEmbeddings(topics);
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
  ): Promise<number[][]> {
    const apiToken = this.configService.get<string>('HUGGING_FACE');
    if (!apiToken) {
      throw new Error('HUGGING_FACE environment variable is not set');
    }

    const client = new InferenceClient(apiToken);

    try {
      this.logger.debug('Making HuggingFace API call');

      const output = await client.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: texts,
        provider: 'hf-inference',
      });

      const embeddings: number[][] = Array.isArray(output[0])
        ? (output as number[][])
        : ([output] as number[][]);

      this.logger.debug(`Generated embeddings for ${texts.length} texts`);
      return embeddings;
    } catch (error) {
      this.logger.error('HuggingFace API error', error);
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          throw new Error('HuggingFace API rate limit exceeded');
        }
        if (error.message.includes('503')) {
          throw new Error(
            'HuggingFace model is loading, please try again in a few moments',
          );
        }
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
