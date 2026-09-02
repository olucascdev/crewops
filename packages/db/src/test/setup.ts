import pg from "pg";

const { Pool } = pg;

/** Isolated test database URL. Defaults to a dedicated `_test` database. */
export function getTestDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.TEST_DATABASE_URL ?? "postgres://crewops:crewops@localhost:5432/crewops_test";
}

/** Isolated test Redis URL. Defaults to logical database 1. */
export function getTestRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.TEST_REDIS_URL ?? "redis://localhost:6379/1";
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Ensures the isolated test database exists by connecting to the `postgres`
 * maintenance database and issuing `CREATE DATABASE` when it is missing. Uses
 * the same credentials as the test URL so a PostGIS-enabled CI service (or the
 * local docker-compose Postgres) can host it.
 */
export async function ensureTestDatabase(testUrl: string): Promise<string> {
  const url = new URL(testUrl);
  const dbName = url.pathname.replace(/^\//, "");
  const maintenance = new URL(testUrl);
  maintenance.pathname = "/postgres";

  const pool = new Pool({ connectionString: maintenance.toString() });
  try {
    const exists = await pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await pool.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
    }
  } finally {
    await pool.end();
  }
  return testUrl;
}
