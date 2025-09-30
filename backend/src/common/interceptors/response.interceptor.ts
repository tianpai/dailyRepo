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
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data: T) => {
        let date = new Date().toISOString().split('T')[0];
        let responseData: T = data;

        // Extract _dateOverride if present (used by controllers for custom dates)
        if (data && typeof data === 'object' && '_dateOverride' in data) {
          const dataObj = data as Record<string, unknown>;
          const dateOverride = dataObj._dateOverride;

          if (typeof dateOverride === 'string') {
            date = dateOverride;
          }

          // Remove _dateOverride from response data
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _dateOverride, ...cleanData } = dataObj;
          responseData = cleanData as T;
        }

        return {
          isSuccess: true as const,
          isCached: false,
          date,
          data: responseData,
        };
      }),
    );
  }
}
