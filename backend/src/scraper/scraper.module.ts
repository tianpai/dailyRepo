import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database';
import { RepoScrapingService } from './services/repo-scraping.service';
import { RepoDataService } from './services/repo-data.service';
import { StarHistoryService } from './services/star-history.service';
import { StarHistoryScraperService } from './services/star-history-scraper.service';
import { RateLimitService } from './services/rate-limit.service';
import { ScraperConfigService } from './services/scraper-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  providers: [
    ScraperConfigService,
    RepoScrapingService,
    RepoDataService,
    RateLimitService,
    StarHistoryService,
    StarHistoryScraperService,
  ],
  exports: [
    ScraperConfigService,
    RepoScrapingService,
    RepoDataService,
    RateLimitService,
    StarHistoryService,
    StarHistoryScraperService,
  ],
})
export class ScraperModule {}
