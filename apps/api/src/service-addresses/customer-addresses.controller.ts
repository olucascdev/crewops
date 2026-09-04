import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { RequestUser } from "../common/auth/session.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { BranchGuard } from "../common/guards/branch.guard";
import { CompanyGuard } from "../common/guards/company.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { ServiceAddressesService } from "./service-addresses.service";

@Controller("customers")
@UseGuards(AuthenticatedGuard, CompanyGuard, BranchGuard, RoleGuard)
@Roles("admin", "gestor_operacional", "atendente", "despachante")
export class CustomerAddressesController {
  constructor(private readonly addresses: ServiceAddressesService) {}
  @Get(":id/service-addresses") list(@CurrentUser() user: RequestUser, @Param("id") id: string) { return this.addresses.listForCustomer(user.companyId, id); }
}
