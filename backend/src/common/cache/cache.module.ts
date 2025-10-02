import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 3600 * 1000, // Default 1 hour (milliseconds)
      max: 1000, // Maximum number of items in cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
