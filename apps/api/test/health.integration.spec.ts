import { Redis } from "ioredis";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HealthService } from "../src/health/health.service";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://crewops:crewops@localhost:5432/crewops";
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

describe.skipIf(!databaseReachable)("HealthService (integration)", () => {
  const dbUrl = maintenanceUrl(TEST_DATABASE_URL);
  let pool: Pool;
  let redis: Redis;

  beforeAll(async () => {
    process.env.DATABASE_URL = dbUrl;
    process.env.REDIS_URL = TEST_REDIS_URL;
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

  it("is healthy when Redis is reachable, degraded otherwise", async () => {
    const service = new HealthService(pool, redis);
    const snapshot = await service.check();
    const redisUp = await reachable(TEST_REDIS_URL);
    if (redisUp) {
      expect(snapshot.status).toBe("healthy");
      expect(snapshot.checks.redis.status).toBe("up");
      expect(snapshot.checks.queues.status).toBe("degraded");
    } else {
      expect(snapshot.status).toBe("degraded");
    }
  });
});
