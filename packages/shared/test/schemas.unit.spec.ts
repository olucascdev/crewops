import { describe, expect, it } from "vitest";
import {
  evidenceMetadata,
  paginationQuery,
  syncEnvelope,
  utcTimestampString,
  uuidString,
  workOrderEventPayload,
} from "../src/schemas";

describe("shared schemas", () => {
  describe("uuidString", () => {
    it("accepts a canonical UUID v4", () => {
      expect(uuidString.safeParse("f51f7e1e-c2a7-4f13-9f1e-3b0a1f45cc0e").success).toBe(true);
    });

    it("rejects non-UUID and malformed UUIDs", () => {
      expect(uuidString.safeParse("not-a-uuid").success).toBe(false);
      expect(uuidString.safeParse("f51f7e1e-c2a7-4f13").success).toBe(false);
    });
  });

  describe("utcTimestampString", () => {
    it("accepts an ISO date with explicit Z (UTC)", () => {
      expect(utcTimestampString.safeParse("2026-09-01T12:00:00.000Z").success).toBe(true);
      expect(utcTimestampString.safeParse("2026-09-01T12:00:00Z").success).toBe(true);
    });

    it("rejects dates without timezone or with a numeric offset", () => {
      expect(utcTimestampString.safeParse("2026-09-01T12:00:00").success).toBe(false);
      expect(utcTimestampString.safeParse("2026-09-01T12:00:00-03:00").success).toBe(false);
    });

    it("rejects non-date strings", () => {
      expect(utcTimestampString.safeParse("yesterday").success).toBe(false);
    });
  });

  describe("paginationQuery", () => {
    it("applies safe defaults", () => {
      const parsed = paginationQuery.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.pageSize).toBe(50);
      }
    });

    it("rejects pageSize outside the 1..100 bound", () => {
      expect(paginationQuery.safeParse({ pageSize: 0 }).success).toBe(false);
      expect(paginationQuery.safeParse({ pageSize: 1000 }).success).toBe(false);
    });
  });

  describe("syncEnvelope", () => {
    it("accepts a valid envelope", () => {
      const parsed = syncEnvelope.safeParse({
        deviceId: "pwa-device-01",
        idempotencyKey: "evt-0001",
        occurredAt: "2026-09-01T10:00:00.000Z",
        createdOffline: true,
        payload: { status: "completed" },
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects a bad occurredAt (no Z) or missing idempotency key", () => {
      expect(
        syncEnvelope.safeParse({
          deviceId: "d",
          idempotencyKey: "k",
          occurredAt: "2026-09-01T10:00:00",
          createdOffline: false,
          payload: {},
        }).success,
      ).toBe(false);
      expect(
        syncEnvelope.safeParse({
          deviceId: "d",
          occurredAt: "2026-09-01T10:00:00.000Z",
          createdOffline: false,
          payload: {},
        }).success,
      ).toBe(false);
    });
  });

  describe("workOrderEventPayload", () => {
    it("accepts an arbitrary JSON-ish object", () => {
      expect(workOrderEventPayload.safeParse({ note: "ok", value: 42 }).success).toBe(true);
    });

    it("rejects values that are not objects", () => {
      expect(workOrderEventPayload.safeParse("just a string").success).toBe(false);
    });
  });

  describe("evidenceMetadata", () => {
    it("accepts valid optional metadata", () => {
      const parsed = evidenceMetadata.safeParse({
        fileName: "cto.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        caption: "Cabo instalado",
        signerName: "João",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts an empty object (all fields optional)", () => {
      expect(evidenceMetadata.safeParse({}).success).toBe(true);
    });
  });
});
