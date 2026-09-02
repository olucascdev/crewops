import { type ErrorCode } from "@crewops/shared";
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiException } from "../errors/app-error";

/**
 * Renders every thrown exception into the stable contract envelope
 * `{ error: { code, message, details } }` (API_CONTRACT §5).
 *
 * - `ApiException` keeps its explicit `code` and `details`.
 * - Raw `HttpException` (built-in Nest/Express) is mapped by HTTP status to the
 *   closest stable `ErrorCode`, so unknown/internal errors never leak an
 *   untranslated payload.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiException) {
      const body = exception.getResponse();
      response.status(exception.getStatus()).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = statusToCode(status);
      const message = exception.message;
      response.status(status).json({ error: { code, message } });
      return;
    }

    const message = "erro interno inesperado";
    // Never expose raw error text or stack to clients; log it server-side.
    // eslint-disable-next-line no-console
    console.error("[api] unhandled exception", exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: "INTERNAL_ERROR", message },
    });
  }
}

function statusToCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "VALIDATION_ERROR";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}
