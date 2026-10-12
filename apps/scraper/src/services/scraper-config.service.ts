import { Injectable } from '@nestjs/common';
import { getTodayUTC } from '../time.util';

@Injectable()
export class ScraperConfigService {
  constructor(
    private readonly testMode = false,
    private readonly date = getTodayUTC(),
  ) {}

  isTestMode(): boolean {
    return this.testMode;
  }

  getDate(): string {
    return this.date;
  }
}
