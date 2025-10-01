import { NestFactory } from '@nestjs/core';
import { ScraperModule } from './scraper/scraper.module';
import { formatDuration } from './common/utils/time.util';
import { RepoDataService } from './scraper/services/repo-data.service';
import { StarHistoryScraperService } from './scraper/services/star-history-scraper.service';

async function runBatchedScrapeJob() {
  const jobStartTime = performance.now();
  const MAX_RUNTIME = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  const isTestMode = process.argv.includes('--test-no-save');

  const timeout = setTimeout(() => {
    console.error('Job exceeded maximum runtime of 4 hours. Terminating...');
    process.exit(1);
  }, MAX_RUNTIME);

  try {
    const app = await NestFactory.createApplicationContext(ScraperModule);
    const repoDataService = app.get(RepoDataService);
    const starHistoryScraperService = app.get(StarHistoryScraperService);

    console.log('\n[1/3] PROCESSING REPOSITORIES');
    const repoStartTime = performance.now();
    const repos = await repoDataService.prepTrendingData();
    console.log(
      `Prepared ${repos.length} repos at ${new Date().toISOString()}`,
    );
    await repoDataService.saveTrendingData(repos);
    repos.forEach((r, i) => {
      console.log(` ${i + 1}. [${r.fullName}]`);
    });
    if (!isTestMode) {
      console.log(
        `\nSaved ${repos.length} repos to database at ${new Date().toISOString()}`,
      );
    }
    console.log(`Step 1 completed in ${formatDuration(repoStartTime)}\n`);

    console.log('[2/3] PROCESSING DEVELOPERS');
    const devStartTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const developers = await repoDataService.prepTrendingDevelopers();
    await repoDataService.saveTrendingDevelopers(developers);
    console.log(`Step 2 completed in ${formatDuration(devStartTime)}\n`);

    console.log('[3/3] PROCESSING STAR HISTORY');
    const starHistoryStartTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const repoNames = repos.map((r) => r.fullName);
    await starHistoryScraperService.processStarHistory(repoNames);
    console.log(
      `Step 3 completed in ${formatDuration(starHistoryStartTime)}\n`,
    );

    await app.close();
    process.exitCode = 0;
  } catch (err) {
    console.log('\n' + '!'.repeat(60));
    console.error(`[ERROR] Job failed at ${new Date().toISOString()}`);
    console.error(err);
    console.log('!'.repeat(60));
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    const totalDuration = formatDuration(jobStartTime);
    const status = process.exitCode === 0 ? 'SUCCESS' : 'FAILED';
    const statusSuffix = isTestMode ? ' (test-no-save)' : '';

    console.log('\n' + '='.repeat(60));
    console.log(`[${new Date().toISOString()}] JOB COMPLETED`);
    console.log(`Total Duration: ${totalDuration}`);
    console.log(`Status: ${status}${statusSuffix}`);
    console.log('='.repeat(60) + '\n');
  }
}

const isTestMode = process.argv.includes('--test-no-save');
const isBatchMode = process.argv.includes('--run-batched');

if (isTestMode || isBatchMode) {
  void runBatchedScrapeJob().finally(() => {
    process.exit(process.exitCode || 0);
  });
} else {
  console.log('Use --run-batched or --test-no-save flag to run the scraper');
  process.exit(1);
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
