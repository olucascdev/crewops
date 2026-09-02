import { join } from "node:path";
import { config as loadDotEnv } from "dotenv";

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

/**
 * Loads `.env` from the current directory (workspace-local) and from two levels
 * up (the monorepo root where the curated `.env.example` → `.env` lives). It is
 * a no-op when the files are absent and never overrides already-set variables.
 * The migration/seed CLI runners call this so `npm run db:migrate:check`,
 * `db:rollback` and `db:seed` read `DATABASE_URL` from the repo root `.env`.
 */
export function loadDbEnv(cwd: string = process.cwd()): void {
  loadDotEnv({ path: [join(cwd, ".env"), join(cwd, "../../.env")] });
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
