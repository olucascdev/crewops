import type { UserRole } from "@crewops/shared";
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "crewops:roles";

/**
 * Declares the roles permitted on a controller/handler. Consumed by
 * `RoleGuard`. Omission of a role list means "authenticated only" — it never
 * grants more access, and hiding a UI control is never authorization.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
