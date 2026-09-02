import { describe, expect, it } from "vitest";
import {
  type AppEnvironment,
  appEnvironments,
  type ErrorCode,
  errorCodes,
  gpsPolicy,
  type TechnicianEventType,
  technicianEventTypes,
  type WorkOrderStatus,
  workOrderStatuses,
} from "../src/index";

describe("shared constants", () => {
  it("appEnvironments covers the supported environments", () => {
    expect(appEnvironments).toEqual(["development", "test", "production"]);
    const env: AppEnvironment = "development";
    expect(appEnvironments).toContain(env);
  });

  it("errorCodes covers the stable API contract codes", () => {
    expect(errorCodes).toContain("VALIDATION_ERROR");
    expect(errorCodes).toContain("UNAUTHORIZED");
    const code: ErrorCode = "CONFLICT";
    expect(errorCodes).toContain(code);
  });

  it("workOrderStatuses are stable and Typed", () => {
    expect(workOrderStatuses).toContain("open");
    expect(workOrderStatuses).toContain("done");
    const status: WorkOrderStatus = "assigned";
    expect(workOrderStatuses).toContain(status);
  });

  it("technicianEventTypes are stable and Typed", () => {
    expect(technicianEventTypes).toContain("foreground_sync");
    const event: TechnicianEventType = "check_in";
    expect(technicianEventTypes).toContain(event);
  });

  it("GPS policy never promises continuous background tracking", () => {
    expect(gpsPolicy.mode).toBe("event_based");
    expect(gpsPolicy.continuousBackgroundTracking).toBe(false);
  });
});
