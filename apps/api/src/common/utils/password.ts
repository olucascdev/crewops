import bcrypt from "bcrypt";

/** bcrypt cost factor used by CrewOps for user passwords. */
export const BCRYPT_COST = 12;

/**
 * Hashes a plaintext password with bcrypt. Throws if the platform bcrypt native
 * module is unavailable; callers may fall back to the scrypt path (see
 * `password-fallback.ts`) when a native build cannot be produced.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Verifies a plaintext password against a stored bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
