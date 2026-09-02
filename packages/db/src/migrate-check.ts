import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { loadDbEnv, requireDatabaseUrl } from "./env";
import { readJournalMigrations } from "./migration-journal";

const { Pool } = pg;

export type MigrationStatus = {
  upToDate: boolean;
  applied: number;
  expected: number;
  /** Human-readable reasons the database is not up to date (empty when up to date). */
  issues: string[];
};

/**
 * Compares the applied migration identities/checksums recorded in
 * `drizzle.__drizzle_migrations` against the generated migrations in the Drizzle
 * journal. The database is only "up to date" when the applied rows exactly match
 * the journal in count, order and checksum. Divergences — extra/future rows,
 * unknown hashes, duplicate rows, out-of-order rows or a stale DB — are rejected.
 *
 * This is a deterministic, non-destructive "is the DB up to date" check.
 */
export function compareMigrations(expected: string[], applied: string[]): MigrationStatus {
  const issues: string[] = [];

  if (applied.length !== expected.length) {
    issues.push(
      `count mismatch: journal defines ${expected.length} migration(s), ` +
        `tracking table has ${applied.length}`,
    );
  }

  // The applied rows must be a prefix of the journal in the same order. A row
  // that differs at any position means an unknown hash, an out-of-order apply,
  // or a divergent checksum.
  const compared = Math.min(applied.length, expected.length);
  for (let i = 0; i < compared; i++) {
    if (applied[i] !== expected[i]) {
      issues.push(
        `hash mismatch at position ${i + 1}: applied migration does not match the ` +
          `journal (unknown, out-of-order, or divergent checksum)`,
      );
      break;
    }
  }

  if (new Set(applied).size !== applied.length) {
    issues.push("duplicate applied migration rows detected");
  }

  for (const hash of applied) {
    if (!expected.includes(hash)) {
      issues.push("unknown applied migration row present that is not in the journal");
      break;
    }
  }

  return {
    upToDate: issues.length === 0,
    applied: applied.length,
    expected: expected.length,
    issues,
  };
}

export type PrefixValidation = {
  valid: boolean;
  issues: string[];
};

/**
 * Validates that the applied migration identities form a strict ordered prefix
 * of the journal. This is the rollback gate: unlike `compareMigrations` (which
 * requires exact full equality for "up to date"), a rollback legitimately runs
 * against a database that has migrated fewer times than the journal defines.
 * The applied history must therefore be the exact prefix — with no unknown,
 * duplicate, out-of-order, divergent, or future rows relative to the journal —
 * otherwise the latest applied row cannot be trusted and rollback refuses.
 */
export function validateAppliedPrefix(expected: string[], applied: string[]): PrefixValidation {
  const issues: string[] = [];

  // Applied history cannot exceed the journal: there is no known migration to
  // roll back to beyond what the journal defines, so never pick one by count.
  if (applied.length > expected.length) {
    issues.push(
      `applied migration count (${applied.length}) is ahead of the Drizzle journal ` +
        `(${expected.length})`,
    );
  }

  // Applied history must match the journal in order for every row it contains.
  for (let i = 0; i < applied.length; i++) {
    if (expected[i] === undefined) {
      break;
    }
    if (applied[i] !== expected[i]) {
      issues.push(
        `applied migration hash at position ${i + 1} does not match the Drizzle ` +
          `journal (unknown, out-of-order, or divergent checksum)`,
      );
      break;
    }
  }

  if (new Set(applied).size !== applied.length) {
    issues.push("duplicate applied migration rows detected");
  }

  for (const hash of applied) {
    if (!expected.includes(hash)) {
      issues.push("unknown applied migration row present that is not in the Drizzle journal");
      break;
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Reads the generated migration checksums from the journal and compares them
 * against the rows recorded in `drizzle.__drizzle_migrations`. A DB that has
 * never been migrated (no tracking table) reports zero applied migrations.
 */
export async function checkMigrations(
  databaseUrl: string,
  outDir: string,
): Promise<MigrationStatus> {
  const journalMigrations = await readJournalMigrations(outDir);

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    let applied: string[] = [];
    try {
      const result = await pool.query<{ hash: string }>(
        "SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id ASC",
      );
      applied = result.rows.map((row) => row.hash);
    } catch (error) {
      // No migration tracking table yet => DB was never migrated.
      void error;
      applied = [];
    }
    return compareMigrations(
      journalMigrations.map((migration) => migration.hash),
      applied,
    );
  } finally {
    await pool.end();
  }
}

async function runCli(): Promise<void> {
  loadDbEnv();
  const databaseUrl = requireDatabaseUrl(process.env);
  const outDir = join(process.cwd(), "drizzle");
  const status = await checkMigrations(databaseUrl, outDir);

  if (status.upToDate) {
    process.stdout.write(`migrations up to date (${status.applied}/${status.expected})\n`);
    process.exitCode = 0;
    return;
  }

  process.stdout.write(
    `migrations NOT up to date: ${status.applied}/${status.expected} applied. ` +
      `Run \`npm run db:migrate\` first.\n`,
  );
  for (const issue of status.issues) {
    process.stdout.write(`  - ${issue}\n`);
  }
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runCli();
}
