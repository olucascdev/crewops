import { type ExecutionContext, Injectable } from "@nestjs/common";
import type { UserRole } from "@crewops/shared";
import { ForbiddenError } from "../errors/app-error";
import type { AuthenticatedRequest } from "../auth/session.types";

const GESTOR_READ_ROLES: UserRole[] = ["admin", "gestor_operacional"];

/**
 * Rejects access to a branch that is outside the user's scope.
 *
 * - Writes (POST/PATCH/DELETE) to a specific `branchId`: `admin` only.
 * - Reads (GET) of a specific `branchId`: allowed for the user's own branch OR
 *   for `admin`/`gestor_operacional` (leitura geral).
 *
 * When no `branchId` is present in the request (e.g. list endpoints scoped by
 * the user's company), this guard is a no-op; the repository still filters by
 * company and returns `FORBIDDEN` for rows of another company.
 */
@Injectable()
export class BranchGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenError("usuário não autenticado");
    }

    const branchId = request.params?.branchId ?? request.body?.branchId;
    if (branchId === undefined || branchId === null || branchId === "") {
      return true;
    }
    if (branchId !== user.branchId && !GESTOR_READ_ROLES.includes(user.role)) {
      throw new ForbiddenError("filial fora do escopo");
    }

    const method = request.method?.toUpperCase();
    if (method !== "GET") {
      if (user.role !== "admin") {
        throw new ForbiddenError("somente admin altera filial");
      }
    }
    return true;
  }
}
