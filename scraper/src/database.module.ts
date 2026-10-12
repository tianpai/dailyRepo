import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import {
  DeveloperObservation,
  DeveloperObservationSchema,
  readSecret,
  RepoObservation,
  RepoObservationSchema,
  ScrapeDay,
  ScrapeDaySchema,
} from '@dailyrepo/database';

const models = [
  { name: RepoObservation.name, schema: RepoObservationSchema },
  { name: DeveloperObservation.name, schema: DeveloperObservationSchema },
  { name: ScrapeDay.name, schema: ScrapeDaySchema },
];

@Module({})
export class ScraperDatabaseModule {
  static forRoot(testMode: boolean): DynamicModule {
    if (testMode) {
      const providers = models.map(({ name }) => ({
        provide: getModelToken(name),
        useValue: null,
      }));
      return { module: ScraperDatabaseModule, providers, exports: providers };
    }

    return {
      module: ScraperDatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const uri = readSecret(config, 'SCRAPER_MONGODB_URI');
            if (!uri) {
              throw new Error(
                'SCRAPER_MONGODB_URI is required. Point it at the new collection database.',
              );
            }
            return { uri };
          },
        }),
        MongooseModule.forFeature(models),
      ],
      exports: [MongooseModule],
    };
  }
}
