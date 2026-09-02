/**
 * Thrown when a required env var (DATABASE_URL) is missing. Used by the
 * migration/seed runners so a missing connection fails with an actionable
 * message instead of a cryptic pool error.
 */
export class DbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}

export function requireDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const url = env.DATABASE_URL;
  if (!url || url.trim() === "") {
    throw new DbConfigError(
      "Missing required environment variable DATABASE_URL. Set it in your " +
        "environment or a .env file (see .env.example).",
    );
  }
  return url;
}

export function requireNodeEnv(env: NodeJS.ProcessEnv): string {
  return env.NODE_ENV ?? "development";
}
