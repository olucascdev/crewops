import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPool } from "../src/index";
import { checkMigrations } from "../src/migrate-check";
import { readJournalMigrations } from "../src/migration-journal";
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
    expect(status.applied).toBe(status.expected);
    expect(status.issues).toEqual([]);
  });

  it("creates the expected pilot tables", async () => {
    const expected = [
      "companies",
      "branches",
      "users",
      "technicians",
      "customers",
      "service_addresses",
      "tickets",
      "work_orders",
      "dispatches",
      "work_order_events",
      "technician_locations",
      "evidences",
      "files",
      "sessions",
      "sync_receipts",
      "audit_logs",
    ];
    const result = await pool.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)",
      [expected],
    );
    const rows = result.rows.map((r) => r.table_name);
    expect(rows).toEqual(expect.arrayContaining(expected));
  });

  it("rolls back the last migration and drops the pilot tables", async () => {
    const journalMigrations = await readJournalMigrations(MIGRATIONS_DIR);
    const lastTag = journalMigrations[journalMigrations.length - 1]?.tag;

    const before = await checkMigrations(url, MIGRATIONS_DIR);
    expect(before.applied).toBeGreaterThan(0);

    const result = await rollbackLastMigration(url, MIGRATIONS_DIR);
    expect(result.rolledBack).toBe(true);
    if (lastTag) {
      expect(result.migration).toBe(lastTag);
    }

    const after = await checkMigrations(url, MIGRATIONS_DIR);
    expect(after.applied).toBe(before.applied - 1);
    // `migrate:check` (exit code 1) mirrors this false "up to date" state.
    expect(after.upToDate).toBe(false);

    // Re-apply so the test database is left usable for other tests/sessions.
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    const restored = await checkMigrations(url, MIGRATIONS_DIR);
    expect(restored.upToDate).toBe(true);
  });

  it("rejects a tracking table with extra/future rows vs the journal (reviewer reproduction)", async () => {
    const journalMigrations = await readJournalMigrations(MIGRATIONS_DIR);
    const fakeHash = "a".repeat(64);
    await pool.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [fakeHash, Date.now() + 1],
    );
    try {
      const status = await checkMigrations(url, MIGRATIONS_DIR);
      expect(status.upToDate).toBe(false);
      expect(status.applied).toBe(journalMigrations.length + 1);
      expect(status.expected).toBe(journalMigrations.length);
      expect(status.issues.join(" ")).toMatch(/count mismatch/);
    } finally {
      await pool.query("DELETE FROM drizzle.__drizzle_migrations WHERE hash = $1", [fakeHash]);
    }
  });

  it("rejects an unknown applied row that is not in the journal", async () => {
    const unknownHash = "b".repeat(64);
    await pool.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [unknownHash, Date.now() + 1],
    );
    try {
      const status = await checkMigrations(url, MIGRATIONS_DIR);
      expect(status.upToDate).toBe(false);
      expect(status.issues.join(" ")).toMatch(/unknown applied migration row/);
    } finally {
      await pool.query("DELETE FROM drizzle.__drizzle_migrations WHERE hash = $1", [unknownHash]);
    }
  });

  it("selects the matching latest journal migration and deletes its exact tracking row", async () => {
    const journalMigrations = await readJournalMigrations(MIGRATIONS_DIR);
    const lastJournal = journalMigrations[journalMigrations.length - 1];
    const beforeRows = await pool.query<{ id: number; hash: string }>(
      "SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id ASC",
    );
    const lastApplied = beforeRows.rows[beforeRows.rows.length - 1];
    expect(lastApplied.hash).toBe(lastJournal?.hash);

    const beforeCount = beforeRows.rows.length;
    const result = await rollbackLastMigration(url, MIGRATIONS_DIR);
    expect(result.rolledBack).toBe(true);
    expect(result.migration).toBe(lastJournal?.tag);

    const afterRows = await pool.query<{ id: number; hash: string }>(
      "SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id ASC",
    );
    expect(afterRows.rows.length).toBe(beforeCount - 1);
    // The exact tracking row for the latest journal migration was removed.
    expect(afterRows.rows.map((r) => r.id)).not.toContain(lastApplied.id);

    // Leave the database fully applied for other tests/sessions.
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    const restored = await checkMigrations(url, MIGRATIONS_DIR);
    expect(restored.upToDate).toBe(true);
  });

  it("refuses to roll back a history that is ahead of the journal", async () => {
    const fakeHash = "c".repeat(64);
    await pool.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [fakeHash, Date.now() + 1],
    );
    try {
      await expect(rollbackLastMigration(url, MIGRATIONS_DIR)).rejects.toThrow(
        /ahead of the Drizzle journal/,
      );
      // The fake row must still be present (nothing was rolled back).
      const rows = await pool.query<{ hash: string }>(
        "SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = $1",
        [fakeHash],
      );
      expect(rows.rows).toHaveLength(1);
    } finally {
      await pool.query("DELETE FROM drizzle.__drizzle_migrations WHERE hash = $1", [fakeHash]);
    }
  });
});
