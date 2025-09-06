import { Get, Post, Cache, Schema, Controller } from "../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC } from "@/utils/time";
import {
  fetchRepoStarHistory,
  validateRepoNames,
  fetchMultipleRepoStarHistory,
} from "@/services/star-history-service";
import { z } from "zod";

// Zod schemas for validation
const StarHistoryParams = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
});

const BulkStarHistoryBody = z.object({
  repoNames: z
    .array(z.string().min(1, "Repository name cannot be empty"))
    .min(1, "At least one repository name is required"),
});

@Controller("/repos")
export class StarHistoryController {
  /**
   * Single repository star history
   */
  @Get("/:owner/:repo/star-history")
  @Schema({ params: StarHistoryParams })
  @Cache("star-history-{owner}-{repo}", TTL._1_WEEK)
  // Note: @Param decorators are unnecessary with schema-based params.
  // Cache-key interpolation already falls back to req.params when no @Param is present.
  // For query tokens in cache keys, consider switching interpolation to use parsed
  // schema values so defaults are applied; then @Query becomes fully optional too.
  async getStarHistory({ owner, repo }: z.infer<typeof StarHistoryParams>) {
    const fname = `${owner}/${repo}`;
    const starHistory = await fetchRepoStarHistory(fname);

    return {
      ...starHistory,
      _dateOverride: getTodayUTC(), // Use consistent date format like original
    };
  }

  /**
   * Bulk star history for multiple repositories
   */
  @Post("/star-history")
  @Schema({ body: BulkStarHistoryBody })
  async getStarHistoryForRepos({
    body,
  }: {
    body: z.infer<typeof BulkStarHistoryBody>;
  }) {
    const { repoNames } = body;
    const validRepoNames = validateRepoNames(repoNames);

    const { data } = await fetchMultipleRepoStarHistory(validRepoNames);
    return data;
  }
}
