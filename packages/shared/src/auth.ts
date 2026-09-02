import { z } from "zod";
import { userRoles } from "./roles";

/**
 * @crewops/shared — Contratos de autenticação/sessão.
 *
 * Validam a forma de transporte de login, sessão (`/auth/me`), resposta de
 * login (com `redirectTo`) e o token CSRF. Não referenciam tabelas Drizzle.
 */

/** Credenciais de login. `email` é normalizado para lowercase/trim na API. */
export const authLoginSchema = z.object({
  email: z.string().email().max(190),
  // Senha: mínimo 8 caracteres no transporte. A regra de hash/verify é da API.
  password: z.string().min(8).max(200),
});
export type AuthLoginInput = z.infer<typeof authLoginSchema>;

/**
 * Perfil de usuário autenticado (sessão em `req.user` e corpo de `/auth/me`).
 * `branchId` é opcional/nulo quando o usuário não está vinculado a uma filial.
 */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(160),
  email: z.string().email().max(190),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  role: z.enum(userRoles),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/** Corpo de `/auth/me`. */
export const authMeSchema = authUserSchema;
export type AuthMe = z.infer<typeof authMeSchema>;

/**
 * Rota de destino pós-login: painel para perfis administrativos/operacionais,
 * campo para técnico.
 */
export const authRedirectTargets = ["/painel", "/campo"] as const;
export type AuthRedirectTarget = (typeof authRedirectTargets)[number];

/** Resposta de `POST /auth/login`. */
export const authLoginResponseSchema = z.object({
  user: authUserSchema,
  redirectTo: z.enum(authRedirectTargets),
});
export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>;

/** Resposta simples de renovação de sessão. */
export const authRefreshResponseSchema = z.object({
  ok: z.literal(true),
  user: authUserSchema,
});
export type AuthRefreshResponse = z.infer<typeof authRefreshResponseSchema>;

/** Nomes dos cookies de sessão (transportados pelo contrato da API). */
export const SESSION_COOKIES = {
  access: "access_token",
  refresh: "refresh_token",
  csrf: "csrf_token",
} as const;
export type SessionCookieName = (typeof SESSION_COOKIES)[keyof typeof SESSION_COOKIES];
