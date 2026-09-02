import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";

/**
 * Exposes `AuditService` globally so domain modules can record audit events
 * without each importing its own copy / module wiring.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
