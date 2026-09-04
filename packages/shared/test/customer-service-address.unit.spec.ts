import { describe, expect, it } from "vitest";
import { createCustomerSchema, createServiceAddressSchema, updateServiceAddressSchema } from "../src";

describe("customer and service-address schemas", () => {
  it("accepts a customer and an address without GPS", () => {
    expect(createCustomerSchema.parse({ name: "Cliente Exemplo" }).status).toBe("active");
    expect(createServiceAddressSchema.parse({ customerId: "f3b4c8d7-0d48-4e9f-a1d0-69b4442df52a", street: "Rua A", city: "São Paulo", state: "SP" }).latitude).toBeUndefined();
  });
  it("requires complete and valid coordinate pairs", () => {
    expect(() => createServiceAddressSchema.parse({ customerId: "f3b4c8d7-0d48-4e9f-a1d0-69b4442df52a", street: "Rua A", city: "São Paulo", state: "SP", latitude: -23 })).toThrow();
    expect(() => updateServiceAddressSchema.parse({ longitude: -46 })).toThrow();
    expect(updateServiceAddressSchema.parse({ latitude: -23, longitude: -46 })).toMatchObject({ latitude: -23, longitude: -46 });
  });
});
