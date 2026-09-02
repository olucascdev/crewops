import { Pool } from "pg";

/**
 * Creates a small PostgreSQL pool for health checks and future domain adapters.
 * The pool does not connect eagerly; `pool.query()` establishes the connection
 * lazily so a down database does not crash bootstrap.
 */
export function createPool(databaseUrl: string): Pool {
  return new Pool({ connectionString: databaseUrl, max: 10 });
}
