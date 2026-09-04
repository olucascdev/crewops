import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthenticatedGuard } from "../common/guards/authenticated.guard";
import { CsrfGuard } from "../common/guards/csrf.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { TechnicianOwnershipGuard } from "../common/guards/technician-ownership.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionRepository } from "./session.repository";
import { TokenService } from "./token.service";
import { TestOwnershipController } from "./test-ownership.controller";

@Module({
  imports: [AuditModule],
  controllers: process.env.NODE_ENV === "production" ? [AuthController] : [AuthController, TestOwnershipController],
  providers: [AuthService, SessionRepository, TokenService, AuthenticatedGuard, CsrfGuard, RoleGuard, TechnicianOwnershipGuard],
  exports: [AuthenticatedGuard, CsrfGuard, RoleGuard, SessionRepository, TokenService],
})
export class AuthModule {}
