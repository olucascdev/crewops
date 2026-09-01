# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js PWA for the operational web/admin and technician mobile web experience, NestJS for the API, PostgreSQL with Drizzle ORM for relational data, Redis for jobs, cache, realtime fan-out, and operational queues.

## Users

CrewOps is built first for small and regional internet providers. Primary users are dispatchers, owners, coordinators, and field technicians working across one company with multiple branches/cities.

## Product Purpose

CrewOps helps an internet provider see and control field work: customer issues, service orders, technician assignment, status updates, evidence, signatures, branch-level visibility, and operational maps.

## Positioning

CrewOps is not a generic SaaS cockpit. Its core mechanism is event-based field execution: every important technician action updates the operation with status, timestamp, location when permitted, and evidence.

## Operating Context

The first pilot targets one provider company with branches in nearby cities. The operation needs fast dispatch, clear technician status, a map for recent field events, photo evidence, customer signatures, and simple dashboards.

## Capabilities and Constraints

- The first mobile experience is a PWA, not a native background tracker.
- GPS is operational and event-based: location is captured during explicit field events such as check-in, arrival, start service, finish service, evidence upload, manual location ping, or foreground sync.
- CrewOps must not promise continuous background GPS tracking from the PWA.
- The app should support offline or semi-offline work by queuing technician events locally and syncing when connectivity returns.
- The product should allow a future Go service for high-volume GPS/event processing, route calculations, or heavy reports.

## Brand Commitments

The product name is CrewOps. The UX should feel direct, operational, and easy for a provider owner to understand without technical vocabulary.

## Evidence on Hand

The existing FieldOps PHP/MySQL project and `/docs` folder are the functional reference for modules, workflows, risks, and release history. Do not copy the old implementation blindly; use it as product research.

## Product Principles

- Make the current field operation understandable within seconds.
- Favor technician workflow clarity over module breadth.
- Treat every operational action as an auditable event.
- Keep the first pilot focused on provider operations, branches, technicians, customers, service orders, evidence, and maps.
- Build a stack that is simple enough for a small team and open enough for specialized services later.
