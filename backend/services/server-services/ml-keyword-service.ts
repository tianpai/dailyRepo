export interface analyzeKeywordInput {
  topics: string[];
  topN: number;
  includeRelated: boolean;
  distance_threshold: number;
  includeClusterSizes: boolean;
  batchSize?: number;
}

export interface analyzeKeywordOutput {
  topKeywords: string[];
  related: {
    [key: string]: string[];
  };
  clusterSizes: {
    [key: string]: number;
  };
}

export async function fetchAnalyzeKeywords(
  requestBody: analyzeKeywordInput,
): Promise<analyzeKeywordOutput> {
  let mlServerUrl = process.env.ML_SERVER_PRIVATE;
  if (process.argv.includes("--debug")) {
    console.log("Debug mode enabled using private ML link");
    mlServerUrl = process.env.ML_SERVER_LOCAL;
  }

  if (!mlServerUrl) {
    throw new Error("ML_SERVER_PRIVATE environment variable is not set");
  }

  const serviceUrl = `${mlServerUrl}/analyze-keywords`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  const response = await fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!response.ok) {
    throw new Error(
      `ML service responded with ${response.status}: ${response.statusText}`,
    );
  }
  const keywordData: Promise<analyzeKeywordOutput> = response.json();
  return keywordData;
}
