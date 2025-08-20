import { groupTopicsByLanguage } from "@/services/repo-lang-relation-service";

export async function runWeeklyTopics() {
  try {
    await groupTopicsByLanguage();
    console.log("[TOPICS] Weekly topics completed");
  } catch (error) {
    console.error("[TOPICS] Failed:", error);
  }
}