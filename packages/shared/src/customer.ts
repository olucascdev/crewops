import { z } from "zod";
import { uuidString } from "./schemas";

const customerStatus = z.enum(["active", "inactive"]);
export const createCustomerSchema = z.object({ name: z.string().trim().min(2).max(180), branchId: uuidString.nullable().optional(), document: z.string().trim().max(32).optional(), email: z.string().email().max(190).optional(), phone: z.string().max(32).optional(), status: customerStatus.default("active") });
export const updateCustomerSchema = createCustomerSchema.partial().refine((value) => Object.keys(value).length > 0);
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
