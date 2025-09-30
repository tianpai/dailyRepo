import {
  Controller,
  Get,
  Cache,
  Schema,
} from "../../decorators/http-decorators";
import { TTL } from "@/utils/caching";
import { getTodayUTC, isValidDate } from "@/utils/time";
import { paginateArray } from "@/utils/controller-helper";
import { z } from "zod";
import {
  fetchTrendingDevelopers,
  fetchTopTrendingDevelopers,
} from "@/services/developer-service";

// Schemas
const TrendingDevQuery = z.object({
  date: z
    .string()
    .optional()
    .transform((v) => v ?? getTodayUTC())
    .refine((v) => isValidDate(v), { message: "Invalid date format" }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const TopDevQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

@Controller("/developers")
export class DeveloperController {
  // Optional: parity with v1 root endpoint
  @Get("/")
  async getDevelopersList() {
    return { developers: [] };
  }

  @Get("/trending")
  @Schema({ query: TrendingDevQuery })
  @Cache("trending-developers-{date}-{page}-{limit}", TTL._1_HOUR)
  async getTrendingDevelopers({
    date,
    page,
    limit,
  }: z.infer<typeof TrendingDevQuery>) {
    const list = await fetchTrendingDevelopers(date);
    const { items, total, totalPages } = paginateArray(list, page, limit);

    return {
      developers: items,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  @Get("/top")
  @Schema({ query: TopDevQuery })
  @Cache("top-trending-developers-{limit}", TTL._1_DAY)
  async getTopTrendingDevelopers({ limit }: z.infer<typeof TopDevQuery>) {
    const developers = await fetchTopTrendingDevelopers(limit);
    return { developers };
  }
}

export default DeveloperController;
