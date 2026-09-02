import type { AppEnvironment } from "@crewops/shared";

// NEXT_PUBLIC_* vars are inlined at build time, so this object should only be
// read from code that runs in the client bundle (or code that is safe for both).
export const clientEnv = {
  env: (process.env.NODE_ENV ?? "development") as AppEnvironment,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "",
} as const;

/**
 * Throws with an actionable message if a required public var was not inlined at
 * build time. Intended for the client-side entry point; server validation
 * happens in `serverEnv`.
 */
export function assertClientEnv() {
  const missing: string[] = [];
  if (!clientEnv.apiUrl) {
    missing.push("NEXT_PUBLIC_API_URL");
  }
  if (!clientEnv.wsUrl) {
    missing.push("NEXT_PUBLIC_WS_URL");
  }
  if (missing.length > 0) {
    throw new Error(
      `[crewops-web] Missing required public env var(s): ${missing.join(", ")}. See .env.example.`,
    );
  }
  return clientEnv;
}
