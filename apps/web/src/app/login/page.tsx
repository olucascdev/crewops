"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, csrfToken } from "../../lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const csrf = await csrfToken();
      const response = await apiFetch("/auth/login", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      const body = (await response.json()) as { redirectTo: string };
      router.replace(body.redirectTo);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao entrar."); }
    finally { setPending(false); }
  }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="context">CrewOps · acesso operacional</p><h1>Entre para operar.</h1><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>{error && <p role="alert" className="formError">{error}</p>}<button className="primaryButton" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button></form></main>;
}
