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

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || process.env.MONGO,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Repo.name, schema: RepoSchema },
      { name: StarHistory.name, schema: StarHistorySchema },
      { name: TrendingDeveloper.name, schema: TrendingDeveloperSchema },
      { name: Keywords.name, schema: KeywordsSchema },
      { name: WeeklyTopicFindings.name, schema: WeeklyTopicFindingsSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  onModuleInit() {
    this.logger.log('DatabaseModule initialized with 5 schemas');
  }
}
