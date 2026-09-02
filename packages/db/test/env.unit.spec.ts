import { describe, expect, it } from "vitest";
import { DbConfigError, requireDatabaseUrl } from "../src/env";

describe("db env validation", () => {
  it("requireDatabaseUrl throws a clear error when DATABASE_URL is missing", () => {
    expect(() => requireDatabaseUrl({})).toThrow(DbConfigError);
    expect(() => requireDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });

  it("requireDatabaseUrl returns the value when set", () => {
    expect(
      requireDatabaseUrl({ DATABASE_URL: "postgres://crewops:crewops@localhost:5432/crewops" }),
    ).toBe("postgres://crewops:crewops@localhost:5432/crewops");
  });

  it("rejects an empty DATABASE_URL", () => {
    expect(() => requireDatabaseUrl({ DATABASE_URL: "   " })).toThrow(DbConfigError);
  });
});
