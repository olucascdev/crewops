import * as schema from "@crewops/db";
import type { CreateBranchInput, UpdateBranchInput } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../common/errors/app-error";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

@Injectable()
export class BranchesService {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async list(companyId: string) {
    return this.db
      .select()
      .from(schema.branches)
      .where(and(eq(schema.branches.companyId, companyId), isNull(schema.branches.deletedAt)));
  }

  async create(companyId: string, input: CreateBranchInput) {
    try {
      const [branch] = await this.db
        .insert(schema.branches)
        .values({ ...input, companyId })
        .returning();
      if (!branch) throw new Error("branch create returned no row");
      return branch;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("código de filial já existe nesta empresa");
      throw error;
    }
  }

  async update(companyId: string, id: string, input: UpdateBranchInput) {
    try {
      const [branch] = await this.db
        .update(schema.branches)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(schema.branches.id, id),
            eq(schema.branches.companyId, companyId),
            isNull(schema.branches.deletedAt),
          ),
        )
        .returning();
      if (!branch) throw new NotFoundError("filial não encontrada");
      return branch;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("código de filial já existe nesta empresa");
      throw error;
    }
  }
  async deactivate(companyId: string, id: string) {
    const [branch] = await this.db.update(schema.branches).set({ active: false, deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(schema.branches.id, id), eq(schema.branches.companyId, companyId), isNull(schema.branches.deletedAt))).returning();
    if (!branch) throw new NotFoundError("filial não encontrada");
    return { ok: true as const };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
