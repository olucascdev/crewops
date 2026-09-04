import {
  type CreateUserInput,
  createUserSchema,
  type UpdateUserInput,
  updateUserSchema,
} from "@crewops/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { RequestUser } from "../common/auth/session.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { CsrfGuard } from "../common/guards/csrf.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(AuthenticatedGuard, RoleGuard)
@Roles("admin")
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() async list(@CurrentUser() user: RequestUser) {
    return this.users.list(user.companyId);
  }
  @Post() @UseGuards(CsrfGuard) async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createUserSchema)) input: CreateUserInput,
  ) {
    return this.users.create(user.companyId, user.id, input);
  }
  @Patch(":id") @UseGuards(CsrfGuard) async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) input: UpdateUserInput,
  ) {
    return this.users.update(user.companyId, user.id, id, input);
  }
  @Delete(":id") @UseGuards(CsrfGuard) deactivate(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.users.deactivate(user.companyId, user.id, id); }
}
