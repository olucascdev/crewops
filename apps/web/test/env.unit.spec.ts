import { describe, expect, it, vi } from "vitest";
import { loadServerEnv } from "../src/env/server";

describe("server env validation", () => {
  it("throws with a clear message when a required var is missing", () => {
    expect(() => loadServerEnv({ NODE_ENV: "development" })).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("returns a typed, validated object when required vars are present", () => {
    const env = loadServerEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      NEXT_PUBLIC_WS_URL: "http://localhost:4000",
    });
    expect(env.publicApiUrl).toBe("http://localhost:4000");
    expect(env.publicWsUrl).toBe("http://localhost:4000");
    expect(env.env).toBe("development");
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() =>
      loadServerEnv({
        NODE_ENV: "homologation",
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
        NEXT_PUBLIC_WS_URL: "http://localhost:4000"
      })
    ).toThrow(/Invalid NODE_ENV/);
  });

  it("client env guard fails fast when public env was not inlined", async () => {
    vi.resetModules();
    const savedApi = process.env.NEXT_PUBLIC_API_URL;
    const savedWs = process.env.NEXT_PUBLIC_WS_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_WS_URL;

    const { assertClientEnv } = await import("../src/env/client");
    expect(() => assertClientEnv()).toThrow(/NEXT_PUBLIC_API_URL/);

    process.env.NEXT_PUBLIC_API_URL = savedApi ?? "";
    process.env.NEXT_PUBLIC_WS_URL = savedWs ?? "";
    vi.resetModules();
  });
});
