import { join } from "node:path";
import { config as loadDotEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Read DATABASE_URL from the workspace `.env` or the monorepo root `.env`
// (copied from .env.example) so `drizzle-kit migrate` uses the same connection
// as the API and the seed/rollback CLI runners.
loadDotEnv({ path: [join(process.cwd(), ".env"), join(process.cwd(), "../../.env")] });

// Deterministic, non-interactive Drizzle config. Migrations are generated once
// from ./src/schema.ts and applied via `drizzle-kit migrate`; breakpoints are
// disabled so each generated file is a single ordered block (PostgreSQL can run
// multiple DDL statements in one transaction). `extensionsFilters` keeps the
// PostGIS extension out of schema sync so push/introspect never drops it.
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  breakpoints: false,
  verbose: true,
  strict: true,
  extensionsFilters: ["postgis"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://crewops:crewops@localhost:5432/crewops",
  },
});
