"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthMe, UserRole } from "@crewops/shared";
import { clearProtectedLocalData, apiFetch } from "../lib/session";

export function useAuth(allowed: readonly UserRole[]) {
  const router = useRouter();
  const [user, setUser] = useState<AuthMe | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void apiFetch("/auth/me").then((response) => response.json() as Promise<AuthMe>).then((current) => {
      if (!allowed.includes(current.role)) { router.replace(current.role === "tecnico" ? "/campo" : "/painel"); return; }
      setUser(current);
    }).catch(async () => { await clearProtectedLocalData(); router.replace("/login"); }).finally(() => setReady(true));
  }, [allowed, router]);
  return { user, ready };
}
