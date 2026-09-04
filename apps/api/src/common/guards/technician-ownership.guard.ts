import * as schema from "@crewops/db";
import { type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../../infra/db";
import { DB_CLIENT } from "../../infra/tokens";
import type { AuthenticatedRequest } from "../auth/session.types";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../errors/app-error";

/**
 * Restriction of the technician (identity-access spec): a technician may only
 * read/act on work orders assigned to them. This guard:
 *
 * - requires `role === 'tecnico'`;
 * - resolves the technician for the authenticated user;
 * - looks up the work order by the `:id` route param scoped to the user's company;
 * - returns `NOT_FOUND` when the OS does not exist in the user's company (no
 *   existence leak), and `FORBIDDEN` when the OS exists but is assigned to
 *   another technician.
 *
 * In group 6 this backs the temporary `/internal/test/work-orders/:id/ownership`
 * stub; the real `work-orders` module (group 8) will reuse the same rule.
 */
@Injectable()
export class TechnicianOwnershipGuard {
  constructor(@Inject(DB_CLIENT) private readonly db: Db) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError("sessão necessária");
    }
    if (user.role !== "tecnico") {
      throw new ForbiddenError("somente técnico acessa OS atribuídas");
    }

    const workOrderId = request.params?.id;
    if (!workOrderId || typeof workOrderId !== "string") {
      throw new NotFoundError("ordem de serviço não encontrada");
    }

    const technicians = await this.db
      .select({ id: schema.technicians.id, userId: schema.technicians.userId })
      .from(schema.technicians)
      .where(
        and(
          eq(schema.technicians.userId, user.id),
          eq(schema.technicians.companyId, user.companyId),
          eq(schema.technicians.status, "active"),
          isNull(schema.technicians.deletedAt),
        ),
      )
      .limit(1);
    const technician = technicians[0];
    if (!technician) {
      // A `tecnico` role without a technician record is misconfigured; deny.
      throw new ForbiddenError("técnico não vinculado");
    }

    const rows = await this.db
      .select({
        id: schema.workOrders.id,
        companyId: schema.workOrders.companyId,
        technicianId: schema.workOrders.technicianId,
      })
      .from(schema.workOrders)
      .where(
        and(
          eq(schema.workOrders.id, workOrderId),
          eq(schema.workOrders.companyId, user.companyId),
          isNull(schema.workOrders.deletedAt),
        ),
      )
      .limit(1);
    const workOrder = rows[0];
    if (!workOrder) {
      throw new NotFoundError("ordem de serviço não encontrada");
    }
    if (workOrder.technicianId !== technician.id) {
      throw new ForbiddenError("OS atribuída a outro técnico");
    }

    return true;
  }
}
