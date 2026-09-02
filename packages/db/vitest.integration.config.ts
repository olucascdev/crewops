import { defineConfig } from "vitest/config";

// Integration tests require a reachable PostgreSQL/PostGIS and Redis. They are
// skipped automatically when the services are unreachable (see the spec files).
// Runs in a single fork so it can create/drop its own isolated test database.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.integration.spec.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
