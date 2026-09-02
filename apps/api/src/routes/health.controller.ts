import { Controller, Get, Inject, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthService } from "../health/health.service";

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  /**
   * Liveness/readiness endpoint. Returns HTTP 200 for `healthy` and `degraded`,
   * and HTTP 503 for `unhealthy` (database down), so orchestrators and
   * docker-compose healthchecks can distinguish them.
   */
  @Get("/health")
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const snapshot = await this.health.check();
    if (snapshot.status === "unhealthy") {
      res.status(503);
    }
    return snapshot;
  }
}
