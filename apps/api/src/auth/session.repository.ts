import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import * as schema from "@crewops/db";
import { DB_CLIENT } from "../../infra/tokens";
import type { Db } from "../../infra/db";
import type { UserRole } from "@crewops/shared";

export type SessionCreateInput = {
  userId: string;
  companyId: string;
  branchId: string | null;
  role: UserRole;
  refreshTokenHash: string;
  expiresAt: Date;
  deviceId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
};

export type LoginUserCandidate = {
  id: string;
  companyId: string;
  branchId: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: "active" | "inactive" | "blocked";
};

/**
 * Persists and queries `sessions`, and resolves the login subject (user) for a
 * credential. Refresh tokens are only ever compared by their SHA-256 hash; the
 * raw token is never stored.
 */
@Injectable()
export class SessionRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async create(input: SessionCreateInput): Promise<{ id: string }> {
    const rows = await this.db
      .insert(schema.sessions)
      .values({
        userId: input.userId,
        companyId: input.companyId,
        branchId: input.branchId,
        role: input.role,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        deviceId: input.deviceId ?? null,
        ipHash: input.ipHash ?? null,
        userAgent: input.userAgent ?? null,
      })
      .returning({ id: schema.sessions.id });
    const row = rows[0];
    if (!row) {
      throw new Error("session: failed to create session");
    }
    return row;
  }

  /**
   * Finds the login candidate(s) for an email. The user may exist in more than
   * one company (email unique is per `(company_id, email)`); the caller decides
   * whether the multi-match is ambiguous.
   */
  async findUserForLogin(email: string): Promise<LoginUserCandidate[]> {
    const rows = await this.db
      .select({
        id: schema.users.id,
        companyId: schema.users.companyId,
        branchId: schema.users.branchId,
        name: schema.users.name,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        role: schema.users.role,
        status: schema.users.status,
      })
      .from(schema.users)
      .where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)))
      .orderBy(desc(schema.users.createdAt))
      .limit(5);
    return rows as LoginUserCandidate[];
  }

  /** Resolves a single user (for refresh/me lookups) scoped by id + company. */
  async findUserForLoginById(userId: string, companyId: string): Promise<LoginUserCandidate | null> {
    const rows = await this.db
      .select({
        id: schema.users.id,
        companyId: schema.users.companyId,
        branchId: schema.users.branchId,
        name: schema.users.name,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        role: schema.users.role,
        status: schema.users.status,
      })
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), eq(schema.users.companyId, companyId)))
      .limit(1);
    if (!rows[0]) {
      return null;
    }
    return rows[0] as LoginUserCandidate;
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<schema.Session | null> {
    const rows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async findActiveById(id: string): Promise<schema.Session | null> {
    const rows = await this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, id),
          isNull(schema.sessions.revokedAt),
          sql`${schema.sessions.expiresAt} > ${new Date()}`,
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  /** Extends the refresh window on reuse (no rotation this group; see plan). */
  async extendExpiry(id: string, expiresAt: Date): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({ expiresAt })
      .where(eq(schema.sessions.id, id));
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.sessions.id, id), isNull(schema.sessions.revokedAt)));
  }

  /** Revokes every non-revoked session of a user (on deactivation/role change). */
  async revokeForUser(userId: string, companyId: string): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.sessions.userId, userId),
          eq(schema.sessions.companyId, companyId),
          isNull(schema.sessions.revokedAt),
        ),
      );
  }

  /** Cleans up expired sessions; returns the number removed. */
  async cleanupExpired(): Promise<number> {
    const rows = await this.db
      .delete(schema.sessions)
      .where(sql`${schema.sessions.expiresAt} < ${new Date()}`)
      .returning({ id: schema.sessions.id });
    return rows.length;
  }
}
