import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import type { AccessTokenPayload } from "../common/guards/authenticated.guard";
import { generateRefreshToken, hashRefreshToken } from "../common/utils/tokens";
import type { ApiConfig } from "../config";
import { API_CONFIG } from "../infra/tokens";

/**
 * Signs/verifies HS256 access tokens and manages opaque refresh tokens.
 *
 * Access token payload `{ sub, companyId, branchId, role, sessionId, type }`
 * and a short TTL (15 min) keep the post-revocation window small. The refresh
 * token is a 256-bit hex string; only its SHA-256 hash is persisted.
 */
@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly expiresIn = 15 * 60;

  constructor(@Inject(API_CONFIG) config: ApiConfig) { this.secret = config.jwtSecret; }

  async signAccessToken(input: {
    sub: string;
    companyId: string;
    branchId: string | null;
    role: UserRole;
    sessionId: string;
  }): Promise<string> {
    const payload: Omit<AccessTokenPayload, "iat" | "exp" | "type"> = {
      sub: input.sub,
      companyId: input.companyId,
      branchId: input.branchId,
      role: input.role,
      sessionId: input.sessionId,
    };
    const issuedAt = Math.floor(Date.now() / 1000);
    const complete: AccessTokenPayload = {
      ...payload,
      type: "access",
      iat: issuedAt,
      exp: issuedAt + this.expiresIn,
    };
    const encodedHeader = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const encodedPayload = base64Url(JSON.stringify(complete));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const [header, payload, signature, ...extra] = token.split(".");
    if (!header || !payload || !signature || extra.length > 0) {
      throw new Error("invalid token shape");
    }
    const expected = this.sign(`${header}.${payload}`);
    if (!safeEqual(signature, expected)) {
      throw new Error("invalid token signature");
    }
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AccessTokenPayload;
    if (
      parsed.type !== "access" ||
      !parsed.sub ||
      !parsed.sessionId ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new Error("expired or invalid token");
    }
    return parsed;
  }

  generateRefreshToken(): string {
    return generateRefreshToken();
  }

  hashRefreshToken(raw: string): string {
    return hashRefreshToken(raw);
  }

  private sign(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("base64url");
  }
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
