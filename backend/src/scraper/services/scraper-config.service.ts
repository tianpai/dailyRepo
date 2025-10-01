import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperConfigService {
  private readonly testMode: boolean;

  constructor() {
    this.testMode = process.argv.includes('--test-no-save');
  }

  isTestMode(): boolean {
    return this.testMode;
  }
}
