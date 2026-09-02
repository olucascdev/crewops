import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest, RequestUser } from "../auth/session.types";

/**
 * Injects the authenticated `RequestUser` (set by `AuthenticatedGuard`) into a
 * controller handler param: `getProfile(@CurrentUser() user: RequestUser)`.
 * Throws inside the guard chain if no user is attached.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
