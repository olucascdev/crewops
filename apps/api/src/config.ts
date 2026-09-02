import { type AppEnvironment, appEnvironments } from "@crewops/shared";

export type ApiConfig = {
  env: AppEnvironment;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  redisPrefix: string;
  webOrigin: string[];
  jwtSecret: string;
  jwtExpiresIn: number;
  queueNames: string[];
};

const DEFAULT_PORT = 4000;
const DEFAULT_WEB_ORIGIN = "http://localhost:3000";
const DEFAULT_REDIS_PREFIX = "crewops";
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 86400;

/**
 * Thrown when a required env var is missing. Message lists every missing key so
 * operators and CI fail fast with an actionable message instead of a cryptic
 * crash further down the bootstrap.
 */
export class ConfigError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Set them in your environment or a .env file (see .env.example).",
    );
    this.name = "ConfigError";
    this.missing = missing;
  }
}

function pick(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (value === undefined || value.trim() === "") {
    throw new ConfigError([key]);
  }
  return value;
}

/**
 * Validates and normalises the API configuration. Throws `ConfigError` listing
 * every missing required variable. Never returns partial config.
 */
export function loadConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const requiredKeys = ["DATABASE_URL", "REDIS_URL"];
  const missing = requiredKeys.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new ConfigError(missing);
  }

  const nodeEnv = (env.NODE_ENV ?? "development") as AppEnvironment;
  if (!appEnvironments.includes(nodeEnv)) {
    throw new ConfigError([
      `NODE_ENV (got "${env.NODE_ENV}", expected one of ${appEnvironments.join(", ")})`,
    ]);
  }

  const webOrigin = (env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    env: nodeEnv,
    port: Number(env.PORT ?? DEFAULT_PORT),
    databaseUrl: pick(env, "DATABASE_URL"),
    redisUrl: pick(env, "REDIS_URL"),
    redisPrefix: env.REDIS_PREFIX ?? DEFAULT_REDIS_PREFIX,
    webOrigin,
    // JWT is not consumed until the auth module (group 6). Kept optional so the
    // foundation API boots without an auth secret; validated by group 6.
    jwtSecret: env.JWT_SECRET ?? "",
    jwtExpiresIn: Number(env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN_SECONDS),
    queueNames: ["operations", "offline-sync", "evidence"],
  };
}
