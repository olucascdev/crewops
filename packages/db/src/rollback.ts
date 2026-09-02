import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { requireDatabaseUrl, requireNodeEnv } from "./env";

const { Pool } = pg;

export type RollbackResult = {
  rolledBack: boolean;
  migration?: string;
};

/**
 * Reverts the most recently applied generated migration, using the matching
 * `*.down.sql` file and removing its tracking row from `drizzle.__drizzle_migrations`.
 * This is a development helper matching the "apply/verify/reverse" strategy of the
 * project; it refuses to run when NODE_ENV is production.
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

  const journalFile = join(outDir, "meta", "_journal.json");
  const raw = await readFile(journalFile, "utf8");
  const journal = JSON.parse(raw) as { entries: { tag: string }[] };
  const entries = journal.entries;

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    let applied = 0;
    try {
      const result = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations",
      );
      applied = Number(result.rows[0]?.count ?? 0);
    } catch (error) {
      applied = 0;
      void error;
    }

    if (applied === 0 || entries.length === 0) {
      return { rolledBack: false };
    }

    const target = entries[applied - 1];
    if (!target) {
      return { rolledBack: false };
    }
    const downFile = join(outDir, `${target.tag}.down.sql`);
    const downSql = await readFile(downFile, "utf8");

    await pool.query("BEGIN");
    try {
      await pool.query(downSql);
      await pool.query(
        "DELETE FROM drizzle.__drizzle_migrations WHERE id = " +
          "(SELECT max(id) FROM drizzle.__drizzle_migrations)",
      );
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

    return { rolledBack: true, migration: target.tag };
  } finally {
    await pool.end();
  }
}

async function runCli(): Promise<void> {
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
