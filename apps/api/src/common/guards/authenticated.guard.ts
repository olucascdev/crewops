import * as schema from "@crewops/db";
import type { UserRole } from "@crewops/shared";
import { type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { TokenService } from "../../auth/token.service";
import type { Db } from "../../infra/db";
import { DB_CLIENT } from "../../infra/tokens";
import type { AuthenticatedRequest } from "../auth/session.types";
import { UnauthorizedError } from "../errors/app-error";

/** Minimal JWT payload issued for access tokens. */
export type AccessTokenPayload = {
  sub: string;
  companyId: string;
  branchId: string | null;
  role: UserRole;
  sessionId: string;
  type: "access";
  iat: number;
  exp: number;
};

/**
 * Verifies the `access_token` cookie (HttpOnly, SameSite) and the backing
 * session row (`sessions`), then attaches the `RequestUser` to `req.user`.
 *
 * Every authenticated request validates the JWT AND the persisted session, so a
 * revoked or expired session is rejected immediately even if a token is still
 * within its TTL. Guards run before controller methods; hiding a UI control is
 * never enough — this guard denies when the token/session is invalid.
 *
 * A DB query on every request is accepted for the MVP; `sessions` is indexed.
 */
@Injectable()
export class AuthenticatedGuard {
  constructor(
    @Inject(DB_CLIENT) private readonly db: Db,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token;
    if (!token || typeof token !== "string") {
      throw new UnauthorizedError("sessão necessária");
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("sessão inválida ou expirada");
    }

    if (payload.type !== "access" || !payload.sessionId) {
      throw new UnauthorizedError("token inválido");
    }

    const rows = await this.db
      .select({
        id: schema.sessions.id,
        userId: schema.sessions.userId,
        companyId: schema.sessions.companyId,
        branchId: schema.sessions.branchId,
        role: schema.sessions.role,
      })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, payload.sessionId),
          eq(schema.sessions.companyId, payload.companyId),
          eq(schema.sessions.userId, payload.sub),
          isNull(schema.sessions.revokedAt),
          sql`${schema.sessions.expiresAt} > ${new Date()}`,
        ),
      )
      .limit(1);

    const session = rows[0];
    if (!session) {
      throw new UnauthorizedError("sessão revogada ou expirada");
    }

    const userRows = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        companyId: schema.users.companyId,
        branchId: schema.users.branchId,
        role: schema.users.role,
        status: schema.users.status,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.id, payload.sub),
          eq(schema.users.companyId, payload.companyId),
          eq(schema.users.status, "active"),
          isNull(schema.users.deletedAt),
        ),
      )
      .limit(1);

    const user = userRows[0];
    if (!user) {
      throw new UnauthorizedError("usuário inativo");
    }

    request.user = {
      id: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
      sessionId: session.id,
      email: user.email,
      name: user.name,
    };
    return true;
  }
}
