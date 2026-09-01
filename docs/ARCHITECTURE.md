# CrewOps Architecture

## Stack Decision

CrewOps uses:

- Next.js PWA for the web/admin and technician mobile web surface
- NestJS for the backend API
- PostgreSQL for relational operational data
- Drizzle ORM for typed schema and migrations
- Redis for queues, cache, jobs, and realtime fan-out
- WebSocket events for live operational updates

This stack is intentionally TypeScript-first. It keeps the product fast to build while leaving a clean boundary for future Go services.

## Why Not Continuous PWA GPS

CrewOps starts with event-based GPS because PWA background behavior is not reliable enough for continuous technician tracking across mobile browsers.

The API and data model store `technician_location_events`, not an always-on tracking stream. The event record answers:

- which technician generated the event
- which operational action produced it
- when the location was captured
- which work order it relates to, when applicable
- accuracy and source

If continuous tracking becomes a hard product requirement, add a native app capability or a dedicated mobile service. The backend model can evolve to support that without changing the first pilot promise.

## Service Boundaries

Initial modules:

- Identity: users, roles, sessions
- Organization: company and branches
- Field Crew: technicians and availability
- Customers: customers and addresses
- Operations: tickets, work orders, dispatch, status
- Field Events: timeline, GPS events, evidence
- Realtime: WebSocket messages and Redis fan-out

Deferred modules:

- finance
- SaaS billing
- external public API
- webhook marketplace
- advanced analytics
- continuous tracking

## Future Go Boundary

Go can be added later as an internal service for:

- high-volume location ingestion
- route and distance processing
- SLA recalculation jobs
- report generation
- event stream compaction

NestJS remains the product API and orchestration layer unless measured load proves otherwise.
