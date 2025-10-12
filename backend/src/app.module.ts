import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { CacheModule } from './common/cache/cache.module';
import { ReposModule } from './repos/repos.module';
import { DevelopersModule } from './developers/developers.module';
import { LanguagesModule } from './languages/languages.module';
import { CronjobsModule } from './cronjobs/cronjobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 900000, // 15 minutes in milliseconds
        limit: 100, // 100 requests per IP per 15 minutes
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CacheModule,
    ReposModule,
    DevelopersModule,
    LanguagesModule,
    CronjobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
