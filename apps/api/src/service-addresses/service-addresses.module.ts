import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CustomersModule } from "../customers/customers.module";
import { CustomerAddressesController } from "./customer-addresses.controller";
import { ServiceAddressesController } from "./service-addresses.controller";
import { ServiceAddressesService } from "./service-addresses.service";

@Module({ imports: [AuthModule, CustomersModule], controllers: [ServiceAddressesController, CustomerAddressesController], providers: [ServiceAddressesService], exports: [ServiceAddressesService] })
export class ServiceAddressesModule {}
