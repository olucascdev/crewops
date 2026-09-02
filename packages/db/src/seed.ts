import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { requireDatabaseUrl, requireNodeEnv } from "./env";
import * as schema from "./schema";

const { Pool } = pg;

export type SeedOptions = {
  /** When true, deletes all rows before inserting (dev only). */
  reset?: boolean;
};

export type SeedResult = {
  companyId: string;
  branchId: string;
  adminUserId: string;
  dispatcherUserId: string;
  technicianUserId: string;
  technicianId: string;
  customerId: string;
  addressId: string;
};

// Dev-only placeholder, NOT a production secret. The auth module (group 6)
// replaces this with a real password hashing strategy.
const DEV_PASSWORD_HASH = createHash("sha256").update("crewops-dev-password").digest("hex");

const TABLES_TO_CLEAR = [
  "work_order_evidences",
  "files",
  "work_order_events",
  "technician_location_events",
  "work_orders",
  "tickets",
  "customer_addresses",
  "customers",
  "technicians",
  "users",
  "branches",
  "companies",
];

/**
 * Seeds a minimal, synthetic pilot dataset (no FieldOps data). Idempotent in
 * the sense that a second run refuses to overwrite existing rows unless
 * `{ reset: true }` is passed. Never seeds in production (checked by the runner).
 */
export async function seedDatabase(
  db: NodePgDatabase<typeof schema>,
  opts: SeedOptions = {},
): Promise<SeedResult> {
  return db.transaction(async (tx) => {
    if (opts.reset) {
      for (const table of TABLES_TO_CLEAR) {
        await tx.execute(sql.raw(`DELETE FROM ${table}`));
      }
    } else {
      const existing = await tx.select({ id: schema.companies.id }).from(schema.companies).limit(1);
      if (existing.length > 0) {
        throw new Error(
          "seed: companies already exist. Skip seeding or pass { reset: true } to reseed.",
        );
      }
    }

    const company = (
      await tx
        .insert(schema.companies)
        .values({ name: "Provedor Piloto", document: "12345678000199", active: true })
        .returning()
    )[0];
    if (!company) throw new Error("seed: failed to insert company");

    const branch = (
      await tx
        .insert(schema.branches)
        .values({
          companyId: company.id,
          name: "Matriz",
          city: "São Mateus",
          state: "ES",
          active: true,
        })
        .returning()
    )[0];
    if (!branch) throw new Error("seed: failed to insert branch");

    const admin = (
      await tx
        .insert(schema.users)
        .values({
          companyId: company.id,
          branchId: branch.id,
          name: "Administrador Piloto",
          email: "admin@example.com",
          passwordHash: DEV_PASSWORD_HASH,
          role: "owner",
          active: true,
        })
        .returning()
    )[0];
    if (!admin) throw new Error("seed: failed to insert admin user");

    const dispatcher = (
      await tx
        .insert(schema.users)
        .values({
          companyId: company.id,
          branchId: branch.id,
          name: "Despachante Piloto",
          email: "dispatcher@example.com",
          passwordHash: DEV_PASSWORD_HASH,
          role: "dispatcher",
          active: true,
        })
        .returning()
    )[0];
    if (!dispatcher) throw new Error("seed: failed to insert dispatcher user");

    const technicianUser = (
      await tx
        .insert(schema.users)
        .values({
          companyId: company.id,
          branchId: branch.id,
          name: "Técnico Piloto",
          email: "technician@example.com",
          passwordHash: DEV_PASSWORD_HASH,
          role: "technician",
          active: true,
        })
        .returning()
    )[0];
    if (!technicianUser) throw new Error("seed: failed to insert technician user");

    const technician = (
      await tx
        .insert(schema.technicians)
        .values({
          companyId: company.id,
          branchId: branch.id,
          userId: technicianUser.id,
          phone: "27999990000",
          active: true,
        })
        .returning()
    )[0];
    if (!technician) throw new Error("seed: failed to insert technician");

    const customer = (
      await tx
        .insert(schema.customers)
        .values({
          companyId: company.id,
          branchId: branch.id,
          name: "Cliente Piloto",
          document: "12345678901",
          phone: "27999990001",
        })
        .returning()
    )[0];
    if (!customer) throw new Error("seed: failed to insert customer");

    const address = (
      await tx
        .insert(schema.customerAddresses)
        .values({
          customerId: customer.id,
          label: "Principal",
          street: "Av. Central",
          number: "100",
          district: "Centro",
          city: "São Mateus",
          state: "ES",
          latitude: "-18.7165000",
          longitude: "-39.8372000",
        })
        .returning()
    )[0];
    if (!address) throw new Error("seed: failed to insert address");

    return {
      companyId: company.id,
      branchId: branch.id,
      adminUserId: admin.id,
      dispatcherUserId: dispatcher.id,
      technicianUserId: technicianUser.id,
      technicianId: technician.id,
      customerId: customer.id,
      addressId: address.id,
    };
  });
}

async function runCli(): Promise<void> {
  if (requireNodeEnv(process.env) === "production") {
    throw new Error("seed: refused to run in production.");
  }

  const databaseUrl = requireDatabaseUrl(process.env);
  const reset = process.argv.includes("--reset");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    const result = await seedDatabase(db, { reset });
    process.stdout.write(`seeded pilot company ${result.companyId}\n`);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runCli();
}
