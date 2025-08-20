import cron from "node-cron";
import { runDailyKeywords } from "./jobs/daily-keywords";
import { runWeeklyTopics } from "./jobs/weekly-topics";

export function startMainScheduler() {
  // Daily keywords at 6:00 PM UTC (1hr after scraping completes)
  cron.schedule("0 18 * * *", runDailyKeywords, { timezone: "UTC" });

  // Weekly topics on Monday 7:00 PM UTC
  cron.schedule("0 19 * * 1", runWeeklyTopics, { timezone: "UTC" });
}
