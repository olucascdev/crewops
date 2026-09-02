import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(dirname, "..");
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// E2E runs against the built Next.js app (`next start`). Run `npm run build`
// first, or point E2E_BASE_URL at a running dev/preview server.
export default defineConfig({
  testDir: "./",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.E2E_WEB_COMMAND ?? "npm run start",
    cwd: webDir,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
