"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../lib/session";

type Customer = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive";
};
type CustomerPage = { items: Customer[]; page: number; pageSize: number; total: number };
type Branch = { id: string; name: string; code: string };
const allowed = ["admin", "gestor_operacional", "atendente", "despachante"] as const;

export function CustomersPage() {
  const { ready } = useAuth(allowed);
  const [data, setData] = useState<CustomerPage | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready) return;
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    if (branchId) query.set("branchId", branchId);
    void apiFetch(`/customers?${query}`)
      .then((response) => response.json() as Promise<CustomerPage>)
      .then(setData)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Falha ao carregar clientes."),
      );
  }, [ready, search, status, branchId, page]);
  useEffect(() => {
    if (ready)
      void apiFetch("/branches")
        .then((response) => response.json() as Promise<Branch[]>)
        .then(setBranches)
        .catch(() => {});
  }, [ready]);
  if (!ready) return <p>Carregando…</p>;
  return (
    <main>
      <header>
        <h1>Clientes</h1>
        <Link href="/painel/clientes/novo">Novo cliente</Link>
      </header>
      <p>Cadastre o cliente separadamente dos seus locais de atendimento.</p>
      <label>
        Buscar{" "}
        <input
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Nome, documento, e-mail ou telefone"
        />
      </label>
      <label>
        Status{" "}
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </label>
      <label>
        Filial{" "}
        <select
          value={branchId}
          onChange={(event) => {
            setPage(1);
            setBranchId(event.target.value);
          }}
        >
          <option value="">Todas</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Documento</th>
            <th>Contato</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Link href={`/painel/clientes/${customer.id}`}>{customer.name}</Link>
              </td>
              <td>{customer.document ?? "—"}</td>
              <td>{customer.email ?? customer.phone ?? "—"}</td>
              <td>{customer.status === "active" ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data?.items.length === 0 && <p>Nenhum cliente encontrado.</p>}
      <footer>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Anterior
        </button>
        <span>
          {" "}
          Página {page} de {Math.max(1, Math.ceil((data?.total ?? 0) / 20))}{" "}
        </span>
        <button
          type="button"
          disabled={!data || page * data.pageSize >= data.total}
          onClick={() => setPage((current) => current + 1)}
        >
          Próxima
        </button>
      </footer>
    </main>
  );
}
