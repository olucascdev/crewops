import * as schema from "@crewops/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

/**
 * Drizzle client typed against the full CrewOps schema. Repositories inject
 * this via `DB_CLIENT` and pass an optional transaction handle for writes that
 * need atomic domain + audit persistence.
 */
export type Db = NodePgDatabase<typeof schema>;

export function createDrizzle(pool: Pool): Db {
  return drizzle(pool, { schema });
}
