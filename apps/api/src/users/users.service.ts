import * as schema from "@crewops/db";
import type { CreateUserInput, UpdateUserInput } from "@crewops/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { AuditService } from "../audit/audit.service";
import { SessionRepository } from "../auth/session.repository";
import { ConflictError, NotFoundError } from "../common/errors/app-error";
import { hashPassword } from "../common/utils/password";
import type { Db } from "../infra/db";
import { DB_CLIENT } from "../infra/tokens";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: Db,
    private readonly audit: AuditService,
    private readonly sessions: SessionRepository,
  ) {}

  async list(companyId: string) {
    return this.db
      .select({
        id: schema.users.id,
        companyId: schema.users.companyId,
        branchId: schema.users.branchId,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(and(eq(schema.users.companyId, companyId), isNull(schema.users.deletedAt)));
  }

  async create(companyId: string, actorId: string, input: CreateUserInput) {
    try {
      const passwordHash = await hashPassword(input.password);
      const [user] = await this.db
        .insert(schema.users)
        .values({ ...input, email: input.email.trim().toLowerCase(), passwordHash, companyId })
        .returning({
          id: schema.users.id,
          companyId: schema.users.companyId,
          branchId: schema.users.branchId,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        });
      if (!user) throw new Error("user create returned no row");
      await this.audit.write({
        companyId,
        actorUserId: actorId,
        targetUserId: user.id,
        resource: "user",
        action: "create",
        resourceId: user.id,
      });
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("e-mail já existe nesta empresa");
      throw error;
    }
  }

  async update(companyId: string, actorId: string, id: string, input: UpdateUserInput) {
    const values: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.email) values.email = input.email.trim().toLowerCase();
    if (input.password) values.passwordHash = await hashPassword(input.password);
    delete values.password;
    try {
      const [user] = await this.db
        .update(schema.users)
        .set(values)
        .where(
          and(
            eq(schema.users.id, id),
            eq(schema.users.companyId, companyId),
            isNull(schema.users.deletedAt),
          ),
        )
        .returning({
          id: schema.users.id,
          companyId: schema.users.companyId,
          branchId: schema.users.branchId,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        });
      if (!user) throw new NotFoundError("usuário não encontrado");
      const securityChange =
        input.role !== undefined || input.status !== undefined || input.password !== undefined;
      if (securityChange) await this.sessions.revokeForUser(id, companyId);
      await this.audit.write({
        companyId,
        actorUserId: actorId,
        targetUserId: id,
        resource: "user",
        action: input.role ? "role_change" : input.status === "inactive" ? "deactivate" : "update",
        resourceId: id,
      });
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("e-mail já existe nesta empresa");
      throw error;
    }
  }
  async deactivate(companyId: string, actorId: string, id: string) { return this.update(companyId, actorId, id, { status: "inactive" }); }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
