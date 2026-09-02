import { type WorkOrderEventType, workOrderEventTypes } from "@crewops/shared";
import { Body, Controller, Get, Post } from "@nestjs/common";

type LocationEventInput = {
  technicianId: string;
  workOrderId?: string;
  eventType: WorkOrderEventType;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
};

@Controller("/operations")
export class OperationsController {
  @Get("/gps-policy")
  gpsPolicy() {
    return {
      mode: "event_based",
      continuousBackgroundTracking: false,
      allowedEvents: workOrderEventTypes,
      message:
        "CrewOps PWA stores GPS as operational events. It does not run continuous background tracking.",
    };
  }

  @Post("/location-events")
  createLocationEvent(@Body() input: LocationEventInput) {
    return {
      accepted: true,
      event: {
        ...input,
        capturedAt: input.capturedAt ?? new Date().toISOString(),
        source: "pwa_foreground",
      },
    };
  }
}
