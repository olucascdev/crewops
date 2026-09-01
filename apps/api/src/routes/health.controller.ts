import { Controller, Get } from "@nestjs/common";
import { gpsPolicy } from "@crewops/shared";

@Controller()
export class HealthController {
  @Get("/health")
  health() {
    return {
      ok: true,
      service: "crewops-api",
      gpsPolicy
    };
  }
}
