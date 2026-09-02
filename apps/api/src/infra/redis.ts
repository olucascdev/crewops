import { Redis } from "ioredis";

/**
 * Creates a Redis client for health checks and future queues/realtime fan-out.
 * `lazyConnect` avoids a background reconnect loop at bootstrap; health checks
 * explicitly surface availability. The error handler keeps a Redis outage from
 * becoming an unhandled 'error' event that crashes the process.
 */
export function createRedis(redisUrl: string, keyPrefix?: string): Redis {
  const client = new Redis(redisUrl, {
    keyPrefix: keyPrefix?.length ? `${keyPrefix}:` : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });
  client.on("error", () => {
    // Intentionally swallowed; /health reports Redis status explicitly.
  });
  return client;
}
