/**
 * Nest injection tokens for infrastructure dependencies. Used instead of
 * concrete class tokens so tests can swap real pools/clients for fakes.
 */
export const DB_POOL = "DB_POOL";
export const REDIS_CLIENT = "REDIS_CLIENT";
export const DB_CLIENT = "DB_CLIENT";
