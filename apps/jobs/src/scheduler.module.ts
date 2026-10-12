import { Injectable, Logger, Module } from '@nestjs/common';
import { Cron, ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from './jobs.module';
import { AnalysisService } from './analysis.service';

@Injectable()
class AnalysisScheduler {
  private readonly logger = new Logger(AnalysisScheduler.name);

  constructor(private analysis: AnalysisService) {}

  @Cron('0 18 * * *', { timeZone: 'UTC', waitForCompletion: true })
  async daily() {
    this.logger.log(JSON.stringify(await this.analysis.daily()));
  }

  @Cron('0 19 * * 1', { timeZone: 'UTC', waitForCompletion: true })
  async weekly() {
    this.logger.log(JSON.stringify(await this.analysis.weeklyTopics()));
  }
}

@Module({
  imports: [JobsModule, ScheduleModule.forRoot()],
  providers: [AnalysisScheduler],
})
export class SchedulerModule {}
