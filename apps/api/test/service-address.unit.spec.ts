import { describe, expect, it } from "vitest";
import { normalizeSearchTerm as normalizeCustomerSearch } from "../src/customers/customers.service";
import { normalizeSearchTerm as normalizeAddressSearch } from "../src/service-addresses/service-addresses.service";
import { snapshotServiceAddress } from "../src/service-addresses/snapshot";

describe("snapshotServiceAddress", () => {
  it("returns a normalized detached address snapshot without changing the source", () => {
    const source = {
      id: "a",
      label: "Principal",
      street: "Rua A",
      number: "10",
      district: null,
      city: "São Paulo",
      state: "SP",
      postalCode: null,
      latitude: "-23.5",
      longitude: "-46.6",
      contactName: null,
      contactPhone: null,
      instructions: null,
    };
    expect(snapshotServiceAddress(source)).toEqual({
      addressId: "a",
      label: "Principal",
      street: "Rua A",
      number: "10",
      district: null,
      city: "São Paulo",
      state: "SP",
      postalCode: null,
      latitude: "-23.5",
      longitude: "-46.6",
      contactName: null,
      contactPhone: null,
      instructions: null,
    });
    expect(source).toEqual({
      id: "a",
      label: "Principal",
      street: "Rua A",
      number: "10",
      district: null,
      city: "São Paulo",
      state: "SP",
      postalCode: null,
      latitude: "-23.5",
      longitude: "-46.6",
      contactName: null,
      contactPhone: null,
      instructions: null,
    });
  });

  it("normalizes whitespace before customer and address searches", () => {
    expect(normalizeCustomerSearch("  Rua   das  Flores  ")).toBe("Rua das Flores");
    expect(normalizeAddressSearch("  Centro\tSP ")).toBe("Centro SP");
  });
});
