import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ScraperModule } from './scraper.module';
import { formatDuration } from './time.util';
import {
  isCompleteCapture,
  RepoDataService,
} from './services/repo-data.service';

async function runBatchedScrapeJob(testMode: boolean) {
  const jobStartTime = performance.now();
  const timeout = setTimeout(
    () => {
      console.error('Job exceeded maximum runtime of 4 hours. Terminating.');
      process.exit(1);
    },
    4 * 60 * 60 * 1000,
  );
  let app:
    | Awaited<ReturnType<typeof NestFactory.createApplicationContext>>
    | undefined;

  try {
    app = await NestFactory.createApplicationContext(
      ScraperModule.forRoot(testMode),
      { abortOnError: false },
    );
    const service = app.get(RepoDataService);

    console.log('[1/2] PROCESSING REPOSITORIES');
    const repositories = await service.prepTrendingData();
    const result = await service.saveTrendingData(repositories);
    console.log(JSON.stringify(result));

    console.log('[2/2] PROCESSING DEVELOPERS');
    const developers = await service.prepTrendingDevelopers();
    await service.saveTrendingDevelopers(developers);
    console.log(
      `Collected ${developers.items.length}/${developers.expectedCount} developers for ${developers.date}`,
    );

    const complete =
      isCompleteCapture(repositories) && isCompleteCapture(developers);
    if (!complete) {
      console.error(
        'Collection was incomplete. Successful observations were retained; rerun the job to retry.',
      );
    }
    process.exitCode = complete ? 0 : 1;
  } catch {
    // Network/driver error objects can contain credentials in their configuration.
    console.error(
      'Scraper failed. Check the collection configuration and preceding logs.',
    );
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    if (app) await app.close();
    console.log(
      `Job ${process.exitCode === 0 ? 'succeeded' : 'failed'} in ${formatDuration(jobStartTime)}${testMode ? ' (test-no-save)' : ''}`,
    );
  }
}

const args = process.argv.slice(2);
const testMode = args.includes('--test-no-save');
if (args.length === 1 && (testMode || args.includes('--run-batched'))) {
  void runBatchedScrapeJob(testMode).finally(() => {
    process.exit(process.exitCode || 0);
  });
} else if (args.length === 1 && args[0] === '--help') {
  console.log(`Usage:
  --run-batched    Collect and persist daily observations
  --test-no-save   Collect up to three repos/developers without connecting to MongoDB

Saving requires SCRAPER_MONGODB_URI pointing at the new database.
GITHUB_TOKEN authorizes GitHub API requests.
ENV_FILE selects an environment file relative to the scraper directory.`);
} else {
  console.error('Use --run-batched, --test-no-save, or --help.');
  process.exitCode = 1;
}

process.on('unhandledRejection', () => {
  console.error('Unhandled scraper failure.');
  process.exit(1);
});
