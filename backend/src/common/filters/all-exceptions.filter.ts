import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: unknown;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request?.url ?? '';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      let message: unknown;
      if (typeof raw === 'string') {
        message = raw;
      } else if (raw && typeof raw === 'object') {
        const obj = raw as { message?: unknown };
        message = obj.message ?? exception.message;
      } else {
        message = exception.message;
      }

      const body: ErrorResponseBody = {
        statusCode: status,
        message,
        timestamp,
        path,
      };
      response.status(status).json(body);
      return;
    }

    const stack =
      exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(
      `Unhandled exception while processing ${request?.method ?? 'UNKNOWN'} ${path}`,
      stack,
    );

    const body: ErrorResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp,
      path,
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
