import * as schema from "@crewops/db";
import type { CreateCustomerInput, UpdateCustomerInput } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../common/errors/app-error";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

export type CustomerListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: "active" | "inactive";
  branchId?: string;
};

@Injectable()
export class CustomersService {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async list(companyId: string, query: CustomerListQuery) {
    const filters = [eq(schema.customers.companyId, companyId), isNull(schema.customers.deletedAt)];
    if (query.status) filters.push(eq(schema.customers.status, query.status));
    if (query.branchId) filters.push(eq(schema.customers.branchId, query.branchId));
    if (query.search?.trim()) {
      const term = `%${normalizeSearchTerm(query.search)}%`;
      filters.push(
        or(
          ilike(schema.customers.name, term),
          ilike(schema.customers.document, term),
          ilike(schema.customers.email, term),
          ilike(schema.customers.phone, term),
          sql`exists (select 1 from service_addresses addresses where addresses.company_id = ${companyId} and addresses.customer_id = ${schema.customers.id} and addresses.deleted_at is null and (addresses.postal_code ilike ${term} or addresses.street ilike ${term} or addresses.city ilike ${term}))`,
        )!,
      );
    }
    const where = and(...filters);
    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(schema.customers)
        .where(where)
        .orderBy(desc(schema.customers.createdAt), desc(schema.customers.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: sql<number>`count(*)::int` }).from(schema.customers).where(where),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total: countRows[0]?.total ?? 0 };
  }

  async get(companyId: string, id: string) {
    const [customer] = await this.db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.companyId, companyId),
          isNull(schema.customers.deletedAt),
        ),
      )
      .limit(1);
    if (!customer) throw new NotFoundError("cliente não encontrado");
    return customer;
  }

  async create(companyId: string, input: CreateCustomerInput) {
    await this.assertBranch(companyId, input.branchId);
    try {
      const [customer] = await this.db
        .insert(schema.customers)
        .values({ ...input, companyId })
        .returning();
      if (!customer) throw new Error("customer create returned no row");
      return customer;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("documento já cadastrado nesta empresa");
      throw error;
    }
  }

  async update(companyId: string, id: string, input: UpdateCustomerInput) {
    await this.get(companyId, id);
    await this.assertBranch(companyId, input.branchId);
    try {
      const [customer] = await this.db
        .update(schema.customers)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(schema.customers.id, id),
            eq(schema.customers.companyId, companyId),
            isNull(schema.customers.deletedAt),
          ),
        )
        .returning();
      if (!customer) throw new NotFoundError("cliente não encontrado");
      return customer;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("documento já cadastrado nesta empresa");
      throw error;
    }
  }

  async deactivate(companyId: string, id: string) {
    const [customer] = await this.db
      .update(schema.customers)
      .set({ status: "inactive", deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.companyId, companyId),
          isNull(schema.customers.deletedAt),
        ),
      )
      .returning();
    if (!customer) throw new NotFoundError("cliente não encontrado");
    return { ok: true as const };
  }

  private async assertBranch(companyId: string, branchId: string | null | undefined) {
    if (!branchId) return;
    const [branch] = await this.db
      .select({ id: schema.branches.id })
      .from(schema.branches)
      .where(
        and(
          eq(schema.branches.id, branchId),
          eq(schema.branches.companyId, companyId),
          eq(schema.branches.active, true),
          isNull(schema.branches.deletedAt),
        ),
      )
      .limit(1);
    if (!branch) throw new NotFoundError("filial não encontrada");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function normalizeSearchTerm(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
