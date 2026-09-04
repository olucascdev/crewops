import { describe, expect, it } from "vitest";
import { authLoginSchema } from "@crewops/shared";
import { TokenService } from "../src/auth/token.service";
import { ZodValidationPipe } from "../src/common/pipes/zod-validation.pipe";
import { ValidationError } from "../src/common/errors/app-error";
import { hashPassword, verifyPassword } from "../src/common/utils/password";

const config = { env: "test" as const, port: 4000, databaseUrl: "postgres://test", redisUrl: "redis://test", redisPrefix: "test", webOrigin: [], jwtSecret: "unit-secret", jwtExpiresIn: 900, queueNames: [] };

describe("identity primitives", () => {
  it("hashes and verifies passwords", async () => { const hash = await hashPassword("correct horse battery"); await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true); await expect(verifyPassword("wrong password", hash)).resolves.toBe(false); });
  it("signs and validates an access token", async () => { const tokens = new TokenService(config); const token = await tokens.signAccessToken({ sub: "00000000-0000-4000-8000-000000000001", companyId: "00000000-0000-4000-8000-000000000002", branchId: null, role: "admin", sessionId: "00000000-0000-4000-8000-000000000003" }); await expect(tokens.verifyAccessToken(token)).resolves.toMatchObject({ role: "admin", type: "access" }); await expect(tokens.verifyAccessToken(`${token}x`)).rejects.toThrow(); });
  it("rejects invalid login DTOs with a stable error", () => { const pipe = new ZodValidationPipe(authLoginSchema); expect(() => pipe.transform({ email: "invalid", password: "x" }, {} as never)).toThrow(ValidationError); });
});
