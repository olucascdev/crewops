import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { loadDbEnv, requireDatabaseUrl, requireNodeEnv } from "./env";
import { validateAppliedPrefix } from "./migrate-check";
import { readJournalMigrations } from "./migration-journal";

const { Pool } = pg;

export type RollbackResult = {
  rolledBack: boolean;
  migration?: string;
};

/**
 * Reverts the most recently applied generated migration, using the matching
 * `*.down.sql` file and removing its exact tracking row from
 * `drizzle.__drizzle_migrations` in a single transaction.
 *
 * The target is selected only after the FULL applied history is validated as a
 * strict ordered prefix of the Drizzle journal. Comparing just the latest row
 * is not enough: an unknown/duplicate/out-of-order/divergent earlier row could
 * still let the last row match, causing rollback to run the wrong `*.down.sql`
 * and delete a tracking row despite an invalid history. Rollback refuses on any
 * divergence instead of guessing a migration based purely on row count.
 *
 * This is a development helper matching the "apply/verify/reverse" strategy of
 * the project; it refuses to run when NODE_ENV is production.
 */
export async function rollbackLastMigration(
  databaseUrl: string,
  outDir: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RollbackResult> {
  if (requireNodeEnv(env) === "production") {
    throw new Error(
      "rollback: refused to run in production. Use a migration path and data " +
        "reconciliation instead (see docs/CUTOVER plan).",
    );
  }

  const journalMigrations = await readJournalMigrations(outDir);

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    let appliedRows: { id: number; hash: string }[] = [];
    try {
      const result = await pool.query<{ id: number; hash: string }>(
        "SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id ASC",
      );
      appliedRows = result.rows;
    } catch (error) {
      void error;
      appliedRows = [];
    }

    if (appliedRows.length === 0 || journalMigrations.length === 0) {
      return { rolledBack: false };
    }

    // Gate the rollback on the FULL applied history being a strict ordered
    // prefix of the journal. This rejects the reproduction where the journal is
    // [A, B] and the tracking rows are [UNKNOWN, B]: even though the latest row
    // matches B, the earlier divergence means B.down.sql must not run.
    const appliedHashes = appliedRows.map((row) => row.hash);
    const journalHashes = journalMigrations.map((migration) => migration.hash);
    const prefix = validateAppliedPrefix(journalHashes, appliedHashes);
    if (!prefix.valid) {
      throw new Error(
        "rollback: applied migration history is not a valid prefix of the Drizzle " +
          `journal. ${prefix.issues.join("; ")} Refusing to roll back; reconcile the ` +
          "database first.",
      );
    }

    const lastIndex = appliedRows.length - 1;
    const appliedTarget = appliedRows[lastIndex];
    const target = journalMigrations[lastIndex];
    if (appliedTarget === undefined || target === undefined) {
      return { rolledBack: false };
    }

    const downFile = join(outDir, `${target.tag}.down.sql`);
    const downSql = await readFile(downFile, "utf8");
    const targetRowId = appliedTarget.id;

    // Use a single client so BEGIN/.../COMMIT run on the same connection and the
    // down migration + tracking-row delete are atomic.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      try {
        await client.query(downSql);
        await client.query("DELETE FROM drizzle.__drizzle_migrations WHERE id = $1", [targetRowId]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    } finally {
      client.release();
    }

    return { rolledBack: true, migration: target.tag };
  } finally {
    await pool.end();
  }
}

async function runCli(): Promise<void> {
  loadDbEnv();
  const databaseUrl = requireDatabaseUrl(process.env);
  const outDir = join(process.cwd(), "drizzle");
  const result = await rollbackLastMigration(databaseUrl, outDir);

  if (result.rolledBack) {
    process.stdout.write(`rolled back migration: ${result.migration}\n`);
    process.exitCode = 0;
  } else {
    process.stdout.write("nothing to roll back\n");
    process.exitCode = 0;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runCli();
}
