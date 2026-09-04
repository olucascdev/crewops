"use client";

import {
  createServiceAddressSchema,
  updateCustomerSchema,
  updateServiceAddressSchema,
} from "@crewops/shared";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch, csrfToken } from "../lib/session";

type Customer = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive";
};
type Address = {
  id: string;
  label: string;
  street: string;
  number: string | null;
  district: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  instructions: string | null;
};
const allowed = ["admin", "gestor_operacional", "atendente", "despachante"] as const;

function formPayload(form: HTMLFormElement) {
  return Object.fromEntries([...new FormData(form)].filter(([, value]) => value !== ""));
}

function AddressFields({ address }: { address?: Address }) {
  return (
    <>
      <label>
        Identificação <input name="label" defaultValue={address?.label ?? "Principal"} required />
      </label>
      <label>
        Rua <input name="street" defaultValue={address?.street} required />
      </label>
      <label>
        Número <input name="number" defaultValue={address?.number ?? ""} />
      </label>
      <label>
        Bairro <input name="district" defaultValue={address?.district ?? ""} />
      </label>
      <label>
        Cidade <input name="city" defaultValue={address?.city} required />
      </label>
      <label>
        UF <input name="state" defaultValue={address?.state} required minLength={2} maxLength={2} />
      </label>
      <label>
        CEP <input name="postalCode" defaultValue={address?.postalCode ?? ""} />
      </label>
      <fieldset>
        <legend>Coordenadas (opcional; preencha ambas)</legend>
        <label>
          Latitude{" "}
          <input
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            defaultValue={address?.latitude ?? ""}
          />
        </label>
        <label>
          Longitude{" "}
          <input
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            defaultValue={address?.longitude ?? ""}
          />
        </label>
      </fieldset>
      <label>
        Instruções <textarea name="instructions" defaultValue={address?.instructions ?? ""} />
      </label>
    </>
  );
}

export function CustomerDetails({ id }: { id: string }) {
  const { ready } = useAuth(allowed);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const load = () =>
    Promise.all([
      apiFetch(`/customers/${id}`).then((r) => r.json() as Promise<Customer>),
      apiFetch(`/customers/${id}/service-addresses`).then((r) => r.json() as Promise<Address[]>),
    ])
      .then(([current, places]) => {
        setCustomer(current);
        setAddresses(places);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Falha ao carregar cliente."),
      );
  useEffect(() => {
    if (ready) void load();
  }, [ready, id]);

  async function updateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = updateCustomerSchema.safeParse(formPayload(event.currentTarget));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise os dados do cliente.");
      return;
    }
    try {
      const csrf = await csrfToken();
      await apiFetch(`/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(parsed.data),
      });
      setEditingCustomer(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o cliente.");
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>, addressId?: string) {
    event.preventDefault();
    setError("");
    const values = formPayload(event.currentTarget);
    const parsed = (addressId ? updateServiceAddressSchema : createServiceAddressSchema).safeParse(
      addressId ? values : { ...values, customerId: id },
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise os dados do endereço.");
      return;
    }
    try {
      const csrf = await csrfToken();
      await apiFetch(addressId ? `/service-addresses/${addressId}` : "/service-addresses", {
        method: addressId ? "PATCH" : "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(parsed.data),
      });
      event.currentTarget.reset();
      setEditingAddress(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o endereço.");
    }
  }

  if (!ready) return <p>Carregando…</p>;
  return (
    <main>
      <h1>{customer?.name ?? "Cliente"}</h1>
      {customer && (
        <>
          {editingCustomer ? (
            <form onSubmit={updateCustomer}>
              <label>
                Nome <input name="name" defaultValue={customer.name} required minLength={2} />
              </label>
              <label>
                Documento <input name="document" defaultValue={customer.document ?? ""} />
              </label>
              <label>
                E-mail <input name="email" type="email" defaultValue={customer.email ?? ""} />
              </label>
              <label>
                Telefone <input name="phone" defaultValue={customer.phone ?? ""} />
              </label>
              <label>
                Status{" "}
                <select name="status" defaultValue={customer.status}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </label>
              <button>Salvar alterações</button>
              <button type="button" onClick={() => setEditingCustomer(false)}>
                Cancelar
              </button>
            </form>
          ) : (
            <>
              <p>
                {customer.document ?? "Sem documento"} ·{" "}
                {customer.email ?? customer.phone ?? "Sem contato"} ·{" "}
                {customer.status === "active" ? "Ativo" : "Inativo"}
              </p>
              <button type="button" onClick={() => setEditingCustomer(true)}>
                Editar cliente
              </button>
            </>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <section>
        <h2>Locais de atendimento</h2>
        {addresses.map((address) => (
          <article key={address.id}>
            <h3>{address.label}</h3>
            {editingAddress === address.id ? (
              <form onSubmit={(event) => void saveAddress(event, address.id)}>
                <AddressFields address={address} />
                <button>Salvar local</button>
                <button type="button" onClick={() => setEditingAddress(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <p>
                  {address.street}, {address.number ?? "s/n"} —{" "}
                  {address.district ? `${address.district}, ` : ""}
                  {address.city}/{address.state} {address.postalCode ?? ""}
                </p>
                {address.latitude && address.longitude ? (
                  <p>
                    Coordenadas: {address.latitude}, {address.longitude}
                  </p>
                ) : (
                  <p>Sem coordenadas registradas.</p>
                )}
                {address.instructions && <p>{address.instructions}</p>}
                <button type="button" onClick={() => setEditingAddress(address.id)}>
                  Editar local
                </button>
              </>
            )}
          </article>
        ))}
        {addresses.length === 0 && <p>Este cliente ainda não possui local de atendimento.</p>}
      </section>
      <section>
        <h2>Adicionar local</h2>
        <form onSubmit={(event) => void saveAddress(event)}>
          <AddressFields />
          <button>Salvar local</button>
        </form>
      </section>
    </main>
  );
}
