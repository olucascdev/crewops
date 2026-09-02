/**
 * @crewops/shared — Perfis e status nominais de identidade.
 *
 * Fonte nominal única para os enums usados por `auth`, `users` e `technicians`.
 * Não importa `drizzle-orm` nem o runtime de banco: apenas tipos/constantes.
 * `apps/api` e `apps/web` importam destes arrays `as const` (nunca duplicam).
 */

// ---------------------------------------------------------------------------
// Perfis (RBAC) — MVP
// ---------------------------------------------------------------------------

/** Perfis do piloto. `gestor_operacional` e `despachante` podem despachar; `tecnico` via PWA. */
export const userRoles = [
  "admin",
  "gestor_operacional",
  "atendente",
  "despachante",
  "tecnico",
] as const;

export type UserRole = (typeof userRoles)[number];

/** Perfis do painel (não-técnico). */
export const panelRoles: Exclude<UserRole, "tecnico">[] = userRoles.filter(
  (role) => role !== "tecnico",
);
export type PanelRole = (typeof panelRoles)[number];

// ---------------------------------------------------------------------------
// Status de usuário
// ---------------------------------------------------------------------------

export const userStatuses = ["active", "inactive", "blocked"] as const;
export type UserStatus = (typeof userStatuses)[number];

// ---------------------------------------------------------------------------
// Status/Disponibilidade de técnico
// ---------------------------------------------------------------------------

export const technicianStatuses = ["active", "inactive"] as const;
export type TechnicianStatus = (typeof technicianStatuses)[number];

export const technicianAvailabilities = ["available", "busy", "off"] as const;
export type TechnicianAvailability = (typeof technicianAvailabilities)[number];
