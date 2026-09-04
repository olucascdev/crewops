import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { HealthService } from "../health/health.service";
import { InfraModule } from "../infra/infra.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { HealthController } from "../routes/health.controller";
import { OperationsController } from "../routes/operations.controller";
import { UsersModule } from "../users/users.module";
import { TechniciansModule } from "../technicians/technicians.module";
import { CustomersModule } from "../customers/customers.module";
import { ServiceAddressesModule } from "../service-addresses/service-addresses.module";

@Module({
  imports: [InfraModule, AuditModule, AuthModule, OrganizationsModule, UsersModule, TechniciansModule, CustomersModule, ServiceAddressesModule],
  controllers: [HealthController, OperationsController],
  providers: [RealtimeGateway, HealthService],
})
export class AppModule {}
