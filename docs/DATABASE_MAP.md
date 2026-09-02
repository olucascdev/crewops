# Dicionário de Dados — CrewOps / Mapeamento Legado → Novo

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 5.10
> Data de registro: **2026-09-02**
> Status: **PROPOSTO — implementação do Grupo 5; aprovação PENDENTE.** Este dicionário documenta o schema de `packages/db/src/schema.ts` (migrations `0000`+`0001`) como fonte para os implementadores dos grupos 6+ e para reconciliação de migração. Não altera regras aprovadas; reflete as decisões de modelagem até aqui. Decisões de produto/operação permanecem PENDING nos R-IDs/D-IDs citados.

> **Fonte do modelo:** `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md`, `docs/GLOSSARY.md`, `docs/STATE_MATRICES.md`, `docs/REQUIRED_FIELDS.md`, `docs/EVIDENCE_POLICY.md`, `docs/OPERATIONAL_POLICIES.md`. O legado PHP é referência somente leitura.

---

## 1. Convenções gerais

- **Identificadores:** todos `uuid` (`gen_random_uuid()`); string UUID no transporte (`packages/shared`).
- **Tempo:** `timestamp with time zone` (UTC) em todas as colunas de data/hora. No transporte, strings ISO 8601 com sufixo `Z`.
- **Isolamento por empresa:** toda linha operacional tem `company_id` (FK → `companies.id`) ou é a própria raiz `companies`. Referências entre entidades operacionais usam **FKs compostas `(company_id, id)`** para impedir vínculo entre empresas (tarefa 5.8).
- **Soft delete:** `deleted_at timestamptz` (nullable) nas tabelas mutáveis; queries ativas filtram `deleted_at IS NULL` (aplicação a partir do grupo 6). `work_order_events` é **imutável** (sem `updated_at`/`deleted_at`).
- **Enums:** definidos em `packages/db/src/schema.ts` e replicados como constantes em `packages/shared/src/index.ts`; a única fonte nominal é `packages/shared`.
- **PostGIS:** extensão habilitada; `geometry(Point, 4326)` em `service_addresses.geometry` e `technician_locations.geometry`, ambos com índice GiST.

---

## 2. Tabelas

### `companies`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | varchar(160) | not null |
| `document` | varchar(32) | nullable |
| `active` | boolean | default `true`, not null |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Legado:** `tenants`. **Decisão:** manter como raiz de isolamento; `slug` adiado (sem nome de empresa curto ainda).

### `branches`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id`; parte da unique `(company_id, code)` |
| `code` | varchar(40) | not null |
| `name` | varchar(160) | not null |
| `city` | varchar(120) | not null |
| `state` | varchar(2) | not null |
| `timezone` | varchar(60) | default `America/Sao_Paulo`, not null |
| `street`/`number`/`district`/`postal_code` | varchar | opcionais (endereço da filial) |
| `active` | boolean | default `true`, not null |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Índices:** `(company_id)`, `(company_id, active)`; unique `(company_id, code)`, `(company_id, id)`.

**Legado:** não há tabela equivalente direta (filial era `sites`/`tenant`). **Decisão:** nova; `code` e `timezone` obrigatórios (decisão 2 do Grupo 5). Endereço completo opcional até `REQUIRED_FIELDS.md` §3.

### `users`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta `(company_id, branch_id)` → `branches` |
| `name` | varchar(160) | not null |
| `email` | varchar(190) | not null; unique `(company_id, email)` |
| `password_hash` | text | not null |
| `role` | `user_role` | enum; default `atendente` |
| `status` | `user_status` | enum; default `active` |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `user_role` = `admin | gestor_operacional | atendente | despachante | tecnico`; `user_status` = `active | inactive | blocked`.

**Índices:** `(company_id)`, `(company_id, status)`; unique `(company_id, email)`, `(company_id, id)`.

**Legado:** `users` + RBAC simplificado. **Decisão:** `(company_id, email)` até Produto ratificar escopo global vs empresa (D-109). `status` impede login quando `inactive`/`blocked` (validação no Grupo 6).

### `sessions`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK composta `(company_id, user_id)` → `users` |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta `(company_id, branch_id)` → `branches` |
| `role` | `user_role` | not null (sessão carrega papel) |
| `refresh_token_hash` | text | not null; **apenas hash**, nunca o token em claro |
| `expires_at` | timestamptz | not null |
| `revoked_at` | timestamptz | nullable |
| `device_id` | varchar(120) | nullable |
| `ip_hash` | varchar(64) | nullable |
| `user_agent` | text | nullable |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Índices:** `(user_id)`, `(company_id)`, `(refresh_token_hash)`, `(expires_at)`, `(revoked_at)`.

**Legado:** inexistente. **Decisão:** mecanismo de cookie/token é do Grupo 6; aqui só o schema (decisão 8).

### `technicians`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta `(company_id, branch_id)` → `branches` |
| `user_id` | uuid | FK composta `(company_id, user_id)` → `users`; unique `(company_id, user_id)` |
| `phone` | varchar(32) | nullable |
| `employee_id` | varchar(40) | nullable (matrícula/código interno) |
| `status` | `technician_status` | enum; default `active` |
| `availability_status` | `technician_availability` | enum; default `available` |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `technician_status` = `active | inactive`; `technician_availability` = `available | busy | off`.

**Índices:** `(company_id)`, `(branch_id)`, `(company_id, status)`, `(company_id, availability_status)`, `(user_id)`.

**Legado:** `users` (perfil `technician`) + `technician_profiles`. **Decisão:** **sem** People Core completo do legado (sem grade semanal, `operational_type`, `person_type`, histórico salarial). Grade semanal adiada (R-015); `availability_status` default `available` (decisão 3).

### `customers`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta `(company_id, branch_id)` → `branches` |
| `name` | varchar(180) | not null |
| `document` | varchar(32) | nullable; unique `(company_id, document)` (nulos permitidos) |
| `email` | varchar(190) | nullable |
| `phone` | varchar(32) | nullable |
| `status` | `customer_status` | enum; default `active` |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `customer_status` = `active | inactive`.

**Índices:** `(company_id)`, `(branch_id)`, `(company_id, status)`, `(company_id, document)`.

**Legado:** `clients`. **Decisão:** entidade de identidade, **separada** do endereço (`service_address`). Unique `(company_id, document)` permitindo nulos (decisão 4).

### `service_addresses` (era `customer_addresses`)

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `customer_id` | uuid | FK composta `(company_id, customer_id)` → `customers` |
| `label` | varchar(120) | default `Principal`, not null |
| `street` | varchar(180) | not null |
| `number` | varchar(32) | nullable |
| `district` | varchar(120) | nullable |
| `city` | varchar(120) | not null |
| `state` | varchar(2) | not null |
| `postal_code` | varchar(16) | nullable |
| `latitude` / `longitude` | numeric(10,7) | nullable |
| `geometry` | `geometry(Point,4326)` | PostGIS; **nullable** (OS sem coordenada permitida); índice GiST |
| `contact_name` | varchar(160) | nullable |
| `contact_phone` | varchar(32) | nullable |
| `instructions` | text | nullable |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Índices:** `(company_id)`, `(customer_id)`, `(company_id, city, state)`, GiST `(geometry)`.

**Legado:** `sites`. **Decisão:** renomeada de `customer_addresses`; cliente e endereço separados; coordenada nula aceita; snapshot preservado em `work_orders.address_snapshot`.

### `tickets`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta `(company_id, branch_id)` → `branches` |
| `customer_id` | uuid | FK composta → `customers` |
| `address_id` | uuid | FK composta → `service_addresses` |
| `number` | varchar(32) | not null; unique `(company_id, number)` |
| `title` | varchar(180) | not null |
| `description` | text | nullable |
| `priority` | `priority` | enum; default `normal` |
| `status` | `ticket_status` | enum; default `open` |
| `assigned_to_user_id` | uuid | FK composta → `users` |
| `created_by_user_id` | uuid | not null; FK composta → `users` |
| `resolved_at` / `closed_at` | timestamptz | nullable |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `ticket_status` = `open | in_progress | waiting | resolved | closed | cancelled`; `priority` = `low | normal | high | critical`.

**Índices:** `(company_id)`, `(branch_id)`, `(company_id, status)`, `(company_id, priority)`, `(company_id, created_at)`.

**Legado:** `tickets`. **Decisão:** estados conforme `docs/STATE_MATRICES.md` §1; `resolved_at`/`closed_at` preenchidos nas respectivas transições.

### `work_orders`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta → `branches` |
| `ticket_id` | uuid | FK composta → `tickets` (opcional) |
| `customer_id` | uuid | FK composta → `customers` |
| `address_id` | uuid | FK composta → `service_addresses` |
| `technician_id` | uuid | FK composta → `technicians` |
| `current_dispatch_id` | uuid | FK `(company_id, current_dispatch_id)` → `dispatches`, `ON DELETE SET NULL` |
| `number` | varchar(32) | not null; unique `(company_id, number)` |
| `title` | varchar(180) | not null |
| `description` | text | nullable |
| `status` | `work_order_status` | enum; default `pending` |
| `type` | `work_order_type` | enum; default `corrective` |
| `priority` | `priority` | enum; default `normal` |
| `scheduled_at` / `due_at` / `started_at` / `validated_at` / `cancelled_at` / `completed_at` | timestamptz | nullable |
| `cancellation_reason` | text | nullable |
| `address_snapshot` | jsonb | snapshot do endereço no atendimento (preenchido na criação — Grupo 8) |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `work_order_status` = `pending | scheduled | dispatched | in_progress | waiting_evidence | in_validation | waiting_parts | completed | cancelled | rework`; `work_order_type` = `corrective | preventive | installation | survey`.

**Índices de fila:** `(company_id, status)`, `(company_id, technician_id, status)`, `(company_id, due_at, status)`, `(company_id, branch_id, status)`, `(company_id, scheduled_at)`. Unique `(company_id, number)`, `(company_id, id)`.

**Legado:** `work_orders`. **Decisão:** `status` reflete estado atual; histórico em `work_order_events`; estados reduzidos conforme `docs/STATE_MATRICES.md` §2. `address_snapshot` é prova histórica (decisão 5).

### `dispatches`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta → `branches` |
| `work_order_id` | uuid | FK composta → `work_orders` |
| `technician_id` | uuid | FK composta → `technicians` (nullable) |
| `previous_technician_id` | uuid | FK composta → `technicians` (nullable) |
| `author_user_id` | uuid | not null; FK composta → `users` |
| `event_type` | `dispatch_event_type` | enum; not null |
| `scheduled_at` / `due_at` | timestamptz | nullable |
| `reason` | text | nullable |
| `created_at` | timestamptz | default `now()`, not null |

**Enums:** `dispatch_event_type` = `dispatch_created | technician_assigned | technician_reassigned | schedule_changed | unassigned`.

**Índices:** `(company_id, work_order_id)`, `(company_id, technician_id)`, `(work_order_id, created_at)`. Unique `(company_id, id)`.

**Legado:** lógica em `WorkOrderController::dispatch`. **Decisão:** audita atribuição/reatribuição/desatribuição com autor e justificativa (sem roteirização).

### `work_order_events` (imutável)

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta → `branches` |
| `work_order_id` | uuid | FK composta → `work_orders` |
| `technician_id` | uuid | FK composta → `technicians` |
| `actor_user_id` | uuid | FK composta → `users` |
| `actor_role` | `user_role` | nullable |
| `event_type` | `work_order_event_type` | enum; not null |
| `payload` | jsonb | default `{}`, not null |
| `metadata` | jsonb | nullable |
| `idempotency_key` | text | not null |
| `occurred_at` | timestamptz | not null (horário do dispositivo/negócio) |
| `received_at` | timestamptz | default `now()`, not null (horário do servidor) |
| `created_offline` | boolean | default `false`, not null |
| `device_id` | varchar(120) | nullable |
| `lat` / `lng` | numeric(10,7) | nullable |
| `accuracy_meters` | integer | nullable |
| `location_event_id` | uuid | FK composta → `technician_locations` |
| `dispatch_id` | uuid | FK composta → `dispatches` |
| `evidence_id` | uuid | FK composta → `evidences` |
| `correction_for_event_id` | uuid | FK composta (auto-referência) → `work_order_events` |
| `created_at` | timestamptz | default `now()`, not null |

**Enums:** `work_order_event_type` = `dispatch_created | technician_assigned | technician_reassigned | schedule_changed | unassigned | check_in | service_started | service_finished | status_changed | note_added | evidence_uploaded | waiting_parts | waiting_evidence | in_validation | cancelled | completed | rework_opened | rework_resolved | correction_applied | manual_location_ping | foreground_sync`.

**Índices:** `(company_id, work_order_id, received_at)`, `(work_order_id, occurred_at)`, `(company_id, idempotency_key)`, `(company_id, device_id, idempotency_key)`, `(technician_id, received_at)`, `(correction_for_event_id)`. Unique `(company_id, device_id, idempotency_key)`, `(company_id, id)`.

**Legado:** `work_order_timeline` + `work_order_dispatch_events` + `work_order_rework_events`; `notes` migra para `payload.note_added`. **Decisão:** imutável (sem `updated_at`/`deleted_at`); `occurred_at` pode ser anterior a `received_at`; sem `occurred_at` no futuro além de tolerância (validação de aplicação).

### `technician_locations` (era `technician_location_events`)

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `branch_id` | uuid | FK composta → `branches` |
| `technician_id` | uuid | FK composta → `technicians` |
| `work_order_id` | uuid | FK composta → `work_orders` (opcional) |
| `event_id` | uuid | FK `(company_id, event_id)` → `work_order_events` (opcional) |
| `latitude` / `longitude` | numeric(10,7) | not null (redundante p/ leitura) |
| `accuracy_meters` | integer | nullable |
| `geometry` | `geometry(Point,4326)` | not null; índice GiST |
| `captured_at` | timestamptz | not null |
| `received_at` | timestamptz | default `now()`, not null |
| `source` | `location_event_source` | enum; default `pwa_foreground` |
| `metadata` | jsonb | nullable |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `location_event_source` = `pwa_foreground | pwa_manual_ping | web | api | unknown`.

**Índices:** `(company_id)`, `(technician_id)`, `(technician_id, captured_at DESC)`, `(company_id, captured_at)`, GiST `(geometry)`.

**Legado:** apenas `technician_profiles.last_latitude/longitude` (última posição). **Decisão:** pontos por evento + última posição conhecida; sem rastreamento contínuo (`docs/GPS_POLICY.md`).

### `evidences` (era `work_order_evidences`)

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `work_order_id` | uuid | FK composta → `work_orders` |
| `technician_id` | uuid | FK composta → `technicians` |
| `file_id` | uuid | FK composta → `files`; **nullable** até confirmação |
| `event_id` | uuid | FK `(company_id, event_id)` → `work_order_events` (opcional) |
| `evidence_type` | `evidence_type` | enum; default `photo` |
| `status` | `evidence_status` | enum; default `pending_upload` |
| `idempotency_key` | text | not null; unique `(company_id, idempotency_key)` |
| `signer_name` / `signer_role` | varchar(160/80) | nullable |
| `caption` | text | nullable |
| `upload_error` | text | nullable |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | default `now()`, not null |

**Enums:** `evidence_type` = `photo | signature | attachment`; `evidence_status` = `pending_upload | uploaded | failed`.

**Índices:** `(company_id, work_order_id)`, `(work_order_id, status)`, `(company_id, idempotency_key)`, `(technician_id)`.

**Legado:** `work_order_evidences`; `note` vira evento (`note_added`). **Decisão:** `file_id` nullable (decisão de risco §7); evidências confirmadas não são apagadas fisicamente; soft delete via `deleted_at` (decisão 6); estados conforme `docs/EVIDENCE_POLICY.md`.

### `files`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `bucket` | varchar(80) | not null |
| `object_key` | text | not null |
| `mime_type` | varchar(120) | not null |
| `size_bytes` | integer | not null |
| `deleted_at` | timestamptz | soft delete |
| `created_at` | timestamptz | default `now()`, not null |

**Índices:** `(company_id, object_key)`; unique `(company_id, id)`.

### `sync_receipts`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `device_id` | varchar(120) | not null |
| `idempotency_key` | text | not null |
| `work_order_event_id` | uuid | FK `(company_id, work_order_event_id)` → `work_order_events` (opcional) |
| `evidence_id` | uuid | FK `(company_id, evidence_id)` → `evidences` (opcional) |
| `status` | `sync_result` | enum; not null |
| `payload_hash` | text | nullable |
| `processed_at` | timestamptz | default `now()`, not null |
| `error_code` | varchar(40) | nullable |
| `error_message` | text | nullable |
| `created_at` | timestamptz | default `now()`, not null |

**Enums:** `sync_result` = `applied | already_done | rejected | conflict | retry_later`.

**Índices:** `(company_id, work_order_event_id)`, `(company_id, processed_at)`; unique `(company_id, device_id, idempotency_key)`.

**Legado:** inexistente (`syncActions` reaplica sem idempotência). **Decisão:** base do protocolo idempotente de sync (Grupo de sync).

### `audit_logs`

| Coluna | Tipo | Constraints / Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `company_id` | uuid | FK → `companies.id` |
| `actor_user_id` / `target_user_id` | uuid | FK composta → `users` (nullable) |
| `resource` / `action` | varchar(60) | not null |
| `resource_id` | uuid | nullable |
| `payload` | jsonb | nullable |
| `ip_hash` | varchar(64) | nullable |
| `user_agent` | text | nullable |
| `occurred_at` | timestamptz | not null |
| `created_at` | timestamptz | default `now()`, not null |

**Índices:** `(company_id, occurred_at)`, `(resource, action)`, `(actor_user_id)`, `(resource_id)`.

**Legado:** inexistente formal (ações administrativas dispersas). **Decisão:** não armazena bytes, tokens nem senhas.

---

## 3. Mapeamento legado → CrewOps

| CrewOps | Legado PHP | Decisão |
| --- | --- | --- |
| `companies` | `tenants` | Preservar (isolamento/contexto) |
| `branches` | inexistente direto (`sites`/`tenant`) | Redesenhar (nova) |
| `users` | `users` + RBAC simplificado | Redesenhar (5 perfis) |
| `sessions` | — | Novo |
| `technicians` | `users` perfil `technician` + `technician_profiles` | Redesenhar (sem People Core; grade adiada) |
| `customers` | `clients` | Preservar (separado de endereço) |
| `service_addresses` | `sites` | Redesenhar (renomear; separar cliente/endereço) |
| `tickets` | `tickets` | Preservar (estados reduzidos) |
| `work_orders` | `work_orders` | Redesenhar (estados do Grupo 3; snapshot) |
| `dispatches` | `WorkOrderController::dispatch` | Redesenhar (evento auditável) |
| `work_order_events` | `work_order_timeline`, `work_order_dispatch_events`, `work_order_rework_events` | Redesenhar (imutável + idempotência) |
| `technician_locations` | `technician_profiles.last_latitude/longitude` | Redesenhar (pontos por evento) |
| `evidences` | `work_order_evidences` | Redesenhar (`note` vira evento) |
| `files` | bucket/objeto (storage) | Preservar |
| `sync_receipts` | — | Novo |
| `audit_logs` | — | Novo |

---

## 4. Decisões de modelagem

1. **IDs UUID** e **timestamps UTC** (`timestamptz`) em todas as linhas.
2. **Soft delete** via `deleted_at` (não apaga dados; queries ativas filtram `IS NULL`).
3. **Isolamento por `company_id`** com **FKs compostas `(company_id, id)`** para referências entre empresas (impede OS de empresa A apontar para técnico de empresa B).
4. **PostGIS** `geometry(Point,4326)` para `service_addresses.geometry` e `technician_locations.geometry`.
5. **Eventos imutáveis** (`work_order_events`); status atual da OS é projeção derivada (Grupo 8 aplica).
6. **Snapshot de endereço** em `work_orders.address_snapshot` (JSONB) preenchido na criação (Grupo 8) — decisão 5 do Grupo 5.
7. **Idempotência** com escopo `(company_id, device_id, idempotency_key)` para `work_order_events` e `sync_receipts`; `(company_id, idempotency_key)` para `evidences` — decisão 7 do Grupo 5.
8. **Sessão** armazena `refresh_token_hash` apenas; cookie/token no Grupo 6 — decisão 8 do Grupo 5.

---

## 5. Pendências / decisões em aberto

- **D-109:** escopo de unicidade de `users.email` (empresa vs global) — schema usa `(company_id, email)` até Produto ratificar (decisão 1 do Grupo 5).
- **R-014 / R-015:** grade semanal do técnico (`technician_availability_slots`) adiada; apenas `availability_status` atual.
- **Unicidade de cliente por documento:** `(company_id, document)` permitindo nulos; decisão final de produto pendente (decisão 4).
- **`branches.code`/`timezone`:** obrigatórios; endereço completo da filial opcional até Operação decidir (`REQUIRED_FIELDS.md` §3).
- **Storage (S3 vs R2)** e formato/tamanho de evidências: PENDING (`DECISION_LOG.md` D-101; `docs/EVIDENCE_POLICY.md` §6).

---

## 6. Validação

- `npm run db:migrate:check` (up to date).
- `npm run db:rollback` → `npm run db:migrate` → `npm run db:migrate:check`.
- `npm run test:integration -w @crewops/db` (migrations, seed, schema).
- `npm run db:seed -- --reset`.

---

## Documentos vinculados

- `docs/GLOSSARY.md` — termos únicos (work_order, dispatch, evidence, technician_location, etc.).
- `docs/STATE_MATRICES.md` — estados/transições de ticket e OS.
- `docs/REQUIRED_FIELDS.md` — campos obrigatórios (decisões pendentes §3).
- `docs/EVIDENCE_POLICY.md` — tipos e estados de evidência.
- `docs/OPERATIONAL_POLICIES.md` — reatribuição/cancelamento/reabertura/retrabalho.
- `docs/API_CONTRACT.md` — códigos de erro estáveis (`IDEMPOTENT_REPLAY`, etc.).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — modelo de dados do Change.
