import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KeywordService } from '../src/repos/keyword.service';
import { getCurrentWeekNumber } from '../src/common/utils/date.util';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  try {
    const keywordService = app.get(KeywordService);
    const { year, week } = getCurrentWeekNumber();
    const force = process.argv.includes('--force');
    console.log(`Computing topics-by-language for ${year}-W${week}...`);
    if (force) {
      console.log('Force recompute enabled.');
    }
    const result = await keywordService.groupTopicsByLanguage({ force });
    const keys = result ? Object.keys(result) : [];
    if (!keys.length) {
      console.log('No topics-by-language data returned.');
    }
    console.log(JSON.stringify(result ?? {}, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Failed to run weekly topics script', error);
  process.exit(1);
});
