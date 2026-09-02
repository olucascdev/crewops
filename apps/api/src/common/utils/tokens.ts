import { createHash, randomBytes } from "node:crypto";

/**
 * Opaque refresh token utilities. The refresh token is a 256-bit hex string
 * handed to the client; only its SHA-256 hash is persisted, so a leaked token
 * alone is not enough to mint new sessions (and the DB never stores the raw).
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hex digest of the refresh token, used as the lookup/compare key. */
export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** SHA-256 hex digest of an IP/identifier for audit & session scoping. */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
