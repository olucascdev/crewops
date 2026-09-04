"use client";
import { LogoutButton } from "../../components/LogoutButton";
import { useAuth } from "../../hooks/useAuth";
const panelRoles = ["admin", "gestor_operacional", "atendente", "despachante"] as const;
export default function PainelPage() { const { user, ready } = useAuth([...panelRoles]); if (!ready || !user) return <main>Carregando sessão…</main>; return <main className="fieldShell"><header><span>CREWOPS / PAINEL</span><LogoutButton /></header><section><p className="context">{user.name} · {user.role}</p><h1>Painel operacional</h1><p>Gerencie filiais, usuários e técnicos no piloto.</p></section></main>; }
