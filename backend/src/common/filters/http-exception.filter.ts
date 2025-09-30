import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiError } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const date = new Date().toISOString().split('T')[0];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const msgValue = responseObj.message;

        if (typeof msgValue === 'string') {
          message = msgValue;
        } else if (Array.isArray(msgValue)) {
          message = msgValue.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiError = {
      isSuccess: false,
      isCached: false,
      date,
      error: {
        code: status,
        message,
      },
    };

    response.status(status).json(errorResponse);
  }
}
