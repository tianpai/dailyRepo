import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KeywordService } from '../repos/services/keyword.service';

@Injectable()
export class CronjobsService {
  private readonly logger = new Logger(CronjobsService.name);

  constructor(private readonly keywordService: KeywordService) {}

  @Cron('0 18 * * *', {
    name: 'daily-keywords',
    timeZone: 'UTC',
  })
  async handleDailyKeywords() {
    this.logger.log('Starting daily keywords job');
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.keywordService.fetchKeywordAnalysis(today, true);
      this.logger.log('Daily keywords job completed successfully');
    } catch (error) {
      this.logger.error('Daily keywords job failed', error);
    }
  }

  @Cron('0 19 * * 1', {
    name: 'weekly-topics',
    timeZone: 'UTC',
  })
  async handleWeeklyTopics() {
    this.logger.log('Starting weekly topics job');
    try {
      await this.keywordService.groupTopicsByLanguage();
      this.logger.log('Weekly topics job completed successfully');
    } catch (error) {
      this.logger.error('Weekly topics job failed', error);
    }
  }
}
