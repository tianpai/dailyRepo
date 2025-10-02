import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, params } = request;

    if (method !== 'GET') {
      return undefined;
    }

    const route = context.getHandler().name;
    const controller = context.getClass().name;

    const queryString = Object.entries(query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('-');

    const paramsString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('-');

    const parts = [controller, route];
    if (paramsString) parts.push(paramsString);
    if (queryString) parts.push(queryString);

    return parts.join(':');
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const key = this.trackBy(context);

    if (!key) {
      return next.handle();
    }

    const cachedValue = await this.cacheManager.get(key);

    if (cachedValue) {
      return of({ ...cachedValue, _cacheHit: true });
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (this.shouldCache(response)) {
          const ttl = this.getTTL(context);
          await this.cacheManager.set(key, response, ttl);
        }
      }),
    );
  }

  private shouldCache(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return true;
    }

    if ('searchInfo' in response) {
      return (response.searchInfo?.resultsFound ?? 0) > 0;
    }

    return true;
  }

  private getTTL(context: ExecutionContext): number {
    const metadata = this.reflector.get('cache_ttl', context.getHandler());
    return metadata ?? 3600 * 1000;
  }
}
