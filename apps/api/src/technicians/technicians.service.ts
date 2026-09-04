import * as schema from "@crewops/db";
import type { CreateTechnicianInput, UpdateTechnicianInput } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../common/errors/app-error";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

@Injectable()
export class TechniciansService {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}
  list(companyId: string) { return this.db.select().from(schema.technicians).where(and(eq(schema.technicians.companyId, companyId), isNull(schema.technicians.deletedAt))); }
  async create(companyId: string, input: CreateTechnicianInput) {
    try { const [row] = await this.db.insert(schema.technicians).values({ ...input, companyId }).returning(); if (!row) throw new Error("technician create returned no row"); return row; }
    catch (error) { if (isUnique(error)) throw new ConflictError("usuário já está vinculado a um técnico nesta empresa"); throw error; }
  }
  async update(companyId: string, id: string, input: UpdateTechnicianInput) {
    try { const [row] = await this.db.update(schema.technicians).set({ ...input, updatedAt: new Date() }).where(and(eq(schema.technicians.id, id), eq(schema.technicians.companyId, companyId), isNull(schema.technicians.deletedAt))).returning(); if (!row) throw new NotFoundError("técnico não encontrado"); return row; }
    catch (error) { if (isUnique(error)) throw new ConflictError("usuário já está vinculado a um técnico nesta empresa"); throw error; }
  }
  async deactivate(companyId: string, id: string) { const [row] = await this.db.update(schema.technicians).set({ status: "inactive", deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(schema.technicians.id, id), eq(schema.technicians.companyId, companyId), isNull(schema.technicians.deletedAt))).returning(); if (!row) throw new NotFoundError("técnico não encontrado"); return { ok: true as const }; }
}
function isUnique(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === "23505"; }
