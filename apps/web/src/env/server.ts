import { type AppEnvironment, appEnvironments } from "@crewops/shared";

export type WebEnv = {
  env: AppEnvironment;
  publicApiUrl: string;
  publicWsUrl: string;
};

/**
 * Validated, server-only environment for the web app. Throws a single error
 * listing every missing required variable so the build/start fails fast with an
 * actionable message instead of running against `undefined`. Rejects an
 * unknown NODE_ENV. Called from `next.config.ts` at build/start time.
 */
export function loadServerEnv(env: Record<string, string | undefined>): WebEnv {
  const nodeEnv = (env.NODE_ENV ?? "development") as AppEnvironment;
  if (!appEnvironments.includes(nodeEnv)) {
    throw new Error(
      `[crewops-web] Invalid NODE_ENV "${env.NODE_ENV}". Expected one of: ${appEnvironments.join(", ")}.`,
    );
  }

  const apiUrl = (env.NEXT_PUBLIC_API_URL ?? "").trim();
  const wsUrl = (env.NEXT_PUBLIC_WS_URL ?? "").trim();
  const missing: string[] = [];
  if (!apiUrl) {
    missing.push("NEXT_PUBLIC_API_URL");
  }
  if (!wsUrl) {
    missing.push("NEXT_PUBLIC_WS_URL");
  }
  if (missing.length > 0) {
    throw new Error(
      `[crewops-web] Missing required environment variable(s): ${missing.join(", ")}. ` +
        "See .env.example.",
    );
  }

  return {
    env: nodeEnv,
    publicApiUrl: apiUrl,
    publicWsUrl: wsUrl,
  };
}
