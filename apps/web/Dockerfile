# CrewOps web — Next.js PWA. NEXT_PUBLIC_* vars are inlined at build time.
# A deployment/pipeline performs the publish-time env injection; the ARG defaults
# match local development (see .env.example).

FROM node:20-alpine

WORKDIR /app

# Built-time public env (inlined into the client bundle).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_WS_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Install dependencies first (layer cache).
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci

# Copy sources, build the shared package to dist, then build the PWA.
COPY . .
RUN npm run build -w @crewops/shared \
  && npm run build -w @crewops/web

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@crewops/web"]
