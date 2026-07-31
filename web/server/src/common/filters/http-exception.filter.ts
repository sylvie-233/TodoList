import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = typeof r.message === 'string' ? r.message : 'Request failed';
        errors = Array.isArray(r.message) ? r.message : undefined;
      } else {
        message = String(res);
      }

      // 4xx 用 warn，5xx 用 error
      if (status >= 500) {
        this.logger.error(`[${status}] ${request.method} ${request.url}`, {
          message,
          stack: (exception as Error).stack,
        });
      } else {
        this.logger.warn(`[${status}] ${request.method} ${request.url}`, { message });
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, {
        error: String(exception),
        stack: (exception as Error).stack,
      });
    }

    response.status(status).json({
      code: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
