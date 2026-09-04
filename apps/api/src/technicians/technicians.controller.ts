import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createTechnicianSchema, type CreateTechnicianInput, type UpdateTechnicianInput, updateTechnicianSchema } from "@crewops/shared";
import type { RequestUser } from "../common/auth/session.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { CsrfGuard } from "../common/guards/csrf.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { TechniciansService } from "./technicians.service";

@Controller("technicians")
@UseGuards(AuthenticatedGuard, RoleGuard)
@Roles("admin")
export class TechniciansController {
  constructor(private readonly technicians: TechniciansService) {}
  @Get() list(@CurrentUser() user: RequestUser) { return this.technicians.list(user.companyId); }
  @Post() @UseGuards(CsrfGuard) create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(createTechnicianSchema)) input: CreateTechnicianInput) { return this.technicians.create(user.companyId, input); }
  @Patch(":id") @UseGuards(CsrfGuard) update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(updateTechnicianSchema)) input: UpdateTechnicianInput) { return this.technicians.update(user.companyId, id, input); }
  @Delete(":id") @UseGuards(CsrfGuard) deactivate(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.technicians.deactivate(user.companyId, id); }
}
