import { Module } from "@nestjs/common";
import { HealthController } from "../routes/health.controller";
import { OperationsController } from "../routes/operations.controller";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Module({
  controllers: [HealthController, OperationsController],
  providers: [RealtimeGateway]
})
export class AppModule {}
