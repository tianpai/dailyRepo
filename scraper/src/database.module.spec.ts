import { NestFactory } from '@nestjs/core';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import {
  DeveloperObservation,
  RepoObservation,
  ScrapeDay,
} from '@dailyrepo/database';
import { ScraperModule } from './scraper.module';
import { ScraperConfigService } from './services/scraper-config.service';

it('boots test-no-save mode without a MongoDB connection or model initialization', async () => {
  const app = await NestFactory.createApplicationContext(
    ScraperModule.forRoot(true),
    {
      logger: false,
      abortOnError: false,
    },
  );
  try {
    expect(app.get(ScraperConfigService).isTestMode()).toBe(true);
    expect(app.get(getModelToken(RepoObservation.name))).toBeNull();
    expect(app.get(getModelToken(DeveloperObservation.name))).toBeNull();
    expect(app.get(getModelToken(ScrapeDay.name))).toBeNull();
    expect(() => app.get(getConnectionToken())).toThrow();
  } finally {
    await app.close();
  }
});
