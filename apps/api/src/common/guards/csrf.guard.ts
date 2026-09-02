import { type ExecutionContext, Injectable } from "@nestjs/common";
import { ForbiddenError } from "../errors/app-error";
import type { AuthenticatedRequest } from "../auth/session.types";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit cookie CSRF protection for state-changing requests.
 *
 * Every mutating request must carry an `x-csrf-token` header equal to the
 * `csrf_token` cookie. Because the cookie is SameSite=Strict and not HttpOnly,
 * a cross-site page cannot read it, and a state-changing cross-site request
 * would also be blocked by SameSite; this adds the double-submit defence in
 * depth. `GET/HEAD/OPTIONS` are exempt.
 */
@Injectable()
export class CsrfGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const cookieToken = request.cookies?.csrf_token;
    const rawHeader = request.headers["x-csrf-token"];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenError("token CSRF inválido");
    }
    return true;
  }
}
