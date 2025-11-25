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

      if (
        'error' in exception &&
        exception.error instanceof ZodError &&
        exception.error.issues.length > 0
      ) {
        // ZodValidationException 처리: ZodError에서 첫 번째 에러 메시지 추출
        message = exception.error.issues[0].message;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = exceptionResponse.message as string | string[];
        const messageText = Array.isArray(messages) ? messages[0] : messages;

        // JSON 파싱 에러 체크
        if (
          typeof messageText === 'string' &&
          (messageText.includes('JSON') ||
            messageText.includes('Unexpected end of JSON input'))
        ) {
          message = '잘못된 JSON 형식입니다.';
        } else {
          message = messageText;
        }
      }
    } else if (exception instanceof Error) {
      // 일반 Error는 내부 메시지를 노출하지 않고 사용자 친화적 메시지로 변환
      message = '서버 에러가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    const errorResponse: ApiErrorResponse = {
      ok: false,
      error: message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
