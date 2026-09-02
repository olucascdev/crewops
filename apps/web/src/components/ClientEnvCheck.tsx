"use client";

import type { ReactNode } from "react";
import { assertClientEnv } from "../env/client";

/**
 * Client-side guard around the PWA shell. NEXT_PUBLIC_* vars are inlined at
 * build time; if a required one was omitted, `assertClientEnv()` throws during
 * render so the app fails loudly instead of running against `undefined`.
 * Server-side validation happens in `next.config.ts` via `loadServerEnv`.
 */
export function ClientEnvCheck({ children }: { children: ReactNode }) {
  assertClientEnv();
  return <>{children}</>;
}
