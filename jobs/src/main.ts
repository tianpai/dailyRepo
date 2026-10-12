import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs.module';
import { SchedulerModule } from './scheduler.module';
import { AnalysisService } from './analysis.service';
import { HELP, parseCommand } from './cli';
import { JobInputError } from './errors';

async function main() {
  const options = parseCommand(process.argv.slice(2));
  if (options.command === 'help') {
    console.log(HELP);
    return;
  }
  const scheduled = options.command === 'schedule';
  const app = await NestFactory.createApplicationContext(
    scheduled ? SchedulerModule : JobsModule,
  );
  if (scheduled) {
    app.enableShutdownHooks();
    console.log(
      'Analysis scheduler running: daily 18:00 UTC; Monday 19:00 UTC for the previous completed week.',
    );
    return;
  }
  try {
    const service = app.get(AnalysisService);
    const result =
      options.command === 'daily'
        ? await service.daily(options.date, options.force)
        : await service.weeklyTopics(options.weekOf, options.force);
    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  // Driver errors can contain credentials. Known input errors are safe to
  // report and explain exactly which dates need captured data.
  console.error(
    error instanceof JobInputError
      ? error.message
      : 'Analysis job failed. Check the job configuration and service logs.',
  );
  process.exitCode = 1;
});
