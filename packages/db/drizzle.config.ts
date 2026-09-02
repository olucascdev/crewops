import { defineConfig } from "drizzle-kit";

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
