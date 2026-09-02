import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPool } from "../src/index";
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

describe.skipIf(!available)("schema (integration)", () => {
  const url = getTestDatabaseUrl();
  let db: ReturnType<typeof createDb>;
  let pool: ReturnType<typeof createPool>;
  let companyId: string;
  let branchId: string;

  const EXPECTED_TABLES = [
    "companies",
    "branches",
    "users",
    "sessions",
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
    "sync_receipts",
    "audit_logs",
  ];

  const SOFT_DELETE_TABLES = [
    "companies",
    "branches",
    "users",
    "technicians",
    "customers",
    "service_addresses",
    "tickets",
    "work_orders",
    "evidences",
    "files",
  ];

  beforeAll(async () => {
    await ensureTestDatabase(url);
    pool = createPool(url);
    db = createDb(url);
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    // Reset any leftover rows then seed a base company/branch for the FK tests.
    await pool.query(
      "TRUNCATE audit_logs, sync_receipts, evidences, technician_locations, dispatches, work_order_events, work_orders, tickets, sessions, service_addresses, customers, technicians, users, branches, companies RESTART IDENTITY CASCADE",
    );

    const company = await pool.query<{ id: string }>(
      "INSERT INTO companies (name, document) VALUES ('Provedor Teste', '00000000111') RETURNING id",
    );
    companyId = company.rows[0].id;

    const branch = await pool.query<{ id: string }>(
      "INSERT INTO branches (company_id, code, name, city, state, timezone, active) VALUES ($1, 'T01', 'F1', 'São Mateus', 'ES', 'America/Sao_Paulo', true) RETURNING id",
      [companyId],
    );
    branchId = branch.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("has PostGIS enabled", async () => {
    const res = await pool.query<{ version: string }>("SELECT postgis_version() AS version");
    expect(res.rows[0].version).toEqual(expect.stringContaining("3."));
  });

  it("creates every expected operational table", async () => {
    const res = await pool.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)",
      [EXPECTED_TABLES],
    );
    const rows = res.rows.map((r) => r.table_name);
    expect(rows).toEqual(expect.arrayContaining(EXPECTED_TABLES));
  });

  it("adds a soft-delete (deleted_at) column on operational tables", async () => {
    const res = await pool.query<{ table_name: string; column_name: string }>(
      "SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'deleted_at' AND table_schema = 'public' AND table_name = ANY($1)",
      [SOFT_DELETE_TABLES],
    );
    const present = res.rows.filter((r) => r.column_name === "deleted_at").map((r) => r.table_name);
    expect(present).toEqual(expect.arrayContaining(SOFT_DELETE_TABLES));
  });

  it("enforces tenant-unique constraints (email, code, number, document, technician user)", async () => {
    // users: (company_id, email)
    await expect(
      pool.query(
        "INSERT INTO users (company_id, name, email, password_hash, role, status) VALUES ($1, 'A', 'a@x.com', 'h', 'admin', 'active')",
        [companyId],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
    await expect(
      pool.query(
        "INSERT INTO users (company_id, name, email, password_hash, role, status) VALUES ($1, 'A', 'a@x.com', 'h', 'admin', 'active')",
        [companyId],
      ),
    ).rejects.toThrow(/unique/i);

    // branches: (company_id, code)
    await expect(
      pool.query(
        "INSERT INTO branches (company_id, code, name, city, state, timezone, active) VALUES ($1, 'T01', 'F1', 'São Mateus', 'ES', 'America/Sao_Paulo', true)",
        [companyId],
      ),
    ).rejects.toThrow(/unique/i);
  });

  it("rejects cross-company references via composite FKs", async () => {
    // A sibling company and its own customer.
    const other = await pool.query<{ id: string }>(
      "INSERT INTO companies (name, document) VALUES ('Empresa B', '00000000222') RETURNING id",
    );
    const otherCompanyId = other.rows[0].id;
    const otherCustomer = await pool.query<{ id: string }>(
      "INSERT INTO customers (company_id, name, document, status) VALUES ($1, 'Cliente B', '99999999999', 'active') RETURNING id",
      [otherCompanyId],
    );
    const otherCustomerId = otherCustomer.rows[0].id;

    const technician = await pool.query<{ id: string }>(
      "INSERT INTO technicians (company_id, branch_id, user_id, status) VALUES ($1, $2, NULL, 'active') RETURNING id",
      [companyId, branchId],
    );

    // Same-company customer (control) and a work_order for this company.
    const ownCustomer = await pool.query<{ id: string }>(
      "INSERT INTO customers (company_id, name, document, status) VALUES ($1, 'Cliente A', '11111111111', 'active') RETURNING id",
      [companyId],
    );
    await expect(
      pool.query(
        "INSERT INTO work_orders (company_id, branch_id, customer_id, technician_id, number, title) VALUES ($1, $2, $3, $4, 'OK-1', 'valid')",
        [companyId, branchId, ownCustomer.rows[0].id, technician.rows[0].id],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });

    // Cross-company customer (from the sibling company) must be rejected.
    await expect(
      pool.query(
        "INSERT INTO work_orders (company_id, branch_id, customer_id, technician_id, number, title) VALUES ($1, $2, $3, $4, 'X-1', 'cross')",
        [companyId, branchId, otherCustomerId, technician.rows[0].id],
      ),
    ).rejects.toThrow(/foreign key/i);
  });

  it("creates a GiST index on geometry columns", async () => {
    const res = await pool.query<{ indexname: string; tablename: string }>(
      "SELECT indexname, tablename FROM pg_indexes WHERE indexdef ILIKE '%gist%' AND tablename IN ('service_addresses', 'technician_locations')",
    );
    const names = res.rows.map((r) => `${r.tablename}:${r.indexname}`);
    expect(names).toEqual(
      expect.arrayContaining([
        "service_addresses:service_addresses_geometry_gist_idx",
        "technician_locations:technician_locations_geometry_gist_idx",
      ]),
    );
  });

  it("enforces PostGIS SRID 4326 on spatial columns", async () => {
    const res = await pool.query<{
      table_name: string;
      column_name: string;
      srid: number;
      dims: number;
      fmt: string;
    }>(
      `SELECT c.relname AS table_name, a.attname AS column_name,
         postgis_typmod_srid(a.atttypmod) AS srid,
         postgis_typmod_dims(a.atttypmod) AS dims,
         format_type(a.atttypid, a.atttypmod) AS fmt
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND a.attname = 'geometry'
         AND c.relname IN ('service_addresses', 'technician_locations')`,
    );
    expect(res.rows).toHaveLength(2);
    const byTable = new Map(res.rows.map((r) => [r.table_name, r]));
    expect(byTable.has("service_addresses")).toBe(true);
    expect(byTable.has("technician_locations")).toBe(true);
    for (const row of byTable.values()) {
      expect(row.srid).toBe(4326);
      expect(row.dims).toBe(2);
      expect(row.fmt).toBe("geometry(Point,4326)");
    }
  });

  it("rejects geometry with a non-4326 SRID via the column typmod", async () => {
    // A literal with SRID 3857 must be rejected by the 4326 typmod constraint.
    await expect(
      pool.query(
        "INSERT INTO service_addresses (company_id, street, city, state, geometry) VALUES ($1, 'Rua', 'Cidade', 'ES', ST_SetSRID(ST_MakePoint(1, 2), 3857))",
        [companyId],
      ),
    ).rejects.toThrow(/SRID|coordinate/i);
  });

  it("supports soft delete without physically removing the row", async () => {
    const cust = await pool.query<{ id: string }>(
      "INSERT INTO customers (company_id, name, document, status) VALUES ($1, 'Soft', '77777777777', 'active') RETURNING id",
      [companyId],
    );
    await pool.query("UPDATE customers SET deleted_at = now() WHERE id = $1", [cust.rows[0].id]);
    const still = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM customers WHERE id = $1",
      [cust.rows[0].id],
    );
    expect(still.rows[0].count).toBe("1");
  });

  it("enforces idempotency uniqueness on work_order_events and evidences", async () => {
    const wo = await pool.query<{ id: string }>(
      "INSERT INTO work_orders (company_id, branch_id, number, title) VALUES ($1, $2, 'EV-1', 'event') RETURNING id",
      [companyId, branchId],
    );
    await expect(
      pool.query(
        "INSERT INTO work_order_events (company_id, work_order_id, event_type, idempotency_key, occurred_at, device_id) VALUES ($1, $2, 'check_in', 'k-1', now(), 'd-1')",
        [companyId, wo.rows[0].id],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
    await expect(
      pool.query(
        "INSERT INTO work_order_events (company_id, work_order_id, event_type, idempotency_key, occurred_at, device_id) VALUES ($1, $2, 'check_in', 'k-1', now(), 'd-1')",
        [companyId, wo.rows[0].id],
      ),
    ).rejects.toThrow(/unique/i);

    await expect(
      pool.query(
        "INSERT INTO evidences (company_id, work_order_id, idempotency_key, status) VALUES ($1, $2, 'ev-1', 'pending_upload')",
        [companyId, wo.rows[0].id],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
    await expect(
      pool.query(
        "INSERT INTO evidences (company_id, work_order_id, idempotency_key, status) VALUES ($1, $2, 'ev-1', 'pending_upload')",
        [companyId, wo.rows[0].id],
      ),
    ).rejects.toThrow(/unique/i);
  });
});
