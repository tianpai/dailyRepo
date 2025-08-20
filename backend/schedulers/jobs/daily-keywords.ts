import { fetchKeywordAnalysis } from "@/services/keyword-service";
import { getTodayUTC } from "@utils/time";

export async function runDailyKeywords() {
  try {
    const today = getTodayUTC();
    await fetchKeywordAnalysis(today, true);
    console.log("[KEYWORDS] Daily keywords completed");
  } catch (error) {
    console.error("[KEYWORDS] Failed:", error);
  }
}