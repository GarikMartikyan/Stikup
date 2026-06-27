import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

// Map Prisma known-error codes to safe HTTP statuses + generic client messages
// (never leak the raw DB error). Anything unmapped becomes a generic 400.
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'Resource already exists' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Resource not found' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Invalid reference' },
};

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
    const timestamp = new Date().toISOString();

    // Non-HTTP contexts (e.g. Telegraf RPC) have no HTTP response object.
    // Log and bail out — do not attempt to write a response.
    if (host.getType() !== 'http') {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `Unhandled exception in ${host.getType()} context`,
        stack,
      );
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code] ?? {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid request',
      };
      // Client-driven, expected condition — warn, don't error.
      this.logger.warn(
        `Prisma ${exception.code} on ${request?.method ?? 'UNKNOWN'} ${path}`,
      );
      const body: ErrorResponseBody = {
        statusCode: mapped.status,
        message: mapped.message,
        timestamp,
        path,
      };
      response.status(mapped.status).json(body);
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
