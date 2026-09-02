import { type ExecutionContext, Injectable } from "@nestjs/common";
import { ForbiddenError } from "../errors/app-error";
import type { AuthenticatedRequest } from "../auth/session.types";

/**
 * Rejects access to resources that belong to a different company.
 *
 * The user's company is the implicit tenant scope (from the session/guard). If
 * a request body or route param carries an explicit `companyId` that differs
 * from the authenticated user's company, it is denied with `FORBIDDEN` (not
 * `NOT_FOUND`) so the existence of another tenant's record is not leaked.
 *
 * Reads scoped by `:id` are enforced by the repositories, which also return
 * `FORBIDDEN` when the row exists under another company.
 */
@Injectable()
export class CompanyGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenError("usuário não autenticado");
    }

    const candidates: unknown[] = [
      request.params?.companyId,
      request.body?.companyId,
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && candidate !== "") {
        if (candidate !== user.companyId) {
          throw new ForbiddenError("recurso de outra empresa");
        }
      }
    }
    return true;
  }
}
