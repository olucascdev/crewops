export const workOrderStatuses = [
  "draft",
  "open",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "blocked",
  "done",
  "cancelled"
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export const technicianEventTypes = [
  "check_in",
  "assigned",
  "en_route",
  "arrived",
  "service_started",
  "evidence_uploaded",
  "service_finished",
  "manual_location_ping",
  "foreground_sync"
] as const;

export type TechnicianEventType = (typeof technicianEventTypes)[number];

export const gpsPolicy = {
  mode: "event_based",
  continuousBackgroundTracking: false,
  statement:
    "CrewOps PWA captures operational GPS during explicit technician events and foreground sync; it is not a continuous background tracker."
} as const;
