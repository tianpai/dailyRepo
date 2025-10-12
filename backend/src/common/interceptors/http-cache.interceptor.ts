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
import { Observable, of, tap } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);
  protected cacheManager: Cache;

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
    this.cacheManager = cacheManager;
  }

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, query, params } = request;

    if (method !== 'GET') {
      return undefined;
    }

    const route = context.getHandler().name;
    const controller = context.getClass().name;

    const serializeValue = (v: unknown): string => {
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return JSON.stringify(v);
    };

    const queryString = Object.entries(query ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${serializeValue(v)}`)
      .join('-');

    const paramsString = Object.entries(params ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${serializeValue(v)}`)
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
      tap((response: unknown) => {
        if (this.shouldCache(response)) {
          const ttl = this.getTTL(context);
          void this.cacheManager.set(key, response, ttl).catch((error) => {
            this.logger.error(
              `Failed to cache response for key: ${key}`,
              error,
            );
          });
        }
      }),
    );
  }

  private shouldCache(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      return true;
    }

    if (
      'searchInfo' in response &&
      response.searchInfo &&
      typeof response.searchInfo === 'object' &&
      'resultsFound' in response.searchInfo
    ) {
      const resultsFound = response.searchInfo.resultsFound as
        | number
        | undefined;
      return (resultsFound ?? 0) > 0;
    }

    return true;
  }

  private getTTL(context: ExecutionContext): number {
    const metadata = this.reflector.get<number | undefined>(
      'cache_ttl',
      context.getHandler(),
    );
    return metadata ?? 3600 * 1000;
  }
}
