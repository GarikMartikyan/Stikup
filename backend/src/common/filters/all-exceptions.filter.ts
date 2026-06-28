import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

import { AdminAlertService } from '../../admin/admin-alert.service';

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

function firstLine(text: string | undefined): string {
  if (!text) return '';
  return text.split('\n')[0]?.trim() ?? '';
}

// Collapse the alert dedupe key to the matched route pattern (e.g. "/packs/:id")
// instead of the raw URL. Otherwise a parameterised route or a query string
// would mint a fresh dedupe key per request — each with its own cooldown —
// letting a single erroring endpoint bypass the rate limit and flood the admin.
function dedupePath(request: Request | undefined): string {
  const route = (request as { route?: { path?: string } } | undefined)?.route;
  if (route?.path) return route.path;
  return (request?.url ?? '').split('?')[0];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly alert?: AdminAlertService) {}

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
      const name =
        exception instanceof Error ? exception.constructor.name : 'Error';
      const line = firstLine(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception),
      );
      void this.alert?.alert(
        `Unhandled exception (${host.getType()}): ${line}`,
        { dedupeKey: name + ':' + line, cooldownMs: 5 * 60 * 1000 },
      );
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const path = request?.url ?? '';
    const method = request?.method ?? 'UNKNOWN';

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

      if (status >= 500) {
        const line = firstLine(exception.stack ?? exception.message);
        void this.alert?.alert(`${status} on ${method} ${path}: ${line}`, {
          dedupeKey: method + ' ' + dedupePath(request),
          cooldownMs: 5 * 60 * 1000,
        });
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
      this.logger.warn(`Prisma ${exception.code} on ${method} ${path}`);
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
      `Unhandled exception while processing ${method} ${path}`,
      stack,
    );

    const line = firstLine(stack);
    void this.alert?.alert(`500 on ${method} ${path}: ${line}`, {
      dedupeKey: method + ' ' + dedupePath(request),
      cooldownMs: 5 * 60 * 1000,
    });

    const body: ErrorResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp,
      path,
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
