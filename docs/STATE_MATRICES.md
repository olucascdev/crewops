# Matriz de Estados e Transições — Ticket e Work Order

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefas 3.2 (ticket) e 3.3 (OS)
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — matrizes preenchidas; aprovação PENDENTE.** As matrizes derivam do comportamento observado no legado PHP (estados e regras de transição), reduzindo o modo permissivo "qualquer para qualquer" para um conjunto controlado com **autor** e **motivo** por transição. **Nenhum estado foi aprovado por assinatura.** Validação formal por Produto + Operação (R-001/R-002) pendente. Estados baseados em `docs/BUSINESS_RULES.md` §2.4/§2.5 e `app/Models/*.php`.

> Fonte dos estados:
> - **Ticket** `app/Models/Ticket.php:25-32` — `open`, `in_progress`, `waiting`, `resolved`, `closed`, `cancelled`.
> - **Work Order** `app/Models/WorkOrder.php:30-41` — `pending`, `scheduled`, `dispatched`, `in_progress`, `waiting_evidence`, `in_validation`, `waiting_parts`, `completed`, `cancelled`, `rework`.

> **Nota de redução:** o legado (`WorkOrderController::updateStatus` `app/Controllers/Admin/WorkOrderController.php:601-636`; `TicketController::updateStatus` `app/Controllers/Admin/TicketController.php:179-199`) aceita **qualquer** status do enum para um admin. O CrewOps **reduz** essas transições ao conjunto abaixo. Exceções administrativas seguem `docs/OPERATIONAL_POLICIES.md` (3.5) via **evento compensatório**, sem editar evento confirmado.

---

## 1. Ticket

### 1.1 Estados

| Estado | Rótulo (legado) | Descrição |
| --- | --- | --- |
| `open` | Aberto | Solicitação recebida, ainda sem atendimento |
| `in_progress` | Em atendimento | Atendimento em andamento |
| `waiting` | Aguardando | Aguardando informação do cliente/terceiro |
| `resolved` | Resolvido | Solucionado (preenche `resolved_at`) |
| `closed` | Fechado | Encerrado (preenche `closed_at`) |
| `cancelled` | Cancelado | Cancelado — **terminal** |

### 1.2 Transições

| De | Para | Autor | Motivo | Timestamp |
| --- | --- | --- | --- | --- |
| `open` | `in_progress` | atendente / admin | Início do atendimento | — |
| `open` | `waiting` | atendente | Aguardando informação | — |
| `open` | `resolved` | atendente / admin | Solucionado sem necessidade de campo | `resolved_at` |
| `open` | `closed` | admin / gestor | Chamado inválido | `closed_at` |
| `open` | `cancelled` | admin / gestor | Cancelamento | — |
| `in_progress` | `waiting` | atendente | Aguardando informação | — |
| `in_progress` | `resolved` | atendente / admin | Solucionado | `resolved_at` |
| `in_progress` | `closed` | admin / gestor | Chamado inválido | `closed_at` |
| `in_progress` | `cancelled` | admin / gestor | Cancelamento | — |
| `waiting` | `in_progress` | atendente | Retomada do atendimento | — |
| `waiting` | `resolved` | atendente / admin | Solucionado | `resolved_at` |
| `waiting` | `closed` | admin / gestor | Chamado inválido | `closed_at` |
| `waiting` | `cancelled` | admin / gestor | Cancelamento | — |
| `resolved` | `closed` | admin / gestor | Encerramento | `closed_at` |
| `resolved` | `open` | admin / atendente | Reabertura (requer motivo) | — |
| `closed` | `open` | admin | Reabertura (requer motivo) | — |
| `cancelled` | — (terminal) | — | Sem transição de saída | — |

> **Fonte dos timestamps:** `resolved` → `resolved_at`; `closed` → `closed_at` — `app/Controllers/Admin/TicketController.php:193-199`.

### 1.3 Registro de aprovação — Ticket

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação — Ticket

- [ ] Toda transição tem autor + motivo.
- [ ] `resolved`/`closed` preenchem `resolved_at`/`closed_at`.
- [ ] Estados terminais (`closed`/`cancelled`) sem transição não prevista.
- [ ] Confirmado por Produto e Operação.

---

## 2. Work Order

### 2.1 Estados

| Estado | Rótulo (legado) | Descrição |
| --- | --- | --- |
| `pending` | Pendente | Criada; sem técnico e sem agendamento |
| `scheduled` | Agendada | Tem agendamento, sem técnico |
| `dispatched` | Despachada | Técnico atribuído + agendamento |
| `in_progress` | Em execução | Técnico iniciou (check-in) |
| `waiting_evidence` | Aguard. evidência | Execução finalizada; falta evidência/validação |
| `in_validation` | Em validação | Evidência enviada; em validação administrativa |
| `waiting_parts` | Aguard. peças | Falta material/peça |
| `completed` | Concluída | Serviço concluído (preenche `completed_at`) |
| `cancelled` | Cancelada | Cancelamento — **terminal** |
| `rework` | Retrabalho | Reaberta para correção |

### 2.2 Transições

Legenda de autor: `TEC` técnico (via PWA), `DESP` despachante, `GEST` gestor_operacional, `ADMIN` admin. "Despachante" inclui admin/gestor como delegados de despacho onde a regra operacional permitir (ver `docs/PERMISSIONS_MATRIX.md` 3.6).

#### Do estado `pending`

| Para | Autor | Motivo | Evento legado-equivalente |
| --- | --- | --- | --- |
| `scheduled` | despachante | Agendamento definido sem técnico (regra automática) | `dispatch_update` |
| `dispatched` | despachante | Atribuiu técnico + agendamento (regra automática) | `dispatch_updated` |
| `in_progress` | admin / gestor | Início de execução (overrides administrativo) | `status_change` |
| `cancelled` | admin / gestor / despachante | Cancelamento com motivo | `cancelled` |

#### Do estado `scheduled`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `pending` | despachante | Removeu agendamento (desatribuição) | `dispatch_updated` |
| `dispatched` | despachante | Atribuiu técnico mantendo agendamento (regra automática) | `dispatch_updated` |
| `in_progress` | admin / gestor | Início de execução (overrides administrativo) | `status_change` |
| `cancelled` | admin / gestor / despachante | Cancelamento com motivo | `cancelled` |

#### Do estado `dispatched`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `scheduled` | despachante | Reagendou / removeu técnico mantendo agendamento | `reassigned` / `dispatch_updated` |
| `pending` | despachante | Desatribuiu (removeu técnico + agendamento) | `dispatch_updated` |
| `in_progress` | técnico | Check-in do técnico | `mobile_checkin` |
| `in_progress` | admin / gestor | Início de execução (overrides administrativo) | `status_change` |
| `waiting_evidence` | admin / gestor | Execução finalizada; falta evidência/validação | `queue_changed` |
| `waiting_parts` | admin / gestor | Falta material/peça | `queue_changed` |
| `cancelled` | admin / gestor / despachante | Cancelamento com motivo | `cancelled` |

#### Do estado `in_progress`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `waiting_evidence` | técnico / admin | Execução finalizada; falta evidência/admin | `queue_changed` |
| `waiting_parts` | admin / gestor | Falta material/peça | `queue_changed` |
| `completed` | técnico | Check-out do técnico | `mobile_checkout` |
| `completed` | admin / gestor | Encerramento administrativo | `status_change` |
| `cancelled` | admin / gestor | Cancelamento com motivo | `cancelled` |

#### Do estado `waiting_evidence`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `in_validation` | admin / gestor | Evidência enviada; em validação | `queue_changed` |
| `in_progress` | admin / técnico | Evidência rejeitada / retomada da execução | `queue_changed` |
| `waiting_parts` | admin / gestor | Falta material/peça | `queue_changed` |
| `cancelled` | admin / gestor | Cancelamento com motivo | `cancelled` |

#### Do estado `in_validation`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `completed` | admin / gestor | Validado | `status_change` |
| `rework` | admin / gestor | Reprovado na validação | `rework_opened` |
| `in_progress` | admin | Retomada de execução (correção) | `queue_changed` |
| `waiting_evidence` | admin | Evidência insuficiente; volta a aguardar | `queue_changed` |
| `cancelled` | admin / gestor | Cancelamento com motivo | `cancelled` |

#### Do estado `waiting_parts`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `in_progress` | admin / despachante | Peças disponíveis; retomada | `queue_changed` |
| `scheduled` | despachante | Reagendou após peças | `dispatch_updated` |
| `dispatched` | despachante | Reatribuiu para técnico após peças | `dispatch_updated` |
| `cancelled` | admin / gestor | Cancelamento com motivo | `cancelled` |

#### Do estado `completed`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `rework` | admin / gestor | Reprovação pós execução (ver `docs/OPERATIONAL_POLICIES.md` 3.5) | `rework_opened` |

> `completed` **não** reabre diretamente; correções ocorrem via `rework`. Atraso/estado final preserva timeline (`completed_at`).

#### Do estado `rework`

| Para | Autor | Motivo | Evento |
| --- | --- | --- | --- |
| `scheduled` | despachante | Novo ciclo agendado (`close_rework` → `resolved_status=scheduled`) | `rework_resolved` |
| `dispatched` | despachante | Novo ciclo com técnico (`close_rework` → `resolved_status=dispatched`) | `rework_resolved` |
| `in_progress` | técnico | Retomada de execução (check-in) | `mobile_checkin` |
| `completed` | técnico | Rework concluído (check-out) | `mobile_checkout` |
| `cancelled` | admin / gestor | Cancelamento do retrabalho | `cancelled` |

#### `cancelled`

**Terminal.** Sem transição de saída no MVP.

### 2.3 Fonte das regras automáticas de despacho

| Regra | Fonte |
| --- | --- |
| Criação: `scheduled` se `technician_id && scheduled_at`, senão `pending` | `app/Controllers/Admin/WorkOrderController.php:166` |
| `dispatch`: com agendamento + sem técnico + `pending` → `scheduled` | `app/Controllers/Admin/WorkOrderController.php:264-266` |
| `dispatch`: com técnico + agendamento + `pending/scheduled` → `dispatched` | `app/Controllers/Admin/WorkOrderController.php:267-269` |
| `checkin` → `in_progress` + `started_at` | `app/Models/WorkOrder.php:1071-1088` |
| `checkout` → `completed` + `completed_at` | `app/Models/WorkOrder.php:1090-1107` |
| `open_rework` → `rework`; `close_rework` → `resolved_status` | `app/Controllers/Admin/WorkOrderController.php:357-386` |
| `updateStatus` aceita qualquer status (reduzido por esta matriz) | `app/Controllers/Admin/WorkOrderController.php:601-636` |

### 2.4 Registro de aprovação — Work Order

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação — Work Order

- [ ] Toda transição tem autor + motivo.
- [ ] Regras automáticas de criação/despacho e check-in/out preservadas.
- [ ] `cancelled` é terminal; `completed` não reabre (usa `rework`).
- [ ] Divergência com `packages/db`/`packages/shared` registrada para o Grupo 5.
- [ ] Confirmado por Produto e Operação.

---

## 3. Divergência status legado ↔ implementação atual

> `packages/db/src/schema.ts` e `packages/shared/src/index.ts` usam estados de OS diferentes (`draft/open/assigned/en_route/arrived/in_progress/blocked/done/cancelled`) dos estados legados/design. **Este documento registra a regra verdadeira**; o alinhamento do código é responsabilidade do Grupo 5 (contratos e modelo de dados). Não foi alterado código neste grupo.

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — §2.4 (tickets) e §2.5 (OS).
- `docs/CLASSIFICATION.md` — 2.4-a/2.5-a (estados `preservar`).
- `docs/OPERATIONAL_POLICIES.md` — 3.5 (reatribuição/cancelamento/reabertura/retrabalho/offline concorrente).
- `docs/WORK_ORDER_FLOW.md` — 3.1 (caminho feliz).
- `docs/TRACEABILITY_MATRIX.md` — 2.12 (fonte→regra→spec→tarefa→teste).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/field-operations/spec.md` — máquina de estados.
