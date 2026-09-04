"use client";

import { clientEnv } from "../env/client";

type ApiError = { error?: { message?: string } };

export async function apiFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${clientEnv.apiUrl}${path}`, { credentials: "include", ...init });
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      await clearProtectedLocalData();
      window.location.assign("/login");
    }
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error?.message ?? "Não foi possível concluir a operação.");
  }
  return response;
}

export async function csrfToken(): Promise<string> {
  const response = await apiFetch("/auth/csrf");
  const body = (await response.json()) as { csrfToken: string };
  return body.csrfToken;
}

export async function clearProtectedLocalData(): Promise<void> {
  sessionStorage.clear();
  localStorage.removeItem("crewops:session");
  if (typeof indexedDB !== "undefined") {
    for (const name of await indexedDB
      .databases()
      .then((items) => items.map((item) => item.name).filter(Boolean))) {
      if (name?.startsWith("crewops")) indexedDB.deleteDatabase(name);
    }
  }
}

export async function logout(): Promise<void> {
  const csrf = await csrfToken();
  await apiFetch("/auth/logout", { method: "POST", headers: { "x-csrf-token": csrf } });
  await clearProtectedLocalData();
}
