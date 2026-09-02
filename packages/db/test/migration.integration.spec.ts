import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPool } from "../src/index";
import { checkMigrations } from "../src/migrate-check";
import { rollbackLastMigration } from "../src/rollback";
import { ensureTestDatabase, getTestDatabaseUrl } from "../src/test/setup";

const { Pool } = pg;

const MIGRATIONS_DIR = path.resolve(process.cwd(), "drizzle");

async function postgresReachable(): Promise<boolean> {
  const testUrl = getTestDatabaseUrl();
  const maintenance = new URL(testUrl);
  maintenance.pathname = "/postgres";
  const pool = new Pool({ connectionString: maintenance.toString() });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

const available = await postgresReachable();

describe.skipIf(!available)("db migrations (integration)", () => {
  const url = getTestDatabaseUrl();
  let db: ReturnType<typeof createDb>;
  let pool: ReturnType<typeof createPool>;

  beforeAll(async () => {
    await ensureTestDatabase(url);
    pool = createPool(url);
    db = createDb(url);
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("applies the initial migration and reports the DB as up to date", async () => {
    const status = await checkMigrations(url, MIGRATIONS_DIR);
    expect(status.upToDate).toBe(true);
    expect(status.applied).toBeGreaterThanOrEqual(status.expected);
  });

  it("creates the expected pilot tables", async () => {
    const result = await pool.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)",
      [["companies", "branches", "users", "technicians", "customers"]],
    );
    const rows = result.rows.map((r) => r.table_name);
    expect(rows).toEqual(
      expect.arrayContaining(["companies", "branches", "users", "technicians", "customers"]),
    );
  });

  it("rolls back the last migration and drops the pilot tables", async () => {
    const before = await checkMigrations(url, MIGRATIONS_DIR);
    expect(before.applied).toBeGreaterThan(0);

    const result = await rollbackLastMigration(url, MIGRATIONS_DIR);
    expect(result.rolledBack).toBe(true);

    const after = await checkMigrations(url, MIGRATIONS_DIR);
    expect(after.applied).toBe(before.applied - 1);

    // Re-apply so the test database is left usable for other tests/sessions.
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    const restored = await checkMigrations(url, MIGRATIONS_DIR);
    expect(restored.upToDate).toBe(true);
  });
});
