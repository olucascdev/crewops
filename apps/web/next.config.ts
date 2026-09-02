import { join } from "node:path";
import { config as loadDotEnv } from "dotenv";
import type { NextConfig } from "next";
import { loadServerEnv } from "./src/env/server";

// Next.js auto-loads `.env*` only from the app directory; the curated template
// lives at the monorepo root (`crewops/.env`, copied from `.env.example`). Load
// both the app-dir `.env` and the root `.env` so the root template really drives
// the build/start, mirroring the API and db CLI runners.
loadDotEnv({ path: [join(process.cwd(), ".env"), join(process.cwd(), "../../.env")] });

// Fail fast at build/start when a required public env var is missing instead of
// silently inlining `undefined` into the client bundle. `loadServerEnv` also
// rejects an invalid NODE_ENV. This runs in Node during config loading (tsx/
// jiti transpiles the TS config and its imports).
loadServerEnv(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@crewops/shared"],
};

export default nextConfig;
