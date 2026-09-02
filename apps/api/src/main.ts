import "reflect-metadata";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { config as loadDotEnv } from "dotenv";
import { loadConfig } from "./config";
import { AppModule } from "./modules/app.module";

// Load env from the repo root `.env` whether the process runs from `apps/api`
// (npm -w) or from the monorepo root. dotenv is a no-op for a missing file.
loadDotEnv({
  path: [join(process.cwd(), ".env"), join(process.cwd(), "../../.env")],
});

// Fail fast with an actionable message when a required variable is missing.
const config = loadConfig(process.env);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
  });
  await app.listen(config.port);
}

void bootstrap();
