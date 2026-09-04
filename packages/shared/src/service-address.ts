import { z } from "zod";
import { uuidString } from "./schemas";
const coordinate = z.coerce.number();
const serviceAddressFields = z.object({ label: z.string().trim().min(1).max(120).default("Principal"), street: z.string().trim().min(1).max(180), number: z.string().max(32).optional(), district: z.string().max(120).optional(), city: z.string().trim().min(1).max(120), state: z.string().trim().length(2), postalCode: z.string().max(16).optional(), latitude: coordinate.min(-90).max(90).optional(), longitude: coordinate.min(-180).max(180).optional(), contactName: z.string().max(160).optional(), contactPhone: z.string().max(32).optional(), instructions: z.string().max(2000).optional() });
const coordinatesTogether = (value: { latitude?: number; longitude?: number }) => (value.latitude === undefined) === (value.longitude === undefined);
export const createServiceAddressSchema = serviceAddressFields.extend({ customerId: uuidString }).refine(coordinatesTogether, "latitude and longitude must be supplied together");
export const updateServiceAddressSchema = serviceAddressFields.partial().refine((value) => Object.keys(value).length > 0).refine(coordinatesTogether, "latitude and longitude must be supplied together");
export type CreateServiceAddressInput = z.infer<typeof createServiceAddressSchema>;
export type UpdateServiceAddressInput = z.infer<typeof updateServiceAddressSchema>;
