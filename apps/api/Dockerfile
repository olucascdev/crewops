# CrewOps API — build and run the NestJS service from the monorepo.
# Multi-stage not required for the pilot; a single image keeps the build simple
# and reproducible. Tag/registry pinning belongs to the deployment pipeline.

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache). npm ci needs every workspace manifest.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN npm ci

# Copy sources and build the API. Workstation packages build to dist first so
# `node apps/api/dist/main.js` can require them at runtime.
COPY . .
RUN npm run build -w @crewops/shared \
  && npm run build -w @crewops/db \
  && npm run build -w @crewops/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
