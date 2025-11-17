import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

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

      // ZodValidationException 처리: ZodError에서 첫 번째 에러 메시지 추출
      if (
        'error' in exception &&
        exception.error instanceof ZodError &&
        exception.error.issues.length > 0
      ) {
        message = exception.error.issues[0].message;
      } else if (typeof exceptionResponse === 'string') {
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
