import { createCustomerSchema, type CreateCustomerInput, type UpdateCustomerInput, updateCustomerSchema } from "@crewops/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { RequestUser } from "../common/auth/session.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { CsrfGuard } from "../common/guards/csrf.guard";
import { BranchGuard } from "../common/guards/branch.guard";
import { CompanyGuard } from "../common/guards/company.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CustomersService } from "./customers.service";

const listQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), search: z.string().trim().min(1).optional(), status: z.enum(["active", "inactive"]).optional(), branchId: z.string().uuid().optional() });
type ListQuery = z.infer<typeof listQuerySchema>;

@Controller("customers")
@UseGuards(AuthenticatedGuard, CompanyGuard, BranchGuard, RoleGuard)
@Roles("admin", "gestor_operacional", "atendente", "despachante")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Get() list(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) { return this.customers.list(user.companyId, query); }
  @Get(":id") get(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.customers.get(user.companyId, id); }
  @Post() @UseGuards(CsrfGuard) create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(createCustomerSchema)) input: CreateCustomerInput) { return this.customers.create(user.companyId, input); }
  @Patch(":id") @UseGuards(CsrfGuard) update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(updateCustomerSchema)) input: UpdateCustomerInput) { return this.customers.update(user.companyId, id, input); }
  @Delete(":id") @Roles("admin", "gestor_operacional") @UseGuards(CsrfGuard) deactivate(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.customers.deactivate(user.companyId, id); }
}
