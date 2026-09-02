import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { HealthService, HealthSnapshot } from "../src/health/health.service";
import { HealthController } from "../src/routes/health.controller";

function unhealthySnapshot(): HealthSnapshot {
  return {
    status: "unhealthy",
    service: "crewops-api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: 1,
    checks: {
      process: { status: "up" },
      database: { status: "down", error: "connection refused" },
      redis: { status: "up" },
      queues: { status: "up" },
    },
  };
}

function healthySnapshot(): HealthSnapshot {
  return {
    status: "healthy",
    service: "crewops-api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: 1,
    checks: {
      process: { status: "up" },
      database: { status: "up", latencyMs: 1 },
      redis: { status: "up", latencyMs: 1 },
      queues: { status: "degraded" },
    },
  };
}

function responseStub(): Response & { statusCode: number | undefined } {
  const stub: Record<string, unknown> = { statusCode: undefined };
  stub.status = (code: number) => {
    stub.statusCode = code;
    return stub;
  };
  return stub as Response & { statusCode: number | undefined };
}

describe("HealthController status mapping", () => {
  it("returns HTTP 503 when readiness is unhealthy (database down)", async () => {
    const service = {
      check: vi.fn().mockResolvedValue(unhealthySnapshot()),
    } as unknown as HealthService;
    const controller = new HealthController(service);
    const res = responseStub();
    const result = await controller.getHealth(res);
    expect(result.status).toBe("unhealthy");
    expect(res.statusCode).toBe(503);
  });

  it("returns HTTP 200 (no 503) when readiness is healthy", async () => {
    const service = {
      check: vi.fn().mockResolvedValue(healthySnapshot()),
    } as unknown as HealthService;
    const controller = new HealthController(service);
    const res = responseStub();
    const result = await controller.getHealth(res);
    expect(result.status).toBe("healthy");
    expect(res.statusCode).toBeUndefined();
  });

  it("returns HTTP 200 for liveness while the process is alive", async () => {
    const service = {
      live: vi.fn().mockResolvedValue(healthySnapshot()),
    } as unknown as HealthService;
    const controller = new HealthController(service);
    const res = responseStub();
    const result = await controller.getLive(res);
    expect(result.status).toBe("healthy");
    expect(res.statusCode).toBeUndefined();
  });
});
