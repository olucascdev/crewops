import type { UserRole } from "@crewops/shared";

/**
 * Shape of the authenticated user attached to `req.user` by `AuthenticatedGuard`.
 * Mirrors the JWT payload plus the user id. `technicianId` is resolved lazily by
 * guards that need it (e.g. technician ownership), not stored in the token.
 */
export type RequestUser = {
  id: string;
  /** `sub` in the JWT payload — equals `id`. */
  companyId: string;
  branchId: string | null;
  role: UserRole;
  sessionId: string;
  email: string;
  name: string;
};

/**
 * Extends Express's `Request` with the authenticated user. Kept here so guards
 * and controllers can reference `req.user` without a global type augmentation.
 */
export type AuthenticatedRequest = {
  user: RequestUser;
} & import("express").Request;
