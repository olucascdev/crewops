/**
 * @crewops/shared — Contratos compartilhados do CrewOps.
 *
 * Única fonte de constantes/enum nominais, tipos TypeScript e schemas de
 * validação usados por `apps/api`, `apps/web` e o PWA. NÃO importa `drizzle-orm`
 * nem qualquer runtime de banco: é um módulo puro de tipos/constantes.
 *
 * Convenções:
 * - Todos os identificadores são UUID string (`Uuid`).
 * - Datas/horas usam UTC no transporte e no banco (`UtcTimestamp` = ISO 8601 com
 *   sufixo `Z` explícito).
 * - Arrays `as const` são a fonte nominal; os tipos derivados são `typeof` do array.
 */

// ---------------------------------------------------------------------------
// IDs / UUID
// ---------------------------------------------------------------------------

/** Identificador UUID (string) usado por todas as entidades. */
export type Uuid = string;

/** Regex de UUID v1..v8 (sem chaves). Usado por schemas e validações externas. */
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Timestamps UTC
// ---------------------------------------------------------------------------

/** Timestamp ISO 8601 em UTC, com sufixo `Z` explícito (ex.: `2026-09-01T12:00:00.000Z`). */
export type UtcTimestamp = string;

// ---------------------------------------------------------------------------
// Perfis (RBAC) — MVP
// ---------------------------------------------------------------------------
// `userRoles`/`UserRole` movidos para `./roles` e re-exportados abaixo para
// preservar a API pública do pacote. Fonte nominal única em `./roles`.

// ---------------------------------------------------------------------------
// Prioridade
// ---------------------------------------------------------------------------

export const priorities = ["low", "normal", "high", "critical"] as const;
export type Priority = (typeof priorities)[number];

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

export const ticketStatuses = [
  "open",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
  "cancelled",
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

// ---------------------------------------------------------------------------
// Work order
// ---------------------------------------------------------------------------

export const workOrderStatuses = [
  "pending",
  "scheduled",
  "dispatched",
  "in_progress",
  "waiting_evidence",
  "in_validation",
  "waiting_parts",
  "completed",
  "cancelled",
  "rework",
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export const workOrderTypes = ["corrective", "preventive", "installation", "survey"] as const;
export type WorkOrderType = (typeof workOrderTypes)[number];

/** Eventos imutáveis de `work_order_events` — verdade operacional (timeline, auditoria, online/offline). */
export const workOrderEventTypes = [
  "dispatch_created",
  "technician_assigned",
  "technician_reassigned",
  "schedule_changed",
  "unassigned",
  "check_in",
  "service_started",
  "service_finished",
  "status_changed",
  "note_added",
  "evidence_uploaded",
  "waiting_parts",
  "waiting_evidence",
  "in_validation",
  "cancelled",
  "completed",
  "rework_opened",
  "rework_resolved",
  "correction_applied",
  "manual_location_ping",
  "foreground_sync",
] as const;

export type WorkOrderEventType = (typeof workOrderEventTypes)[number];

// ---------------------------------------------------------------------------
// Evidência
// ---------------------------------------------------------------------------

export const evidenceTypes = ["photo", "signature", "attachment"] as const;
export type EvidenceType = (typeof evidenceTypes)[number];

export const evidenceStatuses = ["pending_upload", "uploaded", "failed"] as const;
export type EvidenceStatus = (typeof evidenceStatuses)[number];

// ---------------------------------------------------------------------------
// Técnico — disponibilidade atual (grade semanal adiada)
// ---------------------------------------------------------------------------
// `technicianAvailabilities`/`TechnicianAvailability` movidos para `./roles`.

// ---------------------------------------------------------------------------
// Origem de localização / eventos de GPS
// ---------------------------------------------------------------------------

export const locationEventSources = [
  "pwa_foreground",
  "pwa_manual_ping",
  "web",
  "api",
  "unknown",
] as const;
export type LocationEventSource = (typeof locationEventSources)[number];

// ---------------------------------------------------------------------------
// Sync / idempotência
// ---------------------------------------------------------------------------

export const syncResults = [
  "applied",
  "already_done",
  "rejected",
  "conflict",
  "retry_later",
] as const;
export type SyncResult = (typeof syncResults)[number];

// ---------------------------------------------------------------------------
// Política de GPS (aprovada)
// ---------------------------------------------------------------------------

export const gpsPolicy = {
  mode: "event_based",
  continuousBackgroundTracking: false,
  statement:
    "CrewOps PWA captures operational GPS during explicit technician events and foreground sync; it is not a continuous background tracker.",
} as const;

// ---------------------------------------------------------------------------
// Ambientes
// ---------------------------------------------------------------------------

export const appEnvironments = ["development", "test", "production"] as const;
export type AppEnvironment = (typeof appEnvironments)[number];

// ---------------------------------------------------------------------------
// Códigos de erro estáveis (API_CONTRACT §5)
// ---------------------------------------------------------------------------

export const errorCodes = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INVALID_TRANSITION",
  "VALIDATION_ERROR",
  "IDEMPOTENT_REPLAY",
  "UPLOAD_PENDING",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export * from "./auth";
export * from "./organization";
export * from "./roles";
export * from "./technician";
export * from "./user";
export * from "./customer";
export * from "./service-address";
