"use client";
import { LogoutButton } from "../../components/LogoutButton";
import { useAuth } from "../../hooks/useAuth";
export default function CampoPage() { const { ready } = useAuth(["tecnico"]); if (!ready) return <main>Carregando sessão…</main>; return <main className="fieldShell"><header><span>CREWOPS / CAMPO</span><LogoutButton /></header><section><p className="context">Experiência do técnico</p><h1>Suas ordens aparecem aqui.</h1><p>Trabalhe online ou offline. A sincronização e as ordens atribuídas serão incluídas na próxima fatia vertical.</p></section></main>; }
