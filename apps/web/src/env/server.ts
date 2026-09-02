import { type AppEnvironment, appEnvironments } from "@crewops/shared";

export type WebEnv = {
  env: AppEnvironment;
  publicApiUrl: string;
  publicWsUrl: string;
};

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[crewops-web] Missing required environment variable "${name}". ` +
        "Set it in your environment or a .env file (see .env.example).",
    );
  }
  return value;
}

/**
 * Validated, server-only environment for the web app. Importing this module
 * throws at build/start if a required variable is absent, so the app fails with
 * a clear message instead of running against `undefined`.
 */
export function loadServerEnv(env: Record<string, string | undefined>): WebEnv {
  const nodeEnv = (env.NODE_ENV ?? "development") as AppEnvironment;
  if (!appEnvironments.includes(nodeEnv)) {
    throw new Error(
      `[crewops-web] Invalid NODE_ENV "${env.NODE_ENV}". Expected one of: ${appEnvironments.join(", ")}.`,
    );
  }

  return {
    env: nodeEnv,
    publicApiUrl: required("NEXT_PUBLIC_API_URL", env.NEXT_PUBLIC_API_URL),
    publicWsUrl: required("NEXT_PUBLIC_WS_URL", env.NEXT_PUBLIC_WS_URL)
  };
}
