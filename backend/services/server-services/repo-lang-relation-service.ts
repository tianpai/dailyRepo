import { Repo } from "../../model/Repo";
import { WeeklyTopicFindings } from "../../model/WeeklyTopicFindings";
import { topicLangPipeline } from "../../utils/db-pipline";
import { filterLanguage } from "../../utils/language-list";
import { getCurrentWeekNumber } from "../../utils/time";
import {
  fetchClusteredKeywords,
  analyzeKeywordOutput,
} from "./ml-keyword-service";

interface TopicLanguage {
  _id: string;
  fullName: string;
  language: Record<string, number>;
  topics: string[];
}

interface RepoTopicLanguage {
  fullname: string;
  main_language: string;
  topics: string[];
}

interface LanguageTopicMap {
  [language: string]: { [cluster: string]: number };
}

async function getTopicsLanguage(): Promise<RepoTopicLanguage[]> {
  const repos: TopicLanguage[] = await Repo.aggregate(topicLangPipeline);
  return repos
    .map((repo) => {
      let mainLanguage = "Unknown";
      let maxCount = 0;

      for (const [lang, count] of Object.entries(repo.language)) {
        if (count > maxCount) {
          maxCount = count;
          mainLanguage = lang;
        }
      }

      return {
        fullname: repo.fullName,
        main_language: mainLanguage,
        topics: repo.topics,
      };
    })
    .filter((repo) => repo.main_language !== "Unknown");
}

/*
 * keep duplicated
 */
async function getAllTopics(): Promise<string[]> {
  const repos = await getTopicsLanguage();
  let topics: string[] = [];

  for (const repo of repos) {
    topics.push(...repo.topics);
  }

  topics = filterLanguage(topics);

  return topics;
}

/*
 * just make a request ml ml-keyword-service
 */
async function clusterTopicsWithML(
  allTopics: string[],
): Promise<analyzeKeywordOutput | null> {
  try {
    const mlResult = await fetchClusteredKeywords({
      topics: allTopics,
      topN: 100,
      includeRelated: true,
      distance_threshold: 0.35,
      includeClusterSizes: true,
      batchSize: 64,
    });

    return mlResult;
  } catch (error) {
    console.error(
      "ML clustering failed, falling back to simple clustering:",
      error,
    );
    return null;
  }
}

function findCluster(
  topic: string,
  mlResult: analyzeKeywordOutput,
): string | null {
  for (const [cluster, topicList] of Object.entries(mlResult.related)) {
    if (topicList.includes(topic)) {
      return cluster;
    }
  }
  return null;
}

function filterAndSortClusters(
  langTopicMap: LanguageTopicMap,
): LanguageTopicMap {
  const filteredLangTopicMap: LanguageTopicMap = {};
  for (const [lang, clusters] of Object.entries(langTopicMap)) {
    if (Object.keys(clusters).length > 0) {
      // Sort clusters by count (highest first)
      const sortedClusters = Object.entries(clusters)
        .sort(([, a], [, b]) => b - a)
        .reduce(
          (acc, [cluster, count]) => {
            acc[cluster] = count;
            return acc;
          },
          {} as { [cluster: string]: number },
        );

      filteredLangTopicMap[lang] = sortedClusters;
    }
  }
  return filteredLangTopicMap;
}

function filterLanguagesByTopicCount(
  langTopicMap: LanguageTopicMap,
  minTopics: number = 3,
): LanguageTopicMap {
  const finalLangTopicMap: LanguageTopicMap = {};
  for (const [lang, clusters] of Object.entries(langTopicMap)) {
    const totalTopics = Object.values(clusters).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalTopics >= minTopics) {
      finalLangTopicMap[lang] = clusters;
    }
  }
  return finalLangTopicMap;
}

async function senetizeTopicLangMap(): Promise<LanguageTopicMap> {
  const repos = await getTopicsLanguage();
  const allTopics = await getAllTopics();
  const clusteredTopics = await clusterTopicsWithML(allTopics);
  const langTopicMap: LanguageTopicMap = {};

  // Handle case where ML clustering failed
  if (!clusteredTopics) {
    return langTopicMap;
  }

  for (const repo of repos) {
    const lang = repo.main_language;

    // Initialize language entry if it doesn't exist
    if (!langTopicMap[lang]) {
      langTopicMap[lang] = {};
    }

    for (const topic of repo.topics) {
      const cluster = findCluster(topic, clusteredTopics);
      if (cluster) {
        // Initialize cluster count if it doesn't exist
        if (!langTopicMap[lang][cluster]) {
          langTopicMap[lang][cluster] = 0;
        }
        langTopicMap[lang][cluster] += 1;
      }
    }
  }

  const filteredAndSortedMap = filterAndSortClusters(langTopicMap);
  const finalMap = filterLanguagesByTopicCount(filteredAndSortedMap);

  return finalMap;
}

export async function groupTopicsByLanguage(): Promise<LanguageTopicMap> {
  const { year, week } = getCurrentWeekNumber();

  // Try to get from database first
  const existingFindings = await WeeklyTopicFindings.findOne({ year, week });
  if (existingFindings) {
    return existingFindings.languageTopicMap;
  }

  // Calculate new findings and save to database
  const languageTopicMap = await senetizeTopicLangMap();

  try {
    await WeeklyTopicFindings.create({
      year,
      week,
      languageTopicMap,
    });
  } catch (error) {
    console.error("Failed to save weekly topic findings:", error);
  }

  return languageTopicMap;
}
