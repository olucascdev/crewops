import { Module } from "@nestjs/common";
import { loadConfig } from "../config";
import { HealthService } from "../health/health.service";
import { createPool } from "../infra/database";
import { createRedis } from "../infra/redis";
import { DB_POOL, REDIS_CLIENT } from "../infra/tokens";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { HealthController } from "../routes/health.controller";
import { OperationsController } from "../routes/operations.controller";

@Module({
  controllers: [HealthController, OperationsController],
  providers: [
    RealtimeGateway,
    HealthService,
    {
      provide: DB_POOL,
      useFactory: () => createPool(loadConfig(process.env).databaseUrl),
    },
    {
      provide: REDIS_CLIENT,
      useFactory: () => createRedis(loadConfig(process.env).redisUrl),
    },
  ],
})
export class AppModule {}
