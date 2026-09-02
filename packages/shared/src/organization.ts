import { z } from "zod";
import { uuidString } from "./schemas";

/**
 * @crewops/shared — Contratos de empresa/filial.
 *
 * O MVP tem uma empresa piloto ativa (`companies`) e filiais. `code` é único
 * por empresa; endereço operacional mínimo (`city`, `state`) obrigatório.
 */

const code = z
  .string()
  .min(1)
  .max(40)
  .transform((value) => value.trim().toUpperCase());

/** Criação de filial. `code` normalizado para uppercase/trim. */
export const createBranchSchema = z.object({
  code,
  name: z.string().min(1).max(160),
  city: z.string().min(1).max(120),
  state: z.string().length(2),
  timezone: z.string().min(1).max(60).default("America/Sao_Paulo"),
  street: z.string().max(180).optional(),
  number: z.string().max(32).optional(),
  district: z.string().max(120).optional(),
  postalCode: z.string().max(16).optional(),
  active: z.boolean().default(true),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

/** Edição parcial de filial. */
export const updateBranchSchema = createBranchSchema.partial();
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

/** Forma de filial retornada pela API. */
export const branchSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code,
  name: z.string().min(1).max(160),
  city: z.string().min(1).max(120),
  state: z.string().length(2),
  timezone: z.string().min(1).max(60),
  street: z.string().nullable(),
  number: z.string().nullable(),
  district: z.string().nullable(),
  postalCode: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string().datetime({ offset: false }),
  updatedAt: z.string().datetime({ offset: false }),
});
export type Branch = z.infer<typeof branchSchema>;

/** Fornece uma filial válida para um `companyId`. */
export const branchIdRef = uuidString;
