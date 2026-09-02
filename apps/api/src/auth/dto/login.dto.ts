import {
  type AuthLoginInput,
  authLoginSchema,
  type AuthLoginResponse,
  authLoginResponseSchema,
  type AuthRefreshResponse,
  authRefreshResponseSchema,
} from "@crewops/shared";

/**
 * Login/sesção DTOs. The Zod schema (from `@crewops/shared`) is the source of
 * truth for the transport shape; these re-exports keep the module structure
 * explicit while avoiding duplicated rules.
 */
export { authLoginSchema, authLoginResponseSchema, authRefreshResponseSchema };
export type { AuthLoginInput, AuthLoginResponse, AuthRefreshResponse };
