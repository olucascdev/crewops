"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createCustomerSchema } from "@crewops/shared";
import { csrfToken, apiFetch } from "../lib/session";

export function CustomerForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const parsed = createCustomerSchema.safeParse(
      Object.fromEntries([...values].filter(([, value]) => value !== "")),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise os dados do cliente.");
      setSaving(false);
      return;
    }
    try {
      const csrf = await csrfToken();
      const response = await apiFetch("/customers", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(parsed.data),
      });
      const customer = (await response.json()) as { id: string };
      router.replace(`/painel/clientes/${customer.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main>
      <h1>Novo cliente</h1>
      <form onSubmit={submit}>
        <label>
          Nome <input name="name" required minLength={2} />
        </label>
        <label>
          Documento <input name="document" />
        </label>
        <label>
          E-mail <input name="email" type="email" />
        </label>
        <label>
          Telefone <input name="phone" />
        </label>
        <button disabled={saving}>{saving ? "Salvando…" : "Salvar cliente"}</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
