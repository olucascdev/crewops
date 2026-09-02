import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
  version?: string;
  breakpoints: boolean;
};

export type MigrationJournal = {
  version: string;
  dialect: string;
  entries: JournalEntry[];
};

/**
 * A single generated migration with the checksum Drizzle records in the
 * `drizzle.__drizzle_migrations` tracking table: sha256 over the raw `.sql` file.
 */
export type JournalMigration = {
  tag: string;
  when: number;
  hash: string;
};

/**
 * Reads the Drizzle journal (`meta/_journal.json`) that defines the generated
 * migrations in apply order. Both the check and rollback runners use this so
 * they agree on what the expected migration history is.
 */
export async function readJournal(outDir: string): Promise<MigrationJournal> {
  const journalFile = join(outDir, "meta", "_journal.json");
  const raw = await readFile(journalFile, "utf8");
  return JSON.parse(raw) as MigrationJournal;
}

/**
 * Computes the expected migration identities and checksums from the journal in
 * apply order. Each checksum matches what Drizzle persists in the tracking
 * table, so a DB that is up to date must contain exactly these hashes, in this
 * order, with no extras or divergences.
 */
export async function readJournalMigrations(outDir: string): Promise<JournalMigration[]> {
  const journal = await readJournal(outDir);
  const migrations: JournalMigration[] = [];
  for (const entry of journal.entries) {
    const sqlPath = join(outDir, `${entry.tag}.sql`);
    const sql = await readFile(sqlPath, "utf8");
    migrations.push({
      tag: entry.tag,
      when: entry.when,
      hash: createHash("sha256").update(sql).digest("hex"),
    });
  }
  return migrations;
}
