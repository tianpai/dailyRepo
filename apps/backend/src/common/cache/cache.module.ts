import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 3600 * 1000, // Default 1 hour (milliseconds)
      max: 200, // Maximum number of items in cache
      maxSize: 500 * 1024 * 1024, // 500MB memory limit
      sizeCalculation: (value: any) => {
        // Estimate size of cached value
        return JSON.stringify(value).length;
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
