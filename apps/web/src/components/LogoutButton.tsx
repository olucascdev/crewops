"use client";
import { useRouter } from "next/navigation";
import { logout } from "../lib/session";
export function LogoutButton() { const router = useRouter(); return <button className="textButton" onClick={async () => { await logout(); router.replace("/login"); }}>Sair</button>; }
