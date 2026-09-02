import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { requireDatabaseUrl } from "./env";

const { Pool } = pg;

export type MigrationStatus = {
  upToDate: boolean;
  applied: number;
  expected: number;
};

/**
 * Compares the number of generated migrations (from the Drizzle journal) against
 * the number recorded as applied in `drizzle.__drizzle_migrations`. This is a
 * deterministic, non-destructive "is the DB up to date" check.
 */
export async function checkMigrations(
  databaseUrl: string,
  outDir: string,
): Promise<MigrationStatus> {
  const journalFile = join(outDir, "meta", "_journal.json");
  const raw = await readFile(journalFile, "utf8");
  const journal = JSON.parse(raw) as { entries: unknown[] };
  const expected = journal.entries.length;

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    let applied = 0;
    try {
      const result = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations",
      );
      applied = Number(result.rows[0]?.count ?? 0);
    } catch (error) {
      // No migration tracking table yet => DB was never migrated.
      applied = 0;
      void error;
    }
    return { upToDate: applied >= expected, applied, expected };
  } finally {
    await pool.end();
  }
}

async function runCli(): Promise<void> {
  const databaseUrl = requireDatabaseUrl(process.env);
  const outDir = join(process.cwd(), "drizzle");
  const status = await checkMigrations(databaseUrl, outDir);

  if (status.upToDate) {
    process.stdout.write(`migrations up to date (${status.applied}/${status.expected})\n`);
    process.exitCode = 0;
    return;
  }

  process.stdout.write(
    `migrations NOT applied: ${status.applied}/${status.expected} applied. ` +
      `Run \`npm run db:migrate\` first.\n`,
  );
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runCli();
}
