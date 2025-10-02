import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { StarHistoryService } from '../services/star-history.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CACHE_TTL } from '../../common/cache/cache.constants';
import { z } from 'zod';

const StarHistoryParamsSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
});

const BulkStarHistoryBodySchema = z.object({
  repoNames: z
    .array(z.string().min(1, 'Repository name cannot be empty'))
    .min(1, 'At least one repository name is required'),
});

@Controller('repos')
export class StarHistoryController {
  private readonly logger = new Logger(StarHistoryController.name);

  constructor(private readonly starHistoryService: StarHistoryService) {}

  @Get(':owner/:repo/star-history')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(CACHE_TTL._30_DAYS)
  async getStarHistory(
    @Param(new ZodValidationPipe(StarHistoryParamsSchema))
    params: z.infer<typeof StarHistoryParamsSchema>,
  ) {
    const { owner, repo } = params;
    const fname = `${owner}/${repo}`;
    this.logger.debug(`GET /repos/${owner}/${repo}/star-history`);
    const raw = await this.starHistoryService.fetchRepoStarHistory(fname);

    // Remove _id from entries
    const starHistory = (raw ?? []).map((p) => ({
      date: p.date,
      count: p.count,
    }));

    return {
      starHistory,
      _dateOverride: this.getTodayUTC(),
    };
  }

  @Post('star-history')
  @UsePipes(new ZodValidationPipe(BulkStarHistoryBodySchema))
  async getStarHistoryForRepos(
    @Body() body: z.infer<typeof BulkStarHistoryBodySchema>,
  ) {
    const { repoNames } = body;
    this.logger.debug(`POST /repos/star-history - ${repoNames.length} repos`);
    const validRepoNames = this.starHistoryService.validateRepoNames(repoNames);
    const { data } =
      await this.starHistoryService.fetchMultipleRepoStarHistory(
        validRepoNames,
      );
    return data;
  }

  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
  }
}
