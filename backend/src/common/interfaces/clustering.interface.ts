export interface ClusteringInput {
  topics: string[];
  topN: number;
  includeRelated: boolean;
  distance_threshold: number;
  includeClusterSizes: boolean;
  batchSize?: number;
}

export interface ClusteringOutput {
  topKeywords: string[];
  related: {
    [key: string]: string[];
  };
  clusterSizes: {
    [key: string]: number;
  };
  originalTopicsCount?: number;
}
