import { describe, expect, it } from "vitest";
import { compareMigrations, validateAppliedPrefix } from "../src/migrate-check";

/**
 * Pure checksum comparison logic. Mirrors the reviewer's blocking finding:
 * `checkMigrations()` must reject any history that diverges from the Drizzle
 * journal in count, order, identity or checksum — not just compare row counts.
 */
describe("compareMigrations (migration history verification)", () => {
  const A = "hash-a";
  const B = "hash-b";
  const C = "hash-c";

  it("reports up to date when applied identities and order match the journal", () => {
    const status = compareMigrations([A, B, C], [A, B, C]);
    expect(status.upToDate).toBe(true);
    expect(status.applied).toBe(3);
    expect(status.expected).toBe(3);
    expect(status.issues).toEqual([]);
  });

  it("rejects when the tracking table has more rows than the journal (extra/future)", () => {
    // Reviewer reproduction: 2 applied rows vs 1 journal migration.
    const status = compareMigrations([A], [A, B]);
    expect(status.upToDate).toBe(false);
    expect(status.issues.join(" ")).toMatch(/count mismatch/);
  });

  it("rejects a stale database (fewer applied rows than the journal)", () => {
    const status = compareMigrations([A, B, C], [A, B]);
    expect(status.upToDate).toBe(false);
    expect(status.issues.join(" ")).toMatch(/count mismatch/);
  });

  it("rejects an unknown applied row that is not in the journal", () => {
    const status = compareMigrations([A, B], [A, "unknown-hash"]);
    expect(status.upToDate).toBe(false);
    expect(status.issues.join(" ")).toMatch(/unknown applied migration row/);
  });

  it("rejects out-of-order applied rows even when the count matches", () => {
    const status = compareMigrations([A, B, C], [A, C, B]);
    expect(status.upToDate).toBe(false);
    expect(status.issues.join(" ")).toMatch(/hash mismatch/);
  });

  it("rejects duplicate applied rows", () => {
    const status = compareMigrations([A, B, C], [A, A, B]);
    expect(status.upToDate).toBe(false);
    expect(status.issues.join(" ")).toMatch(/duplicate applied migration rows/);
  });

  it("reports an empty database as not up to date when the journal has migrations", () => {
    const status = compareMigrations([A], []);
    expect(status.upToDate).toBe(false);
    expect(status.applied).toBe(0);
    expect(status.issues.join(" ")).toMatch(/count mismatch/);
  });

  it("reports a database with no migrations and an empty journal as up to date", () => {
    const status = compareMigrations([], []);
    expect(status.upToDate).toBe(true);
    expect(status.applied).toBe(0);
    expect(status.expected).toBe(0);
  });
});

/**
 * The rollback gate. Unlike `compareMigrations` (exact full equality), a
 * rollback may run against a database that is behind the journal, but only when
 * the applied rows are a strict ordered PREFIX of the journal. Mirrors the
 * reviewer's blocking finding: journal [A, B] with applied [UNKNOWN, B] must be
 * refused even though the latest row matches B.
 */
describe("validateAppliedPrefix (rollback prefix gate)", () => {
  const A = "hash-a";
  const B = "hash-b";
  const C = "hash-c";

  it("accepts an exact full match (applied equals journal)", () => {
    const result = validateAppliedPrefix([A, B, C], [A, B, C]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts a strict prefix (applied behind the journal)", () => {
    const result = validateAppliedPrefix([A, B, C], [A, B]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects the reviewer reproduction: journal [A, B] with applied [UNKNOWN, B]", () => {
    const result = validateAppliedPrefix([A, B], ["unknown-hash", B]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(/does not match the Drizzle journal/);
  });

  it("rejects applied history that is ahead of the journal (extra/future rows)", () => {
    const result = validateAppliedPrefix([A, B], [A, B, C]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(/ahead of the Drizzle journal/);
  });

  it("rejects an unknown earlier row even when the last row matches (divergent)", () => {
    const result = validateAppliedPrefix([A, B, C], ["unknown-hash", B, C]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(
      /does not match the Drizzle journal|unknown applied migration row/,
    );
  });

  it("rejects out-of-order applied rows that happen to share the last hash", () => {
    const result = validateAppliedPrefix([A, B, C], [A, C, B]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(/does not match the Drizzle journal/);
  });

  it("rejects duplicate applied rows", () => {
    const result = validateAppliedPrefix([A, B, C], [A, A, B]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(/duplicate applied migration rows/);
  });

  it("rejects applied rows that are not in the journal at all", () => {
    const result = validateAppliedPrefix([A, B], ["unknown-hash", "another-hash"]);
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toMatch(
      /unknown applied migration row|does not match the Drizzle journal/,
    );
  });

  it("accepts an empty applied history (nothing to roll back)", () => {
    const result = validateAppliedPrefix([A, B], []);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts an empty journal with an empty applied history", () => {
    const result = validateAppliedPrefix([], []);
    expect(result.valid).toBe(true);
  });
});
