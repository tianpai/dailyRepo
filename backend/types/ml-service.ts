export interface KeywordAnalysisResponseFromMLServices {
  topKeywords: string[];
  related: {
    [key: string]: string[];
  };
  clusterSizes: {
    [key: string]: number;
  };
}
