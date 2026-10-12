import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '@dailyrepo/database';
import { ReposController } from './repos.controller';
import { StarHistoryController } from './star-history.controller';
import { KeywordsController } from './keywords.controller';
import { ReposService } from './repos.service';
import { StarHistoryService } from './star-history.service';
import { KeywordService } from './keyword.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReposController, StarHistoryController, KeywordsController],
  providers: [ReposService, StarHistoryService, KeywordService],
  exports: [ReposService, StarHistoryService, KeywordService],
})
export class ReposModule implements OnModuleInit {
  private readonly logger = new Logger(ReposModule.name);

  onModuleInit() {
    this.logger.log('ReposModule initialized - 7 endpoints registered');
  }
}
