import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "@crewops/shared";
import type { AccessTokenPayload } from "../../common/guards/authenticated.guard";
import { generateRefreshToken, hashRefreshToken } from "../../common/utils/tokens";

/**
 * Signs/verifies HS256 access tokens and manages opaque refresh tokens.
 *
 * Access token payload `{ sub, companyId, branchId, role, sessionId, type }`
 * and a short TTL (15 min) keep the post-revocation window small. The refresh
 * token is a 256-bit hex string; only its SHA-256 hash is persisted.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

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
    return this.jwt.signAsync({ ...payload, type: "access" });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  generateRefreshToken(): string {
    return generateRefreshToken();
  }

  hashRefreshToken(raw: string): string {
    return hashRefreshToken(raw);
  }
}
