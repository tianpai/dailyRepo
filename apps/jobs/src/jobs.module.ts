import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@dailyrepo/database';
import { AnalysisService } from './analysis.service';
import { AnalysisInputService } from './analysis-input.service';
import { ClusteringService } from './clustering.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || '.env',
    }),
    DatabaseModule,
  ],
  providers: [AnalysisService, AnalysisInputService, ClusteringService],
  exports: [AnalysisService],
})
export class JobsModule {}
