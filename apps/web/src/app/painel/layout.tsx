"use client";

import { useAuth } from "../../hooks/useAuth";

const panelRoles = ["admin", "gestor_operacional", "atendente", "despachante"] as const;

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useAuth(panelRoles);
  if (!ready) return <p>Carregando…</p>;
  return children;
}
