import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ReposController } from './controllers/repos.controller';
import { StarHistoryController } from './controllers/star-history.controller';
import { KeywordsController } from './controllers/keywords.controller';
import { ReposService } from './services/repos.service';
import { StarHistoryService } from './services/star-history.service';
import { KeywordService } from './services/keyword.service';
import { ClusteringService } from './services/clustering.service';

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
