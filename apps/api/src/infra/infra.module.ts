import { Global, Module } from "@nestjs/common";
import { loadConfig } from "../config";
import { createPool } from "./database";
import { createDrizzle } from "./db";
import { createRedis } from "./redis";
import { DB_CLIENT, DB_POOL, REDIS_CLIENT } from "./tokens";

/**
 * Global infra wiring. All module repositories/guards inject `DB_CLIENT`
 * (Drizzle) and `DB_POOL`/`REDIS_CLIENT` through the injection tokens defined
 * in `tokens.ts`. Being `@Global`, no module needs to re-provision them.
 *
 * The pool/redis are created lazily so a down dependency does not crash boot.
 * Env is loaded by `main.ts`/test setup before bootstrap; here we read
 * `process.env` for the connection URLs.
 */
@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => createPool(loadConfig(process.env).databaseUrl),
    },
    {
      provide: REDIS_CLIENT,
      useFactory: () => createRedis(loadConfig(process.env).redisUrl),
    },
    {
      provide: DB_CLIENT,
      useFactory: (pool: ReturnType<typeof createPool>) => createDrizzle(pool),
      inject: [DB_POOL],
    },
  ],
  exports: [DB_POOL, REDIS_CLIENT, DB_CLIENT],
})
export class InfraModule {}
