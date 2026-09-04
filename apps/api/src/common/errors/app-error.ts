import type { ErrorCode } from "@crewops/shared";
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Structured CrewOps API error that carries a stable `ErrorCode` alongside the
 * HTTP status. Rendered by `HttpExceptionFilter` into the contract envelope
 * `{ error: { code, message, details } }` (API_CONTRACT §5).
 */
export class ApiException extends HttpException {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super({ error: { code, message, details } }, status);
    this.code = code;
  }
}

/** 401 — sessão/token ausente ou inválido. */
export class UnauthorizedError extends ApiException {
  constructor(message = "sessão inválida ou expirada") {
    super("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
  }
}

/** 403 — autenticado mas sem permissão (empresa/filial/perfil/recurso). */
export class ForbiddenError extends ApiException {
  constructor(message = "acesso negado") {
    super("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  }
}

/** 404 — recurso inexistente ou fora do escopo do usuário. */
export class NotFoundError extends ApiException {
  constructor(message = "recurso não encontrado") {
    super("NOT_FOUND", message, HttpStatus.NOT_FOUND);
  }
}

/** 409 — estado atual impede a ação. */
export class ConflictError extends ApiException {
  constructor(message = "conflito de estado") {
    super("CONFLICT", message, HttpStatus.CONFLICT);
  }
}

/** 422 — DTO/campos inválidos. `details` carrega o mapa de campos. */
export class ValidationError extends ApiException {
  constructor(message = "dados inválidos", details?: unknown) {
    super("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

/** 429 — limite de requisição excedido. */
export class RateLimitedError extends ApiException {
  constructor(message = "muitas tentativas; tente novamente mais tarde") {
    super("RATE_LIMITED", message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
