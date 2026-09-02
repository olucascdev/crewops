import { z } from "zod";
import { userRoles, userStatuses } from "./roles";
import { uuidString } from "./schemas";

/**
 * @crewops/shared — Contratos de criação/edição de usuário do painel.
 *
 * Precedência de regra: a validação autoritativa é server-side; estes schemas
 * validam a forma de transporte. Admin define a senha inicial no create; sem
 * e-mail de convite/reset no MVP.
 */

const name = z.string().min(3).max(160);
const email = z.string().email().max(190);

/** Criação de usuário (admin). Senha opcional: quando omitida, a API usa a senha dev. */
export const createUserSchema = z.object({
  name,
  email,
  role: z.enum(userRoles),
  status: z.enum(userStatuses).default("active"),
  branchId: uuidString.nullable().optional(),
  password: z.string().min(8).max(200).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Edição parcial de usuário. `email`/`name`/`role`/`status`/`branchId`. */
export const updateUserSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    role: z.enum(userRoles).optional(),
    status: z.enum(userStatuses).optional(),
    branchId: uuidString.nullable().optional(),
    // Re-definition of password on update is a reset action; admin may set a new
    // initial password. Rotation of refresh tokens is out of scope (group 16).
    password: z.string().min(8).max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field is required",
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Forma de um usuário retornado pela API. */
export const userSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  name,
  email,
  role: z.enum(userRoles),
  status: z.enum(userStatuses),
  createdAt: z.string().datetime({ offset: false }),
  updatedAt: z.string().datetime({ offset: false }),
});
export type User = z.infer<typeof userSchema>;
