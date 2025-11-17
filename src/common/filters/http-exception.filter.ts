import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export interface ApiErrorResponse {
  ok: boolean;
  error: string;
  data?: null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = exceptionResponse.message as string | string[];
        message = Array.isArray(messages) ? messages[0] : messages;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiErrorResponse = {
      ok: false,
      error: message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
