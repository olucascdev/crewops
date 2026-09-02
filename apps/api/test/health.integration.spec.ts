import { Test } from "@nestjs/testing";
import type { Response } from "express";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HealthService } from "../src/health/health.service";
import { DB_POOL, REDIS_CLIENT } from "../src/infra/tokens";
import { HealthController } from "../src/routes/health.controller";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://crewops:crewops@localhost:5432/crewops_test";
const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://localhost:6379/1";

// The health check only runs `SELECT 1`, so connect to the Postgres maintenance
// database (always present) instead of requiring a test database to be created.
function maintenanceUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

async function reachable(url: string): Promise<boolean> {
  if (url.startsWith("redis://")) {
    const client = new Redis(url, { lazyConnect: true, connectTimeout: 2000 });
    client.on("error", () => {});
    try {
      await client.ping();
      return true;
    } catch {
      return false;
    } finally {
      client.disconnect();
    }
  }
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

const databaseReachable = await reachable(maintenanceUrl(TEST_DATABASE_URL));

/** Minimal Express-style Response stub capturing the status code set by a route. */
function responseStub(): Response & { statusCode: number | undefined } {
  const stub: Record<string, unknown> = {
    statusCode: undefined,
  };
  stub.status = (code: number) => {
    stub.statusCode = code;
    return stub;
  };
  return stub as Response & { statusCode: number | undefined };
}

describe.skipIf(!databaseReachable)("HealthService (integration)", () => {
  const dbUrl = maintenanceUrl(TEST_DATABASE_URL);
  let pool: Pool;
  let redis: Redis;

  beforeAll(async () => {
    process.env.DATABASE_URL = dbUrl;
    process.env.REDIS_URL = TEST_REDIS_URL;
    process.env.JWT_SECRET = "test-secret";
    pool = new Pool({ connectionString: dbUrl });
    redis = new Redis(TEST_REDIS_URL, { lazyConnect: true });
    redis.on("error", () => {});
    await redis.ping().catch(() => {});
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it("reports process and database as up", async () => {
    const service = new HealthService(pool, redis);
    const snapshot = await service.check();
    expect(snapshot.status).not.toBe("unhealthy");
    expect(snapshot.checks.process.status).toBe("up");
    expect(snapshot.checks.database.status).toBe("up");
    expect(snapshot.service).toBe("crewops-api");
  });

  it("reports degraded while the queues worker is not implemented (redis reflects reachability)", async () => {
    const service = new HealthService(pool, redis);
    const snapshot = await service.check();
    const redisUp = await reachable(TEST_REDIS_URL);
    // Queues are intentionally `degraded` (no BullMQ worker until group 14),
    // so the overall readiness is `degraded`, never `healthy`.
    expect(snapshot.status).toBe("degraded");
    expect(snapshot.checks.queues.status).toBe("degraded");
    if (redisUp) {
      expect(snapshot.checks.redis.status).toBe("up");
    } else {
      expect(snapshot.checks.redis.status).toBe("down");
    }
  });

  it("liveness reports the process as up without probing dependencies", async () => {
    const service = new HealthService(pool, redis);
    const snapshot = await service.live();
    expect(snapshot.status).toBe("healthy");
    expect(snapshot.checks.process.status).toBe("up");
    expect(snapshot.checks.database.status).toBe("up");
  });

  it("serves /health/ready and /health/live via the controller", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DB_POOL, useValue: pool },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();
    const controller = moduleRef.get(HealthController);

    const readyRes = responseStub();
    const ready = await controller.getHealth(readyRes);
    // Readiness is `degraded` (queues worker not implemented) but not unhealthy,
    // so it still returns HTTP 200 with no 503 status set.
    expect(ready.status).toBe("degraded");
    expect(readyRes.statusCode).toBeUndefined();

    const liveRes = responseStub();
    const live = await controller.getLive(liveRes);
    expect(live.status).toBe("healthy");
    expect(liveRes.statusCode).toBeUndefined();

    await moduleRef.close();
  });
});
