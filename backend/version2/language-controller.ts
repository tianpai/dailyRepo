import { Controller, Get, Cache, Schema } from "../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC } from "@/utils/time";
import { Repo } from "@model/Repo";
import { language_list_top } from "@/utils/db-pipline";
import { z } from "zod";

// Languages currently handled by the scraper.
// IMPORTANT: Keep this list in sync with scraper capabilities.
// Do not add languages that are not supported by the scraper
// without updating the scraper logic.
const SUPPORTED_LANGUAGES: string[] = [
  "c++",
  "go",
  "java",
  "javascript",
  "python",
  "rust",
  "typescript",
];

const TopLangQuery = z.object({
  top: z.coerce.number().int().min(1).max(15).default(5),
});

@Controller("/languages")
export class LanguageController {
  // GET /languages
  @Get("/")
  @Cache("languages-list", TTL._1_DAY)
  async getLanguagesList() {
    return { languages: SUPPORTED_LANGUAGES, _dateOverride: getTodayUTC() };
  }

  // Placeholder to mirror v1 behavior
  // GET /languages/trending
  @Get("/trending")
  async getLanguageTrendingRepos() {
    return { trending: [], _dateOverride: getTodayUTC() };
  }

  // GET /languages/top?top=5
  @Get("/top")
  @Schema({ query: TopLangQuery })
  @Cache("top-languages-{top}", TTL._1_DAY)
  async getTopLang({ top }: z.infer<typeof TopLangQuery>) {
    const pipeline = language_list_top(top);
    const dbResult = await Repo.aggregate(pipeline);
    const topLangs = (dbResult[0] as any) || [];
    // Match v1 shape: { data: TopLangs }
    return { data: topLangs, _dateOverride: getTodayUTC() };
  }
}

export default LanguageController;
