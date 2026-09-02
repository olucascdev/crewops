import {
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { ForbiddenError } from "../errors/app-error";
import type { AuthenticatedRequest, RequestUser } from "../auth/session.types";

/**
 * Enforces the `@Roles(...)` metadata against the authenticated user's role.
 * A route with no `@Roles` metadata is treated as "any authenticated role".
 * This guard never relies on a UI control: the check is server-side.
 */
@Injectable()
export class RoleGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequestUser["role"][] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenError("perfil necessário");
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenError("perfil incompatível com a ação");
    }
    return true;
  }
}
