import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { ReposController } from './repos.controller';
import { StarHistoryController } from './star-history.controller';
import { KeywordsController } from './keywords.controller';
import { ReposService } from './repos.service';
import { StarHistoryService } from './star-history.service';
import { KeywordService } from './keyword.service';
import { ClusteringService } from './clustering.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReposController, StarHistoryController, KeywordsController],
  providers: [
    ReposService,
    StarHistoryService,
    KeywordService,
    ClusteringService,
  ],
  exports: [ReposService, StarHistoryService, KeywordService],
})
export class ReposModule implements OnModuleInit {
  private readonly logger = new Logger(ReposModule.name);

  onModuleInit() {
    this.logger.log('ReposModule initialized - 7 endpoints registered');
  }
}
