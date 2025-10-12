import {
  Controller,
  Get,
  Query,
  UsePipes,
  UseInterceptors,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { ReposService } from '../services/repos.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CACHE_TTL } from '../../common/cache/cache.constants';
import { z } from 'zod';

const TrendingQuerySchema = z.object({
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'q is required'),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

const TimeTo300QuerySchema = z.object({
  age: z.enum(['YTD', 'all', '5y', '10y']).default('YTD'),
  sort: z.enum(['fastest', 'slowest']).default('fastest'),
});

@Controller('repos')
export class ReposController {
  private readonly logger = new Logger(ReposController.name);

  constructor(private readonly reposService: ReposService) {}

  @Get('trending')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(CACHE_TTL._10_HOURS)
  @UsePipes(new ZodValidationPipe(TrendingQuerySchema))
  async getTrending(@Query() query: z.infer<typeof TrendingQuerySchema>) {
    const { date, page, limit } = query;
    const effectiveDate =
      date && date.trim() !== '' ? date : this.getTodayUTC();
    this.logger.debug(
      `GET /repos/trending - date: ${effectiveDate}, page: ${page}, limit: ${limit}`,
    );

    const repoList = await this.reposService.fetchTrendingRepos(effectiveDate);

    const {
      items: repos,
      total,
      totalPages,
    } = this.paginateArray(repoList, page, limit);

    const responseDate =
      repoList.length > 0
        ? repoList[0].trendingDate || effectiveDate
        : effectiveDate;

    return {
      repos,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      _dateOverride: responseDate,
    };
  }

  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 900000 } }) // 30 searches per 15 minutes
  @UsePipes(new ZodValidationPipe(SearchQuerySchema))
  async searchRepos(@Query() query: z.infer<typeof SearchQuerySchema>) {
    const { q, language, page, limit } = query;
    this.logger.debug(
      `GET /repos/search - q: ${q}, language: ${language}, page: ${page}, limit: ${limit}`,
    );

    const result = await this.reposService.fetchSearchedRepos(
      q,
      language,
      page,
      limit,
    );

    const totalPages = Math.ceil(result.totalCount / limit);

    return {
      repos: result.repos,
      pagination: {
        page,
        limit,
        totalCount: result.totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      searchInfo: {
        query: q,
        language: language || null,
        resultsFound: result.totalCount,
      },
    };
  }

  @Get('time-to-300-stars')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(CACHE_TTL._6_DAYS)
  @UsePipes(new ZodValidationPipe(TimeTo300QuerySchema))
  async getTimeToFirstThreeHundredStars(
    @Query() query: z.infer<typeof TimeTo300QuerySchema>,
  ) {
    const { age, sort } = query;
    this.logger.debug(
      `GET /repos/time-to-300-stars - age: ${age}, sort: ${sort}`,
    );

    const result =
      sort === 'slowest'
        ? await this.reposService.fetchSlowestTimeToFirstThreeHundredStars(age)
        : await this.reposService.fetchTimeToFirstThreeHundredStars(age);

    if (!result) {
      throw new HttpException(
        'No data available for the specified time range',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
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
