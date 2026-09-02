import { Inject, Injectable } from "@nestjs/common";
import type { AuthLoginInput, AuthUser, AuthRedirectTarget, UserRole } from "@crewops/shared";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { hashIdentifier } from "../../common/utils/tokens";
import { verifyPassword } from "../../common/utils/password";
import { RateLimitedError, UnauthorizedError } from "../../common/errors/app-error";
import { AuditService } from "../audit/audit.service";
import { SessionRepository } from "./session.repository";
import { TokenService } from "./token.service";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const REFRESH_TTL_MS = SESSION_TTL_MS;

export type LoginSuccess = {
  user: AuthUser;
  redirectTo: AuthRedirectTarget;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

export type RefreshSuccess = {
  user: AuthUser;
  accessToken: string;
};

/**
 * Credentials/session orchestration: login, refresh (renew + validate), logout
 * (revoke) and the current profile. Desugars HTTP concerns (cookies/CSRF) to
 * the controller; this service only deals with tokens, sessions and users.
 */
@Injectable()
export class AuthService {
  private readonly loginLimiter: RateLimiterMemory;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {
    // 5 tentativas / 15 min por IP (plan 6.1). Memory store is per-process: the
    // MVP runs a single API; a distributed limiter is a follow-up.
    this.loginLimiter = new RateLimiterMemory({ points: 5, duration: 900 });
  }

  async login(input: AuthLoginInput, meta: { ip: string; userAgent?: string }): Promise<LoginSuccess> {
    await this.consumeLogin(meta.ip);

    const email = input.email.trim().toLowerCase();
    const candidates = await this.sessions.findUserForLogin(email);
    const active = candidates.filter((candidate) => candidate.status === "active");

    if (active.length !== 1) {
      // Generic error — never reveals whether the email exists or the status.
      await this.audit.write({
        companyId: candidates[0]?.companyId ?? "00000000-0000-0000-0000-000000000000",
        actorUserId: candidates[0]?.id ?? null,
        resource: "auth",
        action: "denied",
        payload: { reason: "invalid_credentials", email },
        ipHash: this.hash(meta.ip),
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError("credenciais inválidas");
    }

    const user = active[0]!;
    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      await this.audit.write({
        companyId: user.companyId,
        actorUserId: user.id,
        resource: "auth",
        action: "denied",
        payload: { reason: "invalid_credentials" },
        ipHash: this.hash(meta.ip),
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError("credenciais inválidas");
    }

    const refreshToken = this.tokens.generateRefreshToken();
    const refreshTokenHash = this.tokens.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.sessions.create({
      userId: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
      refreshTokenHash,
      expiresAt,
      ipHash: this.hash(meta.ip),
      userAgent: meta.userAgent,
    });

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
      sessionId: session.id,
    });

    await this.audit.write({
      companyId: user.companyId,
      actorUserId: user.id,
      resource: "auth",
      action: "login",
      resourceId: session.id,
      ipHash: this.hash(meta.ip),
      userAgent: meta.userAgent,
    });

    return {
      user: this.toAuthUser(user),
      redirectTo: user.role === "tecnico" ? "/campo" : "/painel",
      accessToken,
      refreshToken,
      csrfToken: this.generateCsrfToken(),
    };
  }

  async refresh(rawRefreshToken: string | undefined, meta: { ip: string; userAgent?: string }): Promise<RefreshSuccess> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError("sessão necessária");
    }
    const hash = this.tokens.hashRefreshToken(rawRefreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("sessão revogada ou expirada");
    }

    const user = await this.sessions.findUserForLoginById(session.userId, session.companyId);
    if (!user || user.status !== "active") {
      await this.sessions.revoke(session.id);
      throw new UnauthorizedError("usuário inativo");
    }

    // No rotation this group: extend the refresh window and mint a new access
    // token using the same session id.
    await this.sessions.extendExpiry(session.id, new Date(Date.now() + REFRESH_TTL_MS));
    await this.audit.write({
      companyId: session.companyId,
      actorUserId: session.userId,
      resource: "auth",
      action: "refresh",
      resourceId: session.id,
      ipHash: this.hash(meta.ip),
      userAgent: meta.userAgent,
    });

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
      sessionId: session.id,
    });

    return { user: this.toAuthUser(user), accessToken };
  }

  async logout(rawRefreshToken: string | undefined, meta: { ip: string; userAgent?: string }): Promise<{ ok: true }> {
    if (rawRefreshToken) {
      const hash = this.tokens.hashRefreshToken(rawRefreshToken);
      const session = await this.sessions.findByRefreshTokenHash(hash);
      if (session && !session.revokedAt) {
        await this.sessions.revoke(session.id);
        await this.audit.write({
          companyId: session.companyId,
          actorUserId: session.userId,
          resource: "auth",
          action: "logout",
          resourceId: session.id,
          ipHash: this.hash(meta.ip),
          userAgent: meta.userAgent,
        });
      }
    }
    // Idempotent: a missing/already-revoked session still returns ok.
    return { ok: true };
  }

  generateCsrfToken(): string {
    // Double-submit token is a random high-entropy value mirrored to a cookie;
    // it is stateless (no server-side store).
    return this.tokens.generateRefreshToken();
  }

  private async consumeLogin(ip: string): Promise<void> {
    try {
      await this.loginLimiter.consume(ip);
    } catch {
      throw new RateLimitedError();
    }
  }

  private hash(value: string): string {
    return hashIdentifier(value ?? "unknown");
  }

  private toAuthUser(user: { id: string; name: string; email: string; companyId: string; branchId: string | null; role: UserRole }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
    };
  }
}
