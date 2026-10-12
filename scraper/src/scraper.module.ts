import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@dailyrepo/database';
import { RepoScrapingService } from './services/repo-scraping.service';
import { RepoDataService } from './services/repo-data.service';
import { ScraperConfigService } from './services/scraper-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  providers: [ScraperConfigService, RepoScrapingService, RepoDataService],
  exports: [ScraperConfigService, RepoScrapingService, RepoDataService],
})
export class ScraperModule {}
