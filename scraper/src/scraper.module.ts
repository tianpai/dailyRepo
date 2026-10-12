import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperDatabaseModule } from './database.module';
import { RepoScrapingService } from './services/repo-scraping.service';
import { RepoDataService } from './services/repo-data.service';
import { ScraperConfigService } from './services/scraper-config.service';

@Module({})
export class ScraperModule {
  static forRoot(testMode = false): DynamicModule {
    return {
      module: ScraperModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.ENV_FILE || '.env',
        }),
        ScraperDatabaseModule.forRoot(testMode),
      ],
      providers: [
        {
          provide: ScraperConfigService,
          useFactory: () => new ScraperConfigService(testMode),
        },
        RepoScrapingService,
        RepoDataService,
      ],
      exports: [RepoDataService, RepoScrapingService, ScraperConfigService],
    };
  }
}
