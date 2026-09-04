import {
  type AuthLoginInput,
  type AuthLoginResponse,
  type AuthRefreshResponse,
  authLoginResponseSchema,
  authLoginSchema,
  authRefreshResponseSchema,
} from "@crewops/shared";

export type { AuthLoginInput, AuthLoginResponse, AuthRefreshResponse };
/**
 * Login/sesção DTOs. The Zod schema (from `@crewops/shared`) is the source of
 * truth for the transport shape; these re-exports keep the module structure
 * explicit while avoiding duplicated rules.
 */
export { authLoginResponseSchema, authLoginSchema, authRefreshResponseSchema };
