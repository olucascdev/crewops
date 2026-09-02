import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPool } from "../src/index";
import { seedDatabase } from "../src/seed";
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

describe.skipIf(!available)("seed (integration)", () => {
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

  it("seeds a minimal pilot dataset and returns every entity id", async () => {
    const result = await seedDatabase(db, { reset: true });
    expect(result.companyId).toEqual(expect.any(String));
    expect(result.branchId).toEqual(expect.any(String));
    expect(result.adminUserId).toEqual(expect.any(String));
    expect(result.dispatcherUserId).toEqual(expect.any(String));
    expect(result.technicianUserId).toEqual(expect.any(String));
    expect(result.technicianId).toEqual(expect.any(String));
    expect(result.customerId).toEqual(expect.any(String));
    expect(result.addressId).toEqual(expect.any(String));
  });

  it("refuses to overwrite existing rows without reset", async () => {
    await seedDatabase(db, { reset: true });
    await expect(seedDatabase(db)).rejects.toThrow(/already exist/);
  });

  it("reseeds when reset is passed, clearing prior rows", async () => {
    const first = await seedDatabase(db, { reset: true });
    const second = await seedDatabase(db, { reset: true });
    // A fresh seed creates new ids; if reset did not clear, the second call
    // would have thrown "already exist" instead.
    expect(second.companyId).toEqual(expect.any(String));
    expect(second.companyId).not.toBe(first.companyId);
  });
});
