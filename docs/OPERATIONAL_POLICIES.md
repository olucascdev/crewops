# Políticas Operacionais — Reatribuição, Cancelamento, Reabertura, Retrabalho e Offline Concorrente

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.5
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — políticas definidas; aprovação PENDENTE.** Este documento fecham o comportamento **fora do caminho feliz** com autor, condição, evento gerado e tratamento de conflito. Base: `docs/BUSINESS_RULES.md` §2.5/§2.9, `docs/CLASSIFICATION.md` 2.5-*/2.9-*, e specs `offline-sync`/`ticketing-dispatch`/`field-operations`. **Nenhuma política é aprovação assinada.** Validação por Produto + Operação (R-001/R-002) pendente.

> **Fonte do legado:** `dispatch()` permite reatribuição (`app/Controllers/Admin/WorkOrderController.php:241-335`); `quickAction()` move técnico/status/prioridade/prazo (`:338-442`); `upsertRework()` abre/fecha retrabalho (`app/Models/WorkOrder.php:544-588`); `syncActions` não trata conflito (`app/Controllers/App/HomeController.php:574-606`).

---

## 1. Reatribuição

| Aspecto | Política proposta |
| --- | --- |
| Autor | despachante (admin/gestor delegados) |
| Permissão | Enquanto a OS **não** estiver `completed`/`cancelled` |
| Condição | Técnico novo deve estar ativo; indisponível só com confirmação autorizada (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/ticketing-dispatch/spec.md`) |
| Evento gerado | `technician_reassigned` (em `work_order_dispatch_events`/`work_order_events`) com `old_technician_id`, `new_technician_id`, autor, horário, justificativa |
| Efeito | Técnico anterior **perde acesso**; novo recebe a OS na próxima sync/atualização online |
| Conflito | Se o técnico anterior estiver offline com ações pendentes sobre a OS, o offline concorrente trata o conflito (seção 5) |

> **Referência:** `app/Controllers/Admin/WorkOrderController.php:279-292` (`event_type` `reassigned`/`dispatch_updated`); `app/Models/WorkOrder.php:590-614` (`recordDispatchEvent`).

---

## 2. Cancelamento

| Aspecto | Política proposta |
| --- | --- |
| Autor | admin / gestor / despachante |
| Condição | Exige **motivo** obrigatório; aplicável a OS não `completed` |
| Pós-`completed` | Cancelamento **não** é permitido; correções ocorrem via **retrabalho** (seção 4) |
| Evento gerado | `cancelled` (status) + evento de cancelamento auditável |
| Estado | `cancelled` é **terminal** |

> **Referência:** estados `cancelled` (`app/Models/WorkOrder.php:39`); `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/field-operations/spec.md` (eventos imutáveis/correção por evento compensatório).

---

## 3. Reabertura

| Entidade | Política proposta |
| --- | --- |
| **Ticket** `closed` → `open` | admin / atendente; requer motivo; preserva histórico |
| **Ticket** `resolved` → `open` | admin / atendente; requer motivo |
| **OS** `completed` | **não** reabre; correções via `rework` |
| Evento | `reopened` (ticket) / `rework_opened` (OS) |

> **Referência:** `app/Controllers/Admin/TicketController.php:179-199` (updateStatus ticket); `app/Controllers/Admin/WorkOrderController.php:357-369` (`open_rework` → status `rework`).

---

## 4. Retrabalho (rework)

| Aspecto | Política proposta |
| --- | --- |
| Autor | admin / gestor |
| Origem | `completed`/`in_validation` → `rework` |
| Registro | motivo, causa e origem (listas fixas do legado) + notas |
| Novo ciclo | `rework` → `scheduled`/`dispatched`/`in_progress`; reatribuição **opcional** |
| Eventos anteriores | **preservados** (verdade operacional imutável) |
| Encerramento | `rework` → `resolved_status` (`close_rework`) — `app/Controllers/Admin/WorkOrderController.php:375-386` |

> **Fonte:** `app/Models/WorkOrder.php:544-588` (`upsertRework`); `database/migrations/038_quality_rework_dispatch_board_v087.sql:5-16,29` (campos e `event_type`); `app/Controllers/Admin/WorkOrderController.php:639-679` (listas fixas).

---

## 5. Ação offline concorrente

| Aspecto | Política proposta |
| --- | --- |
| Processamento | Ações do técnico offline processadas **na ordem da outbox**; backend decide por dependência, não confiando no relógio do dispositivo |
| Conflito | Se a central mudou estado/atribuição no intervalo, o evento offline gera **`conflict`** ou **`rejected`** conforme regra |
| Nota aditiva | Pode ser aceita mesmo com mudança de estado |
| Transição de status inválida | **Rejeitada** (`rejected`) sem sobrescrever o estado atual |
| Escopo do técnico | Técnico só altera OS **atribuída a si**; OS de outro técnico → negado + auditoria |
| Idempotência | Cada evento tem `idempotency_key`; reenvio retorna `already_done` sem duplicar |

> **Referência:** `docs/OFFLINE_SYNC_STRATEGY.md`; `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/offline-sync/spec.md` (resultado por item, conflito explícito, ordem/dependência); `app/Models/WorkOrder.php:1052` (posse do técnico via `getTechnicianActivityDetail`). **Remoção da outbox** apenas após ACK seguro (tarefa 11.7).

---

## 6. Matriz de conflito (proposta)

| Situação no intervalo offline | Resultado proposto | Orientação ao usuário |
| --- | --- | --- |
| OS cancelada pela central | `conflict` | Técnico/orcente vê OS como cancelada; não aplica ação |
| OS concluída pela central | `conflict` | Não sobrescreve; orienta contato com coordenação |
| OS reatribuída a outro técnico | `conflict` / `rejected` | Ação do técnico anterior é descartada; novo técnico assume |
| Nota aditiva sobre OS ainda aberta | `applied` | Aceita; adiciona à timeline |
| Transição de status fora do estado atual | `rejected` | Mantém estado atual; erro acionável |
| Ação duplicada (mesma chave) | `already_done` | Reenvio é idempotente |

---

## 7. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Cada política tem autor, condição, evento e tratamento de conflito.
- [ ] Cancelamento pós-`completed` só via rework — confirmado por Operação.
- [ ] Reatribuição exige justificativa e perde acesso do técnico anterior.
- [ ] Offline concorrente classifica conflito sem sobrescrever silenciosamente.

---

## Documentos vinculados

- `docs/STATE_MATRICES.md` — estados/transições (3.2/3.3).
- `docs/WORK_ORDER_FLOW.md` — caminho feliz (3.1).
- `docs/PERMISSIONS_MATRIX.md` — autores autorizados (3.6).
- `docs/OFFLINE_SYNC_STRATEGY.md` — protocolo de sync e conflito.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/offline-sync/spec.md` — conflito explícito.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/ticketing-dispatch/spec.md` — reatribuição auditável.
