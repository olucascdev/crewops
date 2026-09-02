import { defineConfig } from "vitest/config";

// Integration tests require reachable PostgreSQL and Redis services. They are
// skipped automatically when the services are unreachable.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.integration.spec.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
