import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccess<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data: T) => {
        let date = new Date().toISOString().split('T')[0];
        let responseData: T = data;
        let isCached = false;

        // Extract internal metadata if present
        if (data && typeof data === 'object') {
          const dataObj = data as Record<string, unknown>;

          // Check for cache hit marker
          if ('_cacheHit' in dataObj) {
            isCached = !!dataObj._cacheHit;
          }

          // Extract _dateOverride if present (used by controllers for custom dates)
          if ('_dateOverride' in dataObj) {
            const dateOverride = dataObj._dateOverride;
            if (typeof dateOverride === 'string') {
              date = dateOverride;
            }
          }

          // Remove internal metadata from response
          if ('_dateOverride' in dataObj || '_cacheHit' in dataObj) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _dateOverride, _cacheHit, ...cleanData } = dataObj;
            responseData = cleanData as T;
          }
        }

        return {
          isSuccess: true as const,
          isCached,
          date,
          data: responseData,
        };
      }),
    );
  }
}
