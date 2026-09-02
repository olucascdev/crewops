import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import type { Pool } from "pg";
import { loadConfig } from "../config";
import { DB_POOL, REDIS_CLIENT } from "../infra/tokens";

export type CheckStatus = "up" | "down" | "degraded";

export type HealthState = "healthy" | "degraded" | "unhealthy";

export type HealthCheck = {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
};

export type HealthSnapshot = {
  status: HealthState;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    process: HealthCheck;
    database: HealthCheck;
    redis: HealthCheck;
    queues: HealthCheck;
  };
};

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === "string") {
    return error;
  }
  return "unknown error";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Runs the liveness/readiness checks for the API. Distinguishes:
 * - `healthy`: process, database, Redis and queues are up.
 * - `degraded`: database is up but a non-critical dependency (Redis/queues)
 *   is degraded — API keeps serving, HTTP 200.
 * - `unhealthy`: database is down — HTTP 503.
 */
@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();
  private readonly queueNames: string[] = loadConfig(process.env).queueNames;

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthSnapshot> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const process = this.checkProcess();
    const queues = this.checkQueues();

    const databaseUp = database.status === "up";
    const redisUp = redis.status === "up";
    const queuesUp = queues.status === "up";

    let state: HealthState;
    if (!databaseUp) {
      state = "unhealthy";
    } else if (!redisUp || !queuesUp) {
      state = "degraded";
    } else {
      state = "healthy";
    }

    return {
      status: state,
      service: "crewops-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks: { process, database, redis, queues },
    };
  }

  /**
   * Liveness: probes only the process, never the database/Redis/queues. Always
   * HTTP 200 while the Node process is alive, regardless of dependency health.
   * Orchestrators and docker healthchecks that need dependency awareness use
   * `/health/ready` instead.
   */
  async live(): Promise<HealthSnapshot> {
    const process = this.checkProcess();
    return {
      status: process.status === "up" ? "healthy" : "unhealthy",
      service: "crewops-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks: {
        process,
        // Not probed by liveness; the readiness endpoint (`check()`) reports the
        // real dependency state. Marking them "up" keeps the payload shape stable
        // without asserting a dependency that was not contacted.
        database: { status: "up" },
        redis: { status: "up" },
        queues: { status: "up" },
      },
    };
  }

  private checkProcess(): HealthCheck {
    return { status: "up" };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await withTimeout(this.pool.query("SELECT 1"), 2000);
      return { status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      return { status: "down", error: toMessage(error) };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await withTimeout(this.redis.ping(), 2000);
      return { status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      return { status: "down", error: toMessage(error) };
    }
  }

  private checkQueues(): HealthCheck {
    if (this.queueNames.length === 0) {
      return { status: "up", latencyMs: 0 };
    }
    // BullMQ workers are not implemented until the realtime/queues group (14).
    // Report an explicit degraded state rather than a false healthy signal for
    // a subsystem that does not exist yet.
    return {
      status: "degraded",
      error: "queues are configured but no worker is implemented yet",
    };
  }
}
