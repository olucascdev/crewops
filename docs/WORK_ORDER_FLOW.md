# Fluxo da Ordem de Serviço (OS) — Ponta a Ponta

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.1
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — fluxo consolidado; aprovação PENDENTE.** Este documento consolida atores, pré-condições e o caminho feliz da OS no MVP, com base em `docs/BUSINESS_RULES.md` (§2.4–2.9), `docs/CLASSIFICATION.md` (2.5/2.6/2.9), `docs/GLOSSARY.md` e nas specs OpenSpec (`field-operations`, `ticketing-dispatch`, `offline-sync`, `evidence-uploads`). **Nenhuma aprovação foi concedida.** Validação formal por Produto + Operação (R-001/R-002) ainda pendente.

> Terminologia: segue `docs/GLOSSARY.md` (proposta, R-011 PENDING). Onde este doc usa `OS`, trata-se de `work_order`. `ticket` = solicitação; `work_order` = unidade de execução.

---

## 1. Atores

| Ator | Papel no fluxo | Fonte |
| --- | --- | --- |
| `admin` | Configuração, validação, cancelamento/reabertura, correção administrativa | `app/Controllers/Admin/WorkOrderController.php` (backoffice) |
| `gestor_operacional` | Acompanha operação, valida OS, abre retrabalho, cancela/reabre | `app/Controllers/DashboardController.php` |
| `atendente` | Abre ticket; cria OS a partir de ticket | `app/Controllers/Admin/TicketController.php` |
| `despachante` | Cria OS, atribui técnica, agenda, reagenda/reatribui | `app/Controllers/Admin/WorkOrderController.php:241-335` (`dispatch`) |
| `tecnico` | Recebe OS no PWA, executa em campo, registra eventos/evidências/GPS | `app/Controllers/App/HomeController.php`; `app/Models/WorkOrder.php:1047-1197` |
| `system` | Automação/efeitos assíncronos (upload, fila, WebSocket), sem agente humano | `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §7/§8/§10 |

> **Atores são autorizados por recurso e ação conforme `docs/PERMISSIONS_MATRIX.md` (3.6, PENDING).** Restrição de canal: `tecnico` só acessa o PWA de campo; demais perfis acessam o painel — `app/Controllers/Admin/AuthController.php:50-55` / `app/Controllers/App/AuthController.php:73-84`.

---

## 2. Pré-condições

Para que a OS exista e possa ser executada, as pré-condições abaixo devem valer. Cada uma tem fonte no legado ou decisão de design.

| # | Pré-condição | Detalhe | Fonte |
| --- | --- | --- | --- |
| PC-1 | Usuário ativo no contexto empresa/filial | Login exige `users.status='active'`; isolamento por `company_id`/`branch_id` | `app/Controllers/Admin/AuthController.php:44-48`; `app/Middleware/AuthMiddleware.php:10-25` |
| PC-2 | Técnico ativo/disponível quando há atribuição | Atribuição bloqueada para técnico inativo ou indisponível (indisponível só com confirmação autorizada) | `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/ticketing-dispatch/spec.md` (Atribuição válida); `app/Models/TechnicianProfile.php:112-118` |
| PC-3 | Cliente/endereço cadastrados OU OS avulsa permitida | OS sem ticket é permitida; cliente/endereço são vínculos opcionais na criação | `app/Controllers/Admin/WorkOrderController.php:167-169`; `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/ticketing-dispatch/spec.md` (OS sem ticket) |
| PC-4 | Tipo de OS define evidências obrigatórias | Cada tipo (`corrective/preventive/installation/survey`) aponta para política de evidência | `docs/EVIDENCE_POLICY.md` (3.4); `app/Models/WorkOrder.php:30-41` |
| PC-5 | Formulário de execução configurado quando aplicável | Checklist/campos extras/foto/assinatura/GPS por OS | `app/Controllers/Admin/WorkOrderController.php:444-491`; `database/migrations/009_dispatch_forms_v022.sql:4-13` |

> **Decisão de entrada no MVP das pré-condições** — produto/operação (R-014). Nenhuma pré-condição é considerada aprovada assinada.

---

## 3. Caminho feliz (happy path)

> Mapeado do legado e condensado para o MVP. Etapas numeradas; fontes em `path:line`.

| # | Etapa | Quem | Comportamento | Fonte |
| --- | --- | --- | --- | --- |
| 1 | Abrir ticket (opcional) | atendente | Cria `ticket` com `status='open'`, `priority`, `title`; sem OS ainda | `app/Controllers/Admin/TicketController.php:89-129` |
| 2 | Criar OS | admin / gestor / despachante | Cria `work_order`; status inicial `scheduled` se houver técnico **e** agendamento, senão `pending`; `type` default `corrective` | `app/Controllers/Admin/WorkOrderController.php:164-166` |
| 3 | Vincular origem (opcional) | admin / despachante | `ticket_id`, `client_id`, `site_id` opcionais; OS avulsa permitida | `app/Controllers/Admin/WorkOrderController.php:167-169` |
| 4 | Despachar | despachante | Atribui técnico + `scheduled_at` + `due_at`; regras automáticas: com agendamento+sem técnico e `pending` → `scheduled`; com técnico+agendamento e `pending/scheduled` → `dispatched`; grava evento de despacho | `app/Controllers/Admin/WorkOrderController.php:241-335` (`dispatch`) |
| 5 | Técnico recebe OS no PWA | tecnico | Sincroniza (download incremental) e vê a OS atribuída; lista exclui `cancelled`, prioriza `in_progress` | `app/Models/WorkOrder.php:357-395`; `app/Controllers/App/HomeController.php:492-500` |
| 6 | Check-in | tecnico | Exige GPS; status → `in_progress`, `started_at`; evento `mobile_checkin` + nota `kind=checkin_gps` | `app/Models/WorkOrder.php:1071-1088` |
| 7 | Executar checklist / fotos / notas | tecnico | Checklist exige ≥1 item + campos extras obrigatórios; nota/evidência; **não** muda status | `app/Models/WorkOrder.php:1109-1160` |
| 8 | Assinatura | tecnico | Exige `signer_name`; cria evidência `signature` com `signer_role` e `signature_confirmed=1` | `app/Models/WorkOrder.php:1162-1177`; `app/Controllers/Admin/WorkOrderController.php:554-568` |
| 9 | Check-out | tecnico | Exige GPS; status → `completed`, `completed_at`; evento `mobile_checkout` + nota `kind=checkout_gps` | `app/Models/WorkOrder.php:1090-1107` |
| 10 | PWA envia outbox | tecnico / system | Ações offline aplicadas por lote com `idempotency_key`; API responde por item (`applied/already_done/rejected/conflict/retry_later`) e grava recibo na mesma transação | `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/offline-sync/spec.md`; `docs/OFFLINE_SYNC_STRATEGY.md` |
| 11 | Painel reflete estado | admin / gestor | Status, timeline e mapa atualizados; última posição conhecida com recência | `app/Models/WorkOrder.php:590-614`; `app/Models/User.php:199-211` |
| 12 | Validação / retrabalho | admin / gestor | Valida evidências (`waiting_evidence`/`in_validation`) ou abre `rework` | `app/Controllers/Admin/WorkOrderController.php:338-386` (`open_rework`) |

> O caminho feliz encerra em `completed`. Estados de exceção (`waiting_evidence`, `in_validation`, `waiting_parts`, `rework`, `cancelled`) e políticas de reatribuição/cancelamento/reabertura/retrabalho/offline concorrente estão em `docs/STATE_MATRICES.md` (3.2/3.3) e `docs/OPERATIONAL_POLICIES.md` (3.5).

---

## 4. Saídas do fluxo

- `work_order` com estado atual (`work_orders.status`).
- `work_order_events` imutáveis (timeline, prova, map, debug) — `docs/GLOSSARY.md` (`event/work_order_event`).
- Evidências com estado de upload (`pending_upload`/`uploaded`/`failed`) — `docs/EVIDENCE_POLICY.md`.
- Pontos de localização por evento + última posição conhecida — `docs/GLOSSARY.md` (`technician_location`).

---

## 5. Divergências / pendências do fluxo

- **Assinatura (D-107):** cliente captura desenho (`fieldops-app.js:311,317,324`) mas servidor grava só `signer_name`/`signer_role` (`app/Models/WorkOrder.php:1162-1175`). Decisão de suporte no MVP é de Produto (3.4).
- **Nota (D-106/D-002):** no legado a nota mistura evento operacional e prova; no CrewOps nota vira `work_order_event`.
- **Webhook (2.5-i):** `work_order.dispatch.updated`/`status.changed` são `descartar` no MVP (`docs/CLASSIFICATION.md` 2.5-i).
- **Conversão ticket→OS (2.4-h):** não automática; OS avulsa permitida.

---

## 6. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Termos do glossário usados corretamente (R-011).
- [ ] Pré-condições enumeradas e vinculadas a fonte.
- [ ] Caminho feliz mapeado em passos numerados com fonte.
- [ ] Atores autorizados por `docs/PERMISSIONS_MATRIX.md` (3.6).
- [ ] Provado pelo dono de Operação (R-002) que o fluxo espelha a operação real do piloto.

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — regras extraídas (§2.4–2.9).
- `docs/GLOSSARY.md` — termos (`work_order`, `dispatch`, `event`, `evidence`, `technician_location`).
- `docs/STATE_MATRICES.md` — transições de ticket/OS (3.2/3.3).
- `docs/EVIDENCE_POLICY.md` — evidências obrigatórias (3.4).
- `docs/OPERATIONAL_POLICIES.md` — reatribuição/cancelamento/reabertura/retrabalho/offline (3.5).
- `docs/PERMISSIONS_MATRIX.md` — permissões dos 5 perfis (3.6).
- `docs/TRACEABILITY_MATRIX.md` — rastreabilidade fonte→regra→spec→tarefa→teste.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — modelo de dados e decisões.
