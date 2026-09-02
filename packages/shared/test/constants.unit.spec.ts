import { describe, expect, it } from "vitest";
import {
  type AppEnvironment,
  appEnvironments,
  type ErrorCode,
  type EvidenceStatus,
  type EvidenceType,
  errorCodes,
  evidenceStatuses,
  evidenceTypes,
  gpsPolicy,
  type LocationEventSource,
  locationEventSources,
  type Priority,
  priorities,
  type SyncResult,
  syncResults,
  type TechnicianAvailability,
  type TicketStatus,
  technicianAvailabilities,
  ticketStatuses,
  type UserRole,
  userRoles,
  type WorkOrderEventType,
  type WorkOrderStatus,
  type WorkOrderType,
  workOrderEventTypes,
  workOrderStatuses,
  workOrderTypes,
} from "../src/index";

/** Convenience: every exported enum array must be non-empty and duplicate-free. */
const arrays = [
  appEnvironments,
  errorCodes,
  evidenceStatuses,
  evidenceTypes,
  locationEventSources,
  priorities,
  syncResults,
  technicianAvailabilities,
  ticketStatuses,
  userRoles,
  workOrderEventTypes,
  workOrderStatuses,
  workOrderTypes,
];

function expectEnumArray(name: string, values: readonly string[], expected: string[]) {
  expect(values).toEqual(expected);
  expect(values.length).toBeGreaterThan(0);
  expect(new Set(values).size).toBe(values.length);
  expect(values).toEqual(expect.arrayContaining(expected));
  void name;
}

describe("shared constants", () => {
  it("all exported enum arrays are non-empty and duplicate-free", () => {
    for (const values of arrays) {
      expect(values.length).toBeGreaterThan(0);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("appEnvironments covers the supported environments", () => {
    expect(appEnvironments).toEqual(["development", "test", "production"]);
    const env: AppEnvironment = "development";
    expect(appEnvironments).toContain(env);
  });

  it("errorCodes keeps the stable API contract codes including idempotency", () => {
    expect(errorCodes).toContain("VALIDATION_ERROR");
    expect(errorCodes).toContain("UNAUTHORIZED");
    expect(errorCodes).toContain("IDEMPOTENT_REPLAY");
    const code: ErrorCode = "CONFLICT";
    expect(errorCodes).toContain(code);
  });

  it("userRoles are the five MVP profiles", () => {
    expectEnumArray("userRoles", userRoles, [
      "admin",
      "gestor_operacional",
      "atendente",
      "despachante",
      "tecnico",
    ]);
    const role: UserRole = "despachante";
    expect(userRoles).toContain(role);
  });

  it("ticketStatuses match STATE_MATRICES", () => {
    expectEnumArray("ticketStatuses", ticketStatuses, [
      "open",
      "in_progress",
      "waiting",
      "resolved",
      "closed",
      "cancelled",
    ]);
    const status: TicketStatus = "waiting";
    expect(ticketStatuses).toContain(status);
  });

  it("workOrderStatuses match the final state matrix", () => {
    expectEnumArray("workOrderStatuses", workOrderStatuses, [
      "pending",
      "scheduled",
      "dispatched",
      "in_progress",
      "waiting_evidence",
      "in_validation",
      "waiting_parts",
      "completed",
      "cancelled",
      "rework",
    ]);
    const status: WorkOrderStatus = "waiting_evidence";
    expect(workOrderStatuses).toContain(status);
  });

  it("workOrderTypes cover corrective/preventive/installation/survey", () => {
    expectEnumArray("workOrderTypes", workOrderTypes, [
      "corrective",
      "preventive",
      "installation",
      "survey",
    ]);
    const type: WorkOrderType = "preventive";
    expect(workOrderTypes).toContain(type);
  });

  it("workOrderEventTypes cover the immutable event vocabulary", () => {
    expectEnumArray("workOrderEventTypes", workOrderEventTypes, [
      "dispatch_created",
      "technician_assigned",
      "technician_reassigned",
      "schedule_changed",
      "unassigned",
      "check_in",
      "service_started",
      "service_finished",
      "status_changed",
      "note_added",
      "evidence_uploaded",
      "waiting_parts",
      "waiting_evidence",
      "in_validation",
      "cancelled",
      "completed",
      "rework_opened",
      "rework_resolved",
      "correction_applied",
      "manual_location_ping",
      "foreground_sync",
    ]);
    const event: WorkOrderEventType = "check_in";
    expect(workOrderEventTypes).toContain(event);
  });

  it("priorities cover low/normal/high/critical", () => {
    expectEnumArray("priorities", priorities, ["low", "normal", "high", "critical"]);
    const priority: Priority = "critical";
    expect(priorities).toContain(priority);
  });

  it("evidence types and status match EVIDENCE_POLICY", () => {
    expectEnumArray("evidenceTypes", evidenceTypes, ["photo", "signature", "attachment"]);
    expectEnumArray("evidenceStatuses", evidenceStatuses, ["pending_upload", "uploaded", "failed"]);
    const type: EvidenceType = "signature";
    expect(evidenceTypes).toContain(type);
    const status: EvidenceStatus = "pending_upload";
    expect(evidenceStatuses).toContain(status);
  });

  it("technician availability covers available/busy/off", () => {
    expectEnumArray("technicianAvailabilities", technicianAvailabilities, [
      "available",
      "busy",
      "off",
    ]);
    const availability: TechnicianAvailability = "busy";
    expect(technicianAvailabilities).toContain(availability);
  });

  it("locationEventSources cover the technician location origins", () => {
    expectEnumArray("locationEventSources", locationEventSources, [
      "pwa_foreground",
      "pwa_manual_ping",
      "web",
      "api",
      "unknown",
    ]);
    const source: LocationEventSource = "pwa_manual_ping";
    expect(locationEventSources).toContain(source);
  });

  it("syncResults cover the idempotent sync outcomes", () => {
    expectEnumArray("syncResults", syncResults, [
      "applied",
      "already_done",
      "rejected",
      "conflict",
      "retry_later",
    ]);
    const result: SyncResult = "already_done";
    expect(syncResults).toContain(result);
  });

  it("GPS policy never promises continuous background tracking", () => {
    expect(gpsPolicy.mode).toBe("event_based");
    expect(gpsPolicy.continuousBackgroundTracking).toBe(false);
  });
});
