import * as schema from "@crewops/db";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

export type AuditResource = "auth" | "user" | "technician" | "branch" | "company" | "work_order";

export type AuditAction =
  | "login"
  | "logout"
  | "refresh"
  | "denied"
  | "create"
  | "update"
  | "deactivate"
  | "role_change";

export type AuditEntry = {
  companyId: string;
  actorUserId: string | null;
  targetUserId?: string | null;
  resource: AuditResource;
  action: AuditAction;
  resourceId?: string | null;
  payload?: Record<string, unknown>;
  ipHash?: string | null;
  userAgent?: string | null;
  occurredAt?: Date;
};

/** Sensitive keys redacted before an entry is persisted. Never log credentials. */
const REDACTED_KEYS = new Set(["password", "passwordHash", "refreshToken", "token", "accessToken"]);

/**
 * Writes security/administrative audit records to `audit_logs`.
 *
 * `write` accepts an optional Drizzle transaction handle so the audit row lands
 * in the *same transaction* as the domain write. When no handle is passed, it
 * falls back to the injected client. Audit is a side-effect: a failure is
 * logged and swallowed (it must not break the domain response), but the caller
 * supplies `occurredAt`/context so nothing needed for the record is lost.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async write(entry: AuditEntry, client: Db = this.db): Promise<void> {
    const payload = this.redact(entry.payload);
    try {
      await client.insert(schema.auditLogs).values({
        companyId: entry.companyId,
        actorUserId: entry.actorUserId,
        targetUserId: entry.targetUserId ?? entry.actorUserId,
        resource: entry.resource,
        action: entry.action,
        resourceId: entry.resourceId ?? null,
        payload: payload ?? {},
        ipHash: entry.ipHash ?? null,
        userAgent: entry.userAgent ?? null,
        occurredAt: entry.occurredAt ?? new Date(),
      });
    } catch (error) {
      this.logger.error(
        `audit write failed: ${resourceAction(entry)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private redact(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!payload) {
      return undefined;
    }
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (REDACTED_KEYS.has(key)) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
}

function resourceAction(entry: AuditEntry): string {
  return `${entry.resource}.${entry.action}`;
}
