# CrewOps

CrewOps is an operations platform for internet providers and field service teams.

The first version is a focused pilot stack:

- `apps/web`: Next.js PWA for admin and technician mobile web flows
- `apps/api`: NestJS API
- `packages/db`: Drizzle schema and database helpers
- `packages/shared`: shared TypeScript types and operational constants
- PostgreSQL as the source of truth
- Redis for jobs, queues, cache, and realtime fan-out

## GPS Policy

CrewOps starts with **operational, event-based GPS**.

The PWA does not promise continuous background tracking. It captures location only around explicit operational moments, such as:

- technician check-in
- arrival at the customer site
- service start
- service finish
- evidence upload
- manual location ping
- foreground sync while the PWA is open

This is intentional. Browser PWAs have platform limits around background execution, especially on mobile. If the product later needs continuous tracking, the correct path is a native app or a dedicated mobile capability, not pretending the PWA can reliably track in the background.

## Local Shape

```txt
crewops/
  apps/
    api/
    web/
  packages/
    db/
    shared/
```

## First Pilot Scope

- company and branches
- users and technician profiles
- customers and service addresses
- tickets and work orders
- technician event timeline
- event-based GPS locations
- photo/signature evidence
- operational dashboard
- map of recent technician and work order events

Advanced SaaS billing, external webhooks, BI, finance, and notification digests stay outside the first pilot.
