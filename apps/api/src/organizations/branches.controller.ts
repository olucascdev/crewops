import type { CreateBranchInput, UpdateBranchInput } from "@crewops/shared";
import { createBranchSchema, updateBranchSchema } from "@crewops/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { RequestUser } from "../common/auth/session.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { CsrfGuard } from "../common/guards/csrf.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { BranchesService } from "./branches.service";

@Controller("branches")
@UseGuards(AuthenticatedGuard, RoleGuard)
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.branches.list(user.companyId);
  }

  @Post()
  @Roles("admin")
  @UseGuards(CsrfGuard)
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createBranchSchema)) input: CreateBranchInput,
  ) {
    return this.branches.create(user.companyId, input);
  }

  @Patch(":id")
  @Roles("admin")
  @UseGuards(CsrfGuard)
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBranchSchema)) input: UpdateBranchInput,
  ) {
    return this.branches.update(user.companyId, id, input);
  }
  @Delete(":id") @Roles("admin") @UseGuards(CsrfGuard) deactivate(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.branches.deactivate(user.companyId, id); }
}
