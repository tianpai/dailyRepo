export interface KeywordAnalysisResponseFromMLServices {
  topKeywords: string[];
  related: {
    [key: string]: string[];
  };
  clusterSizes: {
    [key: string]: number;
  };
}

export interface keywordData {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: {
    string: number;
  };
}

export interface keywordResp {
  isCached: boolean;
  date: string;
  data: keywordData;
}
