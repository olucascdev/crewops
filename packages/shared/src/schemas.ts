import { z } from "zod";

/**
 * Schemas Zod reutilizáveis de `packages/shared`. NÃO referenciam tabelas Drizzle:
 * validam apenas a forma de transporte (payloads de API/offline). São usados por
 * `apps/api`, `apps/web` e PWA para validar entrada antes de persistir.
 */

/** UUID string canonical (v1..v8) — identificador de entidade. */
export const uuidString = z.string().uuid();

/**
 * Timestamp ISO 8601 em UTC com sufixo `Z` explícito. Rejeita datas sem fuso
 * (ex.: `2026-09-01T12:00:00`) ou com offset numérico para garantir transporte
 * e persistência em UTC.
 */
export const utcTimestampString = z.string().datetime({ offset: false });

/** Query de paginação (lista/consulta). Campos opcionais com padrões seguros. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Envelope de sincronização offline (PWA → API). Carrega a chave de idempotência
 * e o horário de ocorrência no dispositivo para permitir replay seguro.
 */
export const syncEnvelope = z.object({
  deviceId: z.string().min(1).max(120),
  idempotencyKey: z.string().min(1).max(120),
  occurredAt: utcTimestampString,
  createdOffline: z.boolean(),
  payload: z.record(z.unknown()),
});

/**
 * Payload semântico de um `work_order_event`. Eventos têm payloads distintos por
 * `event_type`; aqui validamos apenas a forma genérica (objeto JSON) e os
 * schemas específicos por evento vivem nos módulos de domínio.
 */
export const workOrderEventPayload = z.record(z.unknown());

/** Metadados de evidência anexada/assinatura — servem tanto para PWA quanto API. */
export const evidenceMetadata = z.object({
  fileName: z.string().min(1).max(255).optional(),
  mimeType: z.string().min(1).max(120).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  caption: z.string().max(1000).optional(),
  signerName: z.string().max(160).optional(),
  signerRole: z.string().max(80).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;
export type SyncEnvelope = z.infer<typeof syncEnvelope>;
export type WorkOrderEventPayload = z.infer<typeof workOrderEventPayload>;
export type EvidenceMetadata = z.infer<typeof evidenceMetadata>;
