import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/config";

describe("loadConfig", () => {
  it("throws a clear ConfigError listing every missing required var", () => {
    let caught: unknown;
    try {
      loadConfig({});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ConfigError);
    const err = caught as ConfigError;
    expect(err.missing).toEqual(["DATABASE_URL", "REDIS_URL", "JWT_SECRET"]);
    expect(err.message).toMatch(/DATABASE_URL/);
    expect(err.message).toMatch(/REDIS_URL/);
    expect(err.message).toMatch(/JWT_SECRET/);
  });

  it("accepts valid config and applies defaults", () => {
    const cfg = loadConfig({
      DATABASE_URL: "postgres://crewops:crewops@localhost:5432/crewops",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test-secret",
    });
    expect(cfg.env).toBe("development");
    expect(cfg.port).toBe(4000);
    expect(cfg.webOrigin).toEqual(["http://localhost:3000"]);
    expect(cfg.queueNames.length).toBeGreaterThan(0);
  });

  it("parses CORS origins and port from env", () => {
    const cfg = loadConfig({
      DATABASE_URL: "postgres://localhost:5432/crewops",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test-secret",
      PORT: "5000",
      WEB_ORIGIN: "http://localhost:3000,https://ops.example.com",
    });
    expect(cfg.port).toBe(5000);
    expect(cfg.webOrigin).toEqual(["http://localhost:3000", "https://ops.example.com"]);
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: "postgres://localhost:5432/crewops",
        REDIS_URL: "redis://localhost:6379",
        JWT_SECRET: "test-secret",
        NODE_ENV: "homologation",
      }),
    ).toThrow(ConfigError);
  });
});
