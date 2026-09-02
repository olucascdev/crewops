import { defineConfig } from "vitest/config";

// Integration tests require a reachable PostgreSQL/PostGIS and Redis. They are
// skipped automatically when the services are unreachable (see the spec files).
// `maxWorkers: 1` runs the test files sequentially in a single fork so the
// shared isolated `crewops_test` database is created/used deterministically and
// a successful test never races another file over `CREATE DATABASE`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.integration.spec.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    maxWorkers: 1,
  },
});
