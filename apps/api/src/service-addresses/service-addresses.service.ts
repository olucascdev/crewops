import * as schema from "@crewops/db";
import type { CreateServiceAddressInput, UpdateServiceAddressInput } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { NotFoundError } from "../common/errors/app-error";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

@Injectable()
export class ServiceAddressesService {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async listForCustomer(companyId: string, customerId: string) {
    await this.assertCustomer(companyId, customerId);
    return this.db
      .select()
      .from(schema.serviceAddresses)
      .where(
        and(
          eq(schema.serviceAddresses.companyId, companyId),
          eq(schema.serviceAddresses.customerId, customerId),
          isNull(schema.serviceAddresses.deletedAt),
        ),
      )
      .orderBy(schema.serviceAddresses.label);
  }

  async list(
    companyId: string,
    query: { page: number; pageSize: number; search?: string; customerId?: string },
  ) {
    const filters = [
      eq(schema.serviceAddresses.companyId, companyId),
      isNull(schema.serviceAddresses.deletedAt),
    ];
    if (query.customerId) filters.push(eq(schema.serviceAddresses.customerId, query.customerId));
    if (query.search) {
      const term = `%${normalizeSearchTerm(query.search)}%`;
      filters.push(
        or(
          ilike(schema.serviceAddresses.label, term),
          ilike(schema.serviceAddresses.street, term),
          ilike(schema.serviceAddresses.number, term),
          ilike(schema.serviceAddresses.district, term),
          ilike(schema.serviceAddresses.city, term),
          ilike(schema.serviceAddresses.state, term),
          ilike(schema.serviceAddresses.postalCode, term),
        )!,
      );
    }
    const where = and(...filters);
    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(schema.serviceAddresses)
        .where(where)
        .orderBy(desc(schema.serviceAddresses.createdAt), desc(schema.serviceAddresses.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.serviceAddresses)
        .where(where),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total: countRows[0]?.total ?? 0 };
  }

  async get(companyId: string, id: string) {
    const [address] = await this.db
      .select()
      .from(schema.serviceAddresses)
      .where(
        and(
          eq(schema.serviceAddresses.id, id),
          eq(schema.serviceAddresses.companyId, companyId),
          isNull(schema.serviceAddresses.deletedAt),
        ),
      )
      .limit(1);
    if (!address) throw new NotFoundError("endereço de atendimento não encontrado");
    return address;
  }

  async create(companyId: string, input: CreateServiceAddressInput) {
    await this.assertCustomer(companyId, input.customerId);
    const { latitude, longitude, ...fields } = input;
    const [address] = await this.db
      .insert(schema.serviceAddresses)
      .values({
        ...fields,
        companyId,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        ...(latitude === undefined ? {} : { geometry: pointExpression(longitude!, latitude!) }),
      })
      .returning();
    if (!address) throw new Error("service address create returned no row");
    return address;
  }

  async update(companyId: string, id: string, input: UpdateServiceAddressInput) {
    await this.get(companyId, id);
    const { latitude, longitude, ...fields } = input;
    const values = {
      ...fields,
      updatedAt: new Date(),
      ...(latitude === undefined
        ? {}
        : {
            latitude: latitude.toString(),
            longitude: longitude!.toString(),
            geometry: pointExpression(longitude!, latitude),
          }),
    };
    const [address] = await this.db
      .update(schema.serviceAddresses)
      .set(values)
      .where(
        and(
          eq(schema.serviceAddresses.id, id),
          eq(schema.serviceAddresses.companyId, companyId),
          isNull(schema.serviceAddresses.deletedAt),
        ),
      )
      .returning();
    if (!address) throw new NotFoundError("endereço de atendimento não encontrado");
    return address;
  }

  async remove(companyId: string, id: string) {
    const [address] = await this.db
      .update(schema.serviceAddresses)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(schema.serviceAddresses.id, id),
          eq(schema.serviceAddresses.companyId, companyId),
          isNull(schema.serviceAddresses.deletedAt),
        ),
      )
      .returning();
    if (!address) throw new NotFoundError("endereço de atendimento não encontrado");
    return { ok: true as const };
  }

  private async assertCustomer(companyId: string, customerId: string) {
    const [customer] = await this.db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.id, customerId),
          eq(schema.customers.companyId, companyId),
          isNull(schema.customers.deletedAt),
        ),
      )
      .limit(1);
    if (!customer) throw new NotFoundError("cliente não encontrado");
  }
}

function pointExpression(longitude: number, latitude: number) {
  return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}

export function normalizeSearchTerm(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
