import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DB_POOL, REDIS_CLIENT } from "../src/infra/tokens";
import { AppModule } from "../src/modules/app.module";

describe("AppModule", () => {
  let moduleRef: any;
  beforeAll(async () => {
    process.env.DATABASE_URL = "postgres://crewops:crewops@localhost:5432/crewops_test";
    process.env.REDIS_URL = "redis://localhost:6379/1";
    process.env.JWT_SECRET = "test-secret";
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  afterAll(async () => {
    if (!moduleRef) return;
    await moduleRef.get(DB_POOL).end();
    moduleRef.get(REDIS_CLIENT).disconnect();
    await moduleRef.close();
  });
  it("resolves authentication and organization dependencies", () => expect(moduleRef).toBeDefined());
});
