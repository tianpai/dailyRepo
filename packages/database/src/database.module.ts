import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { StarHistory, StarHistorySchema } from './schemas/star-history.schema';
import {
  TrendingDeveloper,
  TrendingDeveloperSchema,
} from './schemas/developer.schema';
import { Keywords, KeywordsSchema } from './schemas/keywords.schema';
import {
  WeeklyTopicFindings,
  WeeklyTopicFindingsSchema,
} from './schemas/weekly-topics.schema';
import {
  RepoSnapshot,
  RepoSnapshotSchema,
} from './schemas/repo-snapshot.schema';
import { ScrapeDay, ScrapeDaySchema } from './schemas/scrape-day.schema';
import { readSecret } from './secrets';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri =
          readSecret(configService, 'MONGODB_URI') ||
          readSecret(configService, 'MONGO');
        if (!uri) throw new Error('MONGODB_URI (or MONGO) is required');
        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Repo.name, schema: RepoSchema },
      { name: StarHistory.name, schema: StarHistorySchema },
      { name: TrendingDeveloper.name, schema: TrendingDeveloperSchema },
      { name: Keywords.name, schema: KeywordsSchema },
      { name: WeeklyTopicFindings.name, schema: WeeklyTopicFindingsSchema },
      { name: RepoSnapshot.name, schema: RepoSnapshotSchema },
      { name: ScrapeDay.name, schema: ScrapeDaySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  onModuleInit() {
    this.logger.log('DatabaseModule initialized');
  }
}
