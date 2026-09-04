import { Controller, Get, Inject, NotFoundException, Param, UseGuards } from "@nestjs/common";
import type { ApiConfig } from "../config";
import { API_CONFIG } from "../infra/tokens";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { TechnicianOwnershipGuard } from "../common/guards/technician-ownership.guard";

/** Temporary group-6 proof route; remove when the work-orders module owns it. */
@Controller("internal/test/work-orders")
export class TestOwnershipController {
  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig) {}
  @Get(":id/ownership")
  @UseGuards(AuthenticatedGuard, TechnicianOwnershipGuard)
  ownership(@Param("id") _id: string) {
    if (this.config.env === "production") throw new NotFoundException();
    return { owned: true };
  }
}
