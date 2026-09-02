import { z } from "zod";
import { technicianAvailabilities, technicianStatuses } from "./roles";
import { uuidString } from "./schemas";

/**
 * @crewops/shared — Contratos de técnico.
 *
 * Vínculo opcional a um usuário (`userId`) e a uma filial (`branchId`), com a
 * regra do MVP: um `userId` só pode estar ligado a um técnico ativo por empresa.
 */

/** Criação de técnico. */
export const createTechnicianSchema = z.object({
  branchId: uuidString.nullable().optional(),
  userId: uuidString.nullable().optional(),
  phone: z.string().max(32).optional(),
  employeeId: z.string().max(40).optional(),
  status: z.enum(technicianStatuses).default("active"),
  availabilityStatus: z.enum(technicianAvailabilities).default("available"),
});
export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;

/** Edição parcial de técnico. */
export const updateTechnicianSchema = createTechnicianSchema.partial();
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;

/** Forma de técnico retornada pela API. */
export const technicianSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  phone: z.string().nullable(),
  employeeId: z.string().nullable(),
  status: z.enum(technicianStatuses),
  availabilityStatus: z.enum(technicianAvailabilities),
  createdAt: z.string().datetime({ offset: false }),
  updatedAt: z.string().datetime({ offset: false }),
});
export type Technician = z.infer<typeof technicianSchema>;
