import { Controller, Get, Query, UsePipes, Logger } from '@nestjs/common';
import { DevelopersService } from '../services/developers.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const TrendingDevQuerySchema = z.object({
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const TopDevQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

@Controller('developers')
export class DevelopersController {
  private readonly logger = new Logger(DevelopersController.name);

  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  getDevelopersList() {
    this.logger.debug('GET /developers');
    return { developers: [] };
  }

  @Get('trending')
  @UsePipes(new ZodValidationPipe(TrendingDevQuerySchema))
  async getTrendingDevelopers(
    @Query() query: z.infer<typeof TrendingDevQuerySchema>,
  ) {
    const { date, page, limit } = query;
    const effectiveDate = date || this.getTodayUTC();
    this.logger.debug(
      `GET /developers/trending - date: ${effectiveDate}, page: ${page}, limit: ${limit}`,
    );

    const list =
      await this.developersService.fetchTrendingDevelopers(effectiveDate);
    const { items, total, totalPages } = this.paginateArray(list, page, limit);

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

  @Get('top')
  @UsePipes(new ZodValidationPipe(TopDevQuerySchema))
  async getTopTrendingDevelopers(
    @Query() query: z.infer<typeof TopDevQuerySchema>,
  ) {
    const { limit } = query;
    this.logger.debug(`GET /developers/top - limit: ${limit}`);
    const developers =
      await this.developersService.fetchTopTrendingDevelopers(limit);
    return { developers };
  }

  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
  }

  private paginateArray<T>(array: T[], page: number, limit: number) {
    const total = array.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = array.slice(startIndex, endIndex);

    return { items, total, totalPages };
  }
}
