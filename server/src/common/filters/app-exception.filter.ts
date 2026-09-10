import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidStateTransitionException } from '../../domain/state-machine/submission-state-machine.js';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error occurred.';
    let errorType = 'InternalServerError';

    let extraFields: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || res;
        const { statusCode: _, error: __, message: ___, ...rest } = res as any;
        extraFields = rest;
      } else {
        message = res;
      }
      errorType = exception.name;
    } else if (exception instanceof InvalidStateTransitionException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;
      errorType = 'InvalidStateTransitionException';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.name;
    }

    this.logger.error(
      `[${errorType}] Status ${status}: ${typeof message === 'object' ? JSON.stringify(message) : message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      ...extraFields,
    });
  }
}

