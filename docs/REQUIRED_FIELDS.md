# Campos Obrigatórios e Validações

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.7
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — campos e validações definidos; aprovação PENDENTE.** Consolida campos obrigatórios e validações de empresa, filial, usuário, técnico, cliente, endereço, ticket e OS. Base: `docs/BUSINESS_RULES.md` §2.1–2.5, `docs/CLASSIFICATION.md` 2.1–2.5, migrations e controllers do legado. **Nenhum campo é aprovação assinada.** Validação por Produto + Operação (R-001/R-002) pendente.

> **Regras gerais:** todos os timestamps em **UTC**; *soft delete* preservado (auditável); unicidade por **empresa** (e por ano quando aplicável).

---

## 1. Tabela por entidade

| Entidade | Obrigatório | Validação | Origem legada | Pendente produto |
| --- | --- | --- | --- | --- |
| `company` | `name` | não vazio, ≤160 | `tenants.name` (`database/migrations/005_create_tenants_table.sql:4-18`) | documento/CNPJ obrigatório? |
| `branch` | `company_id`, `name`, `code`, `city`, `state` | `code` único por empresa | `tenant_units` (`database/migrations/005_create_tenants_table.sql:20-39`) | `timezone` e endereço completo obrigatórios? |
| `user` | `company_id`, `name`, `email`, `password_hash`, `role` | `email` válido; `role` em enum | `users` (`database/migrations/001_create_users_table.sql:4-18`); `app/Controllers/Admin/TechnicianController.php:74` (`users.create`) | `email` único por empresa ou global? |
| `technician` | `company_id`, `user_id` | `user_id` único ativo (impede dois perfis) | `technician_profiles` (`database/migrations/014_people_core_v040.sql:1-35`); `app/Controllers/Admin/TechnicianController.php:79-98` | `availability_status` obrigatório no cadastro? |
| `customer` | `company_id`, `name` (≥2) | `name` `min:2 max:150`; `email` válida; `status` enum | `app/Controllers/Admin/ClientController.php:68-72` | documento único? (D-109) |
| `service_address` | `customer_id`, `label`, `street`, `city`, `state` | `customer_id` existe | `app/Controllers/Admin/SiteController.php:49-52` | CEP e coordenada obrigatórios? (`geometry` PostGIS, nulo aceito — spec `customer-service-addresses`) |
| `ticket` | `company_id`, `number`, `title` (3–255), `priority` | `number` único por empresa/ano | `app/Controllers/Admin/TicketController.php:89-92`; `app/Models/Ticket.php:34-42` | — |
| `work_order` | `company_id`, `number`, `title` (3–255), `priority` | `number` único por empresa/ano | `app/Controllers/Admin/WorkOrderController.php:144-147`; `app/Models/WorkOrder.php:50-58` | `type` default `corrective` |

---

## 2. Observações por entidade

### company
- Isolamento por `company_id` (piloto única — R-012). Ver `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/organization-branches/spec.md`.

### branch
- `code` único por empresa (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/organization-branches/spec.md` — Cadastro de filial). `timezone` registrado na filial.

### user
- `status('active','inactive','blocked')` + soft delete (`001:10`).
- `email` é `UNIQUE` no legado global; no CrewOps decidir escopo (empresa vs global) — pendente produto.

### technician
- Vínculo técnico↔usuário; `user_id` único ativo (`userAlreadyLinked`, `TechnicianController.php:94-98`).
- `operational_type`, `person_type`, `status`, `availability_status` validados por enum (`TechnicianController.php:79-86`).
- Disponibilidade atual `available/busy/off`; grade semanal adiada (`docs/CLASSIFICATION.md` 2.2-f).

### customer
- Identidade separada do endereço (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/customer-service-addresses/spec.md`).
- Unicidade por documento: **decisão de produto** (D-109; `docs/CLASSIFICATION.md` 2.3-e).

### service_address
- `geometry(Point,4326)` PostGIS, com **nulo aceito** (OS para endereço sem coordenada permitida — spec `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/customer-service-addresses/spec.md`).
- Snapshot de contexto preservado em atendimento concluído (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/customer-service-addresses/spec.md` — Histórico preservado).

### ticket
- `number` `TKT-YYYY-NNNN` por tenant/ano (`app/Models/Ticket.php:34-42`); vínculo opcional a `client_id`/`site_id`/`category_id`/`opened_by`/`assigned_to`.
- Status default `open` no create (`app/Controllers/Admin/TicketController.php:110`).

### work_order
- `number` `OS-YYYY-NNNN` por tenant/ano (`app/Models/WorkOrder.php:50-58`).
- Status inicial `scheduled` (técnico+agendamento) senão `pending` (`app/Controllers/Admin/WorkOrderController.php:166`).
- Tipo `corrective|preventive|installation|survey`, default `corrective` (`app/Controllers/Admin/WorkOrderController.php:164`).

---

## 3. Pendências de validação (PENDING)

| # | Item | Dono | Relação | Status |
| --- | --- | --- | --- | --- |
| 1 | Documento/CNPJ obrigatório em `company` | Produto | R-014 | PENDING |
| 2 | `timezone` e endereço completo obrigatórios em `branch` | Produto | R-013/R-014 | PENDING |
| 3 | Escopo de unicidade de `email` (empresa vs global) | Produto | R-014 | PENDING |
| 4 | `availability_status` obrigatório no cadastro do técnico | Operação | R-014 | PENDING |
| 5 | Unicidade por documento de cliente | Produto | D-109; `docs/CLASSIFICATION.md` 2.3-e | PENDING |
| 6 | CEP e coordenada obrigatórios em `service_address` | Produto | `docs/CLASSIFICATION.md` 2.3-b; spec `customer-service-addresses` | PENDING |
| 7 | `type` default `corrective` em `work_order` | Produto | R-014 | PENDING |

---

## 4. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Tabela por entidade com obrigatórios, validações e unidicidades.
- [ ] Pendências explicitadas e vinculadas (D-109, R-014, R-013).
- [ ] Timestamps em UTC e soft delete preservados.

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — §2.1–2.5 (validações de controllers/models).
- `docs/CLASSIFICATION.md` — 2.1–2.5 (classificação por regra).
- `docs/EVIDENCE_POLICY.md` — campos de evidência/OS (3.4).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/organization-branches/spec.md` — filial (`code` único, `timezone`).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/customer-service-addresses/spec.md` — endereço com nulo aceito.
- `docs/TRACEABILITY_MATRIX.md` — 2.12 (fonte→regra→spec→tarefa→teste).
