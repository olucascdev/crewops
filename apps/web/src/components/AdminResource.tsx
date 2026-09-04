"use client";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch, csrfToken } from "../lib/session";
import { useAuth } from "../hooks/useAuth";

export function AdminResource({ title, endpoint, fields }: { title: string; endpoint: string; fields: Array<{ name: string; label: string; type?: string }> }) {
  const { ready, user } = useAuth(["admin"]); const [items, setItems] = useState<Record<string, unknown>[]>([]); const [error, setError] = useState("");
  const load = () => apiFetch(endpoint).then((r) => r.json()).then(setItems).catch((e) => setError(e.message));
  useEffect(() => { if (user) void load(); }, [user]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries([...form].filter(([, v]) => v !== "")); try { const csrf = await csrfToken(); await apiFetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify(payload) }); event.currentTarget.reset(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar"); } }
  if (!ready) return <main>Carregando sessão…</main>;
  return <main className="fieldShell"><header><span>CREWOPS / ADMIN</span></header><section><p className="context">Cadastro operacional</p><h1>{title}</h1><form className="adminForm" onSubmit={submit}>{fields.map((field) => <label key={field.name}>{field.label}<input name={field.name} type={field.type ?? "text"} required={field.name !== "userId" && field.name !== "branchId"} /></label>)}<button className="primaryButton">Salvar</button></form>{error && <p role="alert" className="formError">{error}</p>}<ul className="adminList">{items.map((item) => <li key={String(item.id)}>{String(item.name ?? item.code ?? item.email ?? item.id)}</li>)}</ul></section></main>;
}
