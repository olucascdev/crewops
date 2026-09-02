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

## Local Setup From Scratch

Requirements:

- Node.js **24** (aligns with `.nvmrc` and `"engines"`)
- npm (bundled with Node 24; `npm ci` uses the committed lockfile)
- Docker with the Compose plugin (for PostgreSQL/PostGIS, Redis, API and web)
- `make`/`git` for cloning; a shell to run the commands

```bash
# 1. Clone and enter the repo
git clone git@github.com:olucascdev/crewops.git
cd crewops

# 2. Create the local environment from the typed template (no real secrets)
cp .env.example .env

# 3. Install with the committed lockfile (fails if lockfile is out of date)
npm ci

# 4. Start the dependency plus app stack (Postgres/PostGIS, Redis, API, web)
docker compose up -d --wait

# 5. Apply the Drizzle migrations and verify they are up to date
npm run db:migrate
npm run db:migrate:check

# 6. Seed a minimal synthetic pilot dataset (company, branch, users, technician, customer, address)
npm run db:seed

# 7. Run everything in dev mode
npm run dev
```

When running locally with `npm run dev`:

- web: http://localhost:3000
- API: http://localhost:4000

After the stack is up you can confirm it is healthy:

```bash
curl -sf http://localhost:4000/health/live
curl -sf http://localhost:4000/health/ready
curl -sf http://localhost:3000
```

### Without Docker

If you prefer not to use Docker, provide a local PostgreSQL/PostGIS service and a local Redis, then point the app at them. The connection URLs come from `.env`:

- `DATABASE_URL` / `TEST_DATABASE_URL` — PostgreSQL + PostGIS
- `REDIS_URL` / `TEST_REDIS_URL` — Redis

Prerequisites for that path: a PostgreSQL server with the **PostGIS** extension enabled, and a Redis server running locally on the ports in `.env`. Everything else (`npm ci`, `npm run dev`, migrations, seed, tests) is unchanged.

## Testing

Run the static checks and unit suite for the whole monorepo:

```bash
npm run lint
npm run typecheck
npm run test:unit
```

Run integration tests (these need reachable PostgreSQL/PostGIS and Redis; they are automatically skipped when the services are unreachable):

```bash
npm run test:integration
```

Run the PWA smoke E2E (builds the web app, then runs Playwright against it):

```bash
npm run test:e2e
```

### Database integrity

Migrations are generated once (`npm run db:generate`), applied deterministically, and checked with `npm run db:migrate:check` (alias: `npm run db:status`). Rollback (`npm run db:rollback`) is a **development-only** helper that never runs in production; it reuses the matching `*.down.sql` migration.

`db:rollback` refuses to run when `NODE_ENV=production`.

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
