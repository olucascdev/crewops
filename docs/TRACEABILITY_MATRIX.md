# Matriz de Rastreabilidade Fonte PHP → Regra → Spec OpenSpec → Tarefa → Teste (2.12)

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 2.12
> Data de registro: **2026-09-01**
> Status da matriz: **PRONTA PARA APROVAÇÃO — PENDENTE**. Apresenta a rastreabilidade entre a fonte PHP do legado, a regra extraída, a spec OpenSpec correspondente, a tarefa de implementação e o teste objetivo. A aprovação formal por **Produto** e **Operação** (R-001/R-002) ainda **não foi concedida**; nenhuma assinatura é fabricada. Ver a seção "Gate de aprovação" ao final.
>
> Convenções:
> - **Fonte PHP**: `path:linha` de arquivo legível no legado (leitura somente).
> - **Classificação**: conforme `docs/CLASSIFICATION.md` (2.11).
> - **Spec**: pasta em `openspec/specs/` ou `openspec/changes/.../specs/`.
> - **Tarefa**: grupo/tarefa de `openspec/changes/migrar-fieldops-para-crewops-mvp/tasks.md`.
> - **Teste**: teste objetivo ou tarefa de validação (unidade/integração/E2E) que prova a regra.

---

## 1. Identidade, organização e autorização (spec: identity-access, organization-branches)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `app/Controllers/Admin/AuthController.php:34-42` | Login valida e-mail + `password_verify` | preservar | identity-access | 6.2 | Unit: login válido / senha errada / user inexistente |
| `app/Controllers/Admin/AuthController.php:44-48` | Usuário inativo/bloqueado não loga | preservar | identity-access | 6.2 | Unit: login com status `inactive`/`blocked` → negado |
| `app/Controllers/Admin/AuthController.php:50-55` | Técnico/PJ não acessa portal admin | preservar | identity-access | 6.3 | Unit/Integration: técnico em rota admin → 403/redirect |
| `app/Controllers/App/AuthController.php:73-84` | `system_user` não acessa app; exige `is_technician=1` | preservar | identity-access | 6.5 | Unit: perfil system_user no app → negado |
| `app/Controllers/App/AuthController.php:89-101` | Sessão app com `app_guard='technician'` | redesenhar | identity-access | 6.2 | Integration: sessão do PWA criada com guard correto |
| `app/Controllers/Api/V1/AuthApiController.php:38-62` | JWT embute roles+permissions; `expires_in=3600` | redesenhar | identity-access | 6.2 | Unit: token contém claims; expiração ≥1h |
| `app/Controllers/BaseController.php:35-42,49-56` | `currentUser` por canal; `requireAuth` | redesenhar | identity-access | 6.3 | Integration: rota autenticada e anônima por canal |
| `app/Controllers/BaseController.php:87-95` | `requirePermission` → 403 | redesenhar | identity-access | 6.3 | Unit/Integration: guard de permissão negada |
| `app/Middleware/AuthMiddleware.php:10-25` | Guard por URI (`app`/`admin`/`api`) | redesenhar | identity-access | 6.3 | Integration: acesso cruzado negado |
| `app/Models/User.php:17-27` | Permissões achatadas por usuário | redesenhar | identity-access | 3.6/6.3 | Unit: matriz de permissões por perfil |
| `app/Models/User.php:217-228` | `firstTenantForUser` (tenant default) | redesenhar (empresa fixa) | organization-branches | 5.2 | Unit: contexto de empresa resolvido no login |
| `database/migrations/001_create_users_table.sql:10` | `users.status('active','inactive','blocked')` + soft delete | preservar | organization-branches | 5.2 | Migration: estados e soft delete |
| `database/migrations/002_create_rbac_tables.sql:4-35` | RBAC `roles/permissions/role_permissions/user_roles` | redesenhar (matriz simples) | identity-access | 3.6 | Migration: constraints e cascade |

## 2. Empresa, filiais, técnico, disponibilidade (spec: organization-branches, legacy-modernization)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `database/migrations/005_create_tenants_table.sql:4-18` | `tenants` = empresa | redesenhar → company | organization-branches | 5.2 | Mapping: tenant→company |
| `database/migrations/005_create_tenants_table.sql:20-39` | `tenant_units` = filial (endereço+lat/lng) | redesenhar → branch | organization-branches | 5.2 | Mapping: unit→branch; endereço |
| `database/migrations/005_create_tenants_table.sql:41-52` | `tenant_users` vínculo N:N + role por tenant | redesenhar | organization-branches | 5.2 | Migration: vínculo user↔branch/company |
| `database/migrations/014_people_core_v040.sql:1-35` | `technician_profiles` (operational_type/status/availability_status) | preservar | organization-branches | 5.3 | Migration: schema técnico |
| `database/migrations/016_availability_rating_v042.sql:1-15` | Grade semanal `technician_availability_slots` | adiar | organization-branches | 5.3 | (adiado) não bloqueia MVP |
| `database/migrations/016_availability_rating_v042.sql:37-43` | `home_radius_km/base_lat/lng/last_seen_at` | adiar | organization-branches | 5.3 | (adiado) depende de D-102 |
| `app/Models/TechnicianProfile.php:112-118` | Perfil por `user_id` | preservar | organization-branches | 5.3 | Unit: get perfil por usuário |
| `app/Models/TechnicianProfile.php:101-110` | `userAlreadyLinked` impede duplicidade | preservar | organization-branches | 5.3 | Unit: usuário em 2 perfis → rejeita |
| `app/Controllers/Admin/TechnicianController.php:79-86` | Validação de perfil técnico | preservar | organization-branches | 5.3 | Unit: validação create/update |
| `app/Controllers/Admin/TechnicianController.php:237-254` | `updateAvailabilityStatus` disponibilidade atual | preservar | organization-branches | 5.3 | Unit: set disponibilidade |
| `app/Models/TechnicianAvailability.php:43-64` | `boardSummary` (available/busy/off/seen_24h) | adiar (técnico parado) | operations-dashboard | 15.2 | Unit: contagem disponibilidade |

## 3. Clientes e endereços (spec: customer-service-addresses)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `database/migrations/006_create_clients_sites.sql:4-24` | `clients` identidade | preservar | customer-service-addresses | 5.4 | Migration: schema cliente |
| `database/migrations/006_create_clients_sites.sql:26-51` | `sites` endereço + lat/lng DECIMAL | redesenhar → geometry | customer-service-addresses | 7.3 | Migration/Unit: PostGIS point; nulo aceito |
| `app/Controllers/Admin/ClientController.php:68-72` | `name required min:2`; email; status | preservar | customer-service-addresses | 7.1 | Unit: validação cliente |
| `app/Controllers/Admin/SiteController.php:49-52` | `name` + `client_id exists` | preservar | customer-service-addresses | 7.1 | Unit: validação endereço |
| `app/Controllers/Admin/ClientController.php:29-38` | Busca por nome/email/documento | redesenhar | customer-service-addresses | 7.5 | Integration: busca e paginação |
| `app/Models/Client.php:35-49` | Contadores tickets/OS abertas por cliente | preservar | customer-service-addresses | 7.4 | Unit: contadores snapshot |
| `app/Controllers/Admin/ClientController.php:170-183` | Soft delete auditável cliente | preservar | customer-service-addresses | 8.8 | Unit: delete auditável |
| `app/Controllers/Admin/SiteController.php:84-91` | Soft delete auditável site | preservar | customer-service-addresses | 8.8 | Unit: delete auditável |
| `app/Models/Site.php:18-38` | Lista sites com cliente | preservar | customer-service-addresses | 7.1 | Integration: join site↔cliente |

## 4. Tickets (spec: ticketing-dispatch, field-operations)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `database/migrations/007_create_tickets_work_orders.sql:14-45` | Schema tickets (status/prioridade/vinculos) | preservar | ticketing-dispatch | 5.5 | Migration: schema ticket |
| `app/Models/Ticket.php:25-32` | Status `open/in_progress/waiting/resolved/closed/cancelled` | preservar | ticketing-dispatch | 3.2/8.1 | Unit: máquina de estados (aprovada 3.2) |
| `app/Models/Ticket.php:18-23` | Prioridade `low/normal/high/critical` | preservar | ticketing-dispatch | 8.1 | Unit: enum prioridade |
| `app/Models/Ticket.php:34-42` | Número `TKT-YYYY-NNNN` por tenant | redesenhar | ticketing-dispatch | 8.1 | Unit: geração segura de número |
| `app/Controllers/Admin/TicketController.php:89-92` | `title` + `priority` obrigatórios | preservar | ticketing-dispatch | 8.1 | Unit: validação ticket |
| `app/Controllers/Admin/TicketController.php:104-129` | Create admin (status open, opened_by) | preservar | ticketing-dispatch | 8.1 | Integration: criar ticket |
| `app/Controllers/Admin/TicketController.php:193-199` | `updateStatus` (resolved_at/closed_at) | preservar | ticketing-dispatch | 3.2/8.1 | Unit: transição resolve/close |
| `app/Controllers/App/HomeController.php:149-175` | Técnico abre ticket em campo | preservar | ticketing-dispatch | 8.1 | Integration: ticket por técnico em campo |
| `app/Controllers/Admin/TicketController.php:202-229` | Documentos/anexos de ticket | preservar | ticketing-dispatch | 8.1 | Unit: upload doc de ticket |
| `app/Models/Ticket.php:76-82` | Contagem/última OS vinculada ao ticket | preservar | ticketing-dispatch | 8.2 | Integration: vínculo ticket↔OS |

## 5. Ordens de serviço (spec: field-operations, ticketing-dispatch)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `database/migrations/038_quality_rework_dispatch_board_v087.sql:4` | Status OS (10 estados) | preservar | field-operations | 3.3/8.3 | Unit: máquina de estados aprovada (3.3) |
| `app/Models/WorkOrder.php:43-48` | Prioridade `low/normal/high/critical` | preservar | field-operations | 8.3 | Unit: enum prioridade |
| `app/Models/WorkOrder.php:50-58` | Número `OS-YYYY-NNNN` | redesenhar | field-operations | 8.3 | Unit: geração segura de número |
| `app/Controllers/Admin/WorkOrderController.php:144-147` | `title` + `priority` obrigatórios | preservar | field-operations | 8.1 | Unit: validação OS |
| `app/Controllers/Admin/WorkOrderController.php:159-181` | Create OS (status inicial por técnico+agenda; ticket_id opcional) | preservar | ticketing-dispatch | 8.2 | Integration: criar OS avulsa/vinculada |
| `app/Controllers/Admin/WorkOrderController.php:241-335` | `dispatch()` atribui técnico/prazo + grava evento | redesenhar | ticketing-dispatch/field-operations | 8.4/8.5 | Integration: despacho transacional + evento |
| `app/Models/WorkOrder.php:590-614` | `recordDispatchEvent` (diff técnico/status/prioridade) | redesenhar | field-operations | 8.4 | Unit: evento de despacho com diff |
| `app/Controllers/Admin/WorkOrderController.php:338-442` | `quickAction` reatribui/move/prioriza | redesenhar | field-operations | 8.5/8.8 | Unit: reatribuição com justificativa |
| `app/Models/WorkOrder.php:544-588` | `upsertRework` abre/fecha rework | redesenhar | field-operations | 3.5/8.8 | Unit: retrabalho via eventos |
| `app/Models/WorkOrder.php:155-162` | Timeline `work_order_timeline` | redesenhar → events | field-operations | 8.4 | Unit: evento imutável |
| `database/migrations/009_dispatch_forms_v022.sql:4-13` | Formulário de execução (checklist/require_*) | redesenhar | field-operations | 3.4/8.4 | Integration: config por OS + validação |
| `database/migrations/011_mobile_sync_compat_v032c.sql:3-20` | checklist/extra/photo/signature modes | redesenhar | field-operations | 3.4 | Unit: desdobramento config do form |
| `app/Controllers/Admin/WorkOrderController.php:444-491` | `saveExecutionForm` | redesenhar | field-operations | 3.4 | Integration: salvar form da OS |
| `app/Controllers/Admin/WorkOrderController.php:601-636` | `updateStatus` status_change | preservar | field-operations | 8.3 | Unit: transição + completed_at |

## 6. App do técnico (spec: field-operations, offline-sync)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `app/Models/WorkOrder.php:357-395` | `listForTechnicianMobile` (exclui cancelled, prioriza in_progress) | preservar | field-operations | 9.1/9.2 | Integration: lista só OS do técnico |
| `app/Models/WorkOrder.php:746-765` | `mobileCards` open/in_progress/scheduled_today/overdue | preservar | field-operations | 9.1 | Unit: cards do técnico |
| `app/Controllers/App/HomeController.php:21-29` | `requireTechnician` guard do app | preservar | identity-access | 6.3 | Integration: PWA exige técnico |
| `app/Models/WorkOrder.php:1071-1088` | Check-in exige GPS → in_progress + evento | preservar | field-operations/offline-sync | 12.2/13.3 | Integration: check-in sem GPS → erro |
| `app/Models/WorkOrder.php:1090-1107` | Check-out exige GPS → completed + evento | preservar | field-operations/offline-sync | 12.2/13.3 | Integration: check-out sem GPS → erro |
| `app/Models/WorkOrder.php:1109-1134` | Checklist exige ≥1 item + campos extras | preservar | field-operations | 3.7/8.4 | Unit: checklist válido/inválido |
| `app/Models/WorkOrder.php:1136-1160` | Evidência textual exige texto/arquivo; contagem **só cliente** (4) | redesenhar | evidence-uploads | 13.1 | Unit: evidência com/sem arquivo |
| `app/Models/WorkOrder.php:1162-1177` | Assinatura exige `signer_name` | preservar | evidence-uploads | 13.2/13.3 | Unit: assinatura simples |
| `public/assets/js/fieldops-app.js:193-208` | Compressão imagem max 1600px, q 0.82 | preservar | evidence-uploads | 13.2 | Client/Unit: compressão respeita limites |
| `public/assets/js/fieldops-app.js:315-318` | Assinatura exige nome **e** desenho no cliente | redesenhar | evidence-uploads | 13.2 | (decidir) desenho vs simples `[PRODUTO]` |
| `public/assets/js/fieldops-app.js:269-278` | `collectGps` (high accuracy, timeout 12s) | preservar | field-operations | 12.1 | Client: timeout/permissão negada |

## 7. Evidências (spec: evidence-uploads)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `database/migrations/010_execution_evidence_v023.sql:4-19` | Schema `work_order_evidences` | preservar | evidence-uploads | 5.7 | Migration: schema evidência |
| `app/Models/WorkOrderEvidence.php:23-48` | Anexo admin (attachment) | preservar | evidence-uploads | 13.6 | Integration: criar anexo |
| `app/Models/WorkOrderEvidence.php:51-72` | Upload base64 offline | redesenhar | evidence-uploads | 13.4/13.5 | Integration: upload direto pré-assinado |
| `app/Models/WorkOrderEvidence.php:74-98` | Assinatura simples (nome + confirmed) | preservar | evidence-uploads | 13.6 | Unit: assinatura idempotente |
| `app/Models/WorkOrderEvidence.php:100-123` | **Nota** como evidência (`note` mistura evento) | redesenhar (separar evento) | field-operations/evidence-uploads | 13.3 | Unit: nota vira `work_order_event` |
| `app/Models/WorkOrderEvidence.php:131-140` | Limite 10MB + `jpg/jpeg/png/pdf/webp` (só multipart) | redesenhar | evidence-uploads | 13.1 | Unit: validação formato/tamanho server-side |
| `app/Models/WorkOrderEvidence.php:163-207` | Base64 **sem limite de tamanho** server-side | redesenhar | evidence-uploads | 13.4/13.5 | Unit: base64 > limiar → rejeito |
| `app/Models/WorkOrderEvidence.php:158,169,204` | MIME confia no cliente, sem content sniffing | redesenhar | evidence-uploads | 13.1 | Unit: content sniffing rejeita MIME falsificado |
| `app/Models/WorkOrderEvidence.php:143,194` | `mkdir(0777)` world-writable | redesenhar (storage) | evidence-uploads | 13.4 | Unit: permissões restritas no diretório |
| `app/Models/WorkOrderEvidence.php:200` | Sem `is_uploaded_file`/equivalente no base64 (`file_put_contents`) | redesenhar | evidence-uploads | 13.4/13.5 | Unit: rejeita bytes não-validados |
| `app/Models/WorkOrderEvidence.php:142-149` | Pasta local `public/uploads/...` | redesenhar (storage) | evidence-uploads | 13.4 | Integration: object storage (D-101) |
| `app/Models/WorkOrderEvidence.php:26-46,163-207` | Sem hash/integridade/estado de upload | redesenhar | evidence-uploads | 13.6/13.7 | Unit: hash + estados pending/uploaded/failed |
| `app/Controllers/Admin/WorkOrderController.php:493-539` | `storeEvidence` admin | preservar | evidence-uploads | 13.6 | Integration: upload admin |
| `app/Controllers/App/HomeController.php:531-572` | `uploadEvidence` app (GPS/metadata) | preservar | evidence-uploads | 13.3 | Integration: upload app com GPS |

## 8. Localização e mapa (spec: operations-dashboard, field-operations)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `app/Models/WorkOrder.php:800-817` | Mapa pontos de OS por `sites.lat/lng` | redesenhar | operations-dashboard | 15.4 | Integration: pontos de OS no mapa |
| `app/Models/Ticket.php:149-167` | Mapa tickets abertos | preservar | operations-dashboard | 15.4 | Integration: pontos de ticket |
| `database/migrations/040_mapops_live_technician_position_v088r1.sql:3-10` | Última posição `last_*` em `technician_profiles` | redesenhar | operations-dashboard | 12.3/12.4 | Migration: `technician_locations` |
| `app/Models/User.php:199-211` | Recência (labels/estado fresh/stale/old) | preservar | operations-dashboard | 15.4/3.8 | Unit: classificação de recência |
| `app/Models/User.php:171-173` | `recent_only` 4h | adiar | operations-dashboard | 15.5 | (adiado) filtro de mapa |
| `app/Models/TechnicianProfile.php:130-144` | `updateLastLocation` | redesenhar | field-operations | 12.4 | Unit: última posição preservando histórico |
| `app/Controllers/App/HomeController.php:502-529` | `pingLocation` (source pwa_ping) | redesenhar | field-operations | 12.1/12.5 | Integration: ping registra ponto |
| `public/assets/js/fieldops-app.js:343-361,398-401` | Ping 2min; `setInterval` 3min 1º plano | redesenhar | field-operations | 12.5 | Unit/Client: captura em 1º plano, sem background |

## 9. Sincronização (spec: offline-sync, platform-architecture)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `app/Controllers/App/HomeController.php:492-500` | `syncData` download incremental | preservar | offline-sync | 10.4 | Integration: delta por cursor |
| `app/Models/WorkOrder.php:399-417` | Payload cards+activities+sync | redesenhar | offline-sync | 11.1 | Unit: DTO versionado |
| `app/Models/WorkOrder.php:727-744` | `syncMeta`/`last_marker` | preservar | offline-sync | 10.4 | Unit: cursor determinístico |
| `app/Controllers/App/HomeController.php:574-606` | `syncActions` processa lote | redesenhar | offline-sync | 11.2 | Integration: resultado por item (`applied/rejected/conflict`) |
| `public/assets/js/fieldops-app.js:2-21` | IndexedDB `fieldops-mobile` v3 (activities/queue/meta) | redesenhar | offline-sync | 10.2 | Migration: banco Dexie versionado |
| `public/assets/js/fieldops-app.js:125-155` | `flushQueue` envia fila ≠ sent | redesenhar | offline-sync | 11.7 | Integration: reenvio idempotente/backoff |
| `public/assets/js/fieldops-app.js:156-161` | `enqueueAction` `local_id` timestamp+random | redesenhar | offline-sync | 11.3 | Unit: idempotency_key único |
| `public/assets/js/fieldops-app.js:138-142,157` | Sem idempotência (risco duplicação) | redesenhar | offline-sync | 11.2/11.3 | Test: reenvio idêntico → `already_done` |
| `app/Models/WorkOrder.php:1047-1197` | Ação aplica sobre estado atual (sem conflito) | redesenhar | offline-sync | 11.6 | Integration: OS cancelada/concluída offline → `conflict` |
| `public/assets/js/fieldops-app.js:398-401` | Sync no retorno de conexão/1º plano | preservar | offline-sync | 10.7 | Client: gatilhos de sync |

## 10. Indicadores / dashboard (spec: operations-dashboard, legacy-modernization)

| Fonte PHP | Regra / comportamento | Classificação | Spec OpenSpec | Tarefa | Teste |
| --- | --- | --- | --- | --- | --- |
| `app/Models/WorkOrder.php:194-211` | `kpis` (open/in_progress/completed_today/overdue/rework/unassigned/awaiting/redistributed/returns) | preservar | operations-dashboard | 15.1/15.3 | Integration: totais batem com listas |
| `app/Models/WorkOrder.php:213-240` | `queueSummary` colunas | preservar | operations-dashboard | 15.7 | Integration: filas vs listas |
| `app/Models/WorkOrder.php:475-504` | `operationalSnapshot` | preservar | operations-dashboard | 15.1 | Unit: snapshot |
| `app/Models/WorkOrder.php:746-765` | `mobileCards` (técnico) | preservar | operations-dashboard | 15.3 | Unit: cards |
| `app/Models/WorkOrder.php:819-840` | `biSummary` BI executivo | adiar | operations-dashboard | 17.1/17.8 | (adiado) BI executivo após gate |
| `app/Models/WorkOrder.php:883-907` | `biAgingTable` (buckets dentro/vencida/sem_sla) | adiar | operations-dashboard | 17.1 | (adiado) aging/BI |
| `app/Models/Ticket.php:102-123` | `Ticket::kpis` (backlog/closed/resolved/overdue/opened_today) | preservar | operations-dashboard | 15.1 | Unit: KPIs de ticket |
| `app/Models/TechnicianAvailability.php:43-64` | `boardSummary` (available/busy/off/seen_24h) | adiar | operations-dashboard | 15.2 | (definir) técnico parado `[OPERAÇÃO]` |
| `app/Controllers/Admin/DashboardController.php:51-77` | Consumo de KPIs/queue/snapshot/board | preservar | operations-dashboard | 15.3 | Integration: dashboard | 
| `app/Models/WorkOrder.php:201,224` | Atraso `overdue` (kpis sem `due_at IS NOT NULL`; queue exige) | redesenhar (padronizar) | operations-dashboard | 3.8/15.1 | Unit: regra única de atraso |

---

## Tabelas legadas cobertas (assert de cobertura de migrations)

| Migration | Cobertura |
| --- | --- |
| `001_create_users_table.sql` | ✅ (2.1) tabela users |
| `002_create_rbac_tables.sql` | ✅ (2.1) RBAC |
| `005_create_tenants_table.sql` | ✅ (2.2) tenants/units/users/settings |
| `006_create_clients_sites.sql` | ✅ (2.3) clients/sites |
| `007_create_tickets_work_orders.sql` | ✅ (2.4/2.5) tickets/work_orders/timeline |
| `009_dispatch_forms_v022.sql` | ✅ (2.5) execution forms |
| `010_execution_evidence_v023.sql` | ✅ (2.7) evidences |
| `011_mobile_sync_compat_v032c.sql` | ✅ (2.6/2.9) form desdobrado |
| `014_people_core_v040.sql` | ✅ (2.2) technician_profiles/teams |
| `016_availability_rating_v042.sql` | ✅ (2.2) availability slots + base |
| `021_contracts_sla_v060.sql` | ⛔ fora do escopo (financeiro/contratos) — adiar |
| `038_quality_rework_dispatch_board_v087.sql` | ✅ (2.5) status expandido + rework/dispatch events |
| `039_mapops_bi_whitelabel_v088.sql` | ✅ (2.8) white label tenant_settings |
| `040_mapops_live_technician_position_v088r1.sql` | ✅ (2.8) última posição `last_*` |

## Status e prioridades cobertos

- **Ticket** (`app/Models/Ticket.php:18-32`): `low/normal/high/critical` + `open/in_progress/waiting/resolved/closed/cancelled` — ✅.
- **WorkOrder** (`app/Models/WorkOrder.php:30-48`): 10 estados + 4 prioridades — ✅.
- **Técnico** (`database/migrations/014_people_core_v040.sql:5-8`, `016:41-43`): `operational_type/system_user/technician/partner_pj`, `person_type/pf/pj`, `status/draft/pending/active/blocked/inactive`, `availability_status/available/busy/off` — ✅.
- **App actions**: `checkin`, `checkout`, `checklist`, `evidence_note`, `signature` com pré-condições — ✅ (seção 6).

## Queries de dashboard cobertas com fonte

Cada indicador em `docs/BUSINESS_RULES.md` §2.10 e `docs/LEGACY_INVENTORY.md` §10 referencia o SQL fonte (`app/Models/WorkOrder.php:194-211`, `213-240`, `475-504`, `746-765`, `819-840`, `952-966`; `app/Models/Ticket.php:102-123`). ✅

## Revisão cruzada com specs OpenSpec (assert de reconciliação)

| Spec | Regras essenciais mapeadas | Link |
| --- | --- | --- |
| identity-access | 2.1-a..h; guard de canal | seção 1 |
| organization-branches | 2.2-a..i | seção 2 |
| customer-service-addresses | 2.3-a..g | seção 3 |
| ticketing-dispatch | 2.4-a..i; conversão ticket→OS | seções 4, 5 |
| field-operations | 2.5 status/despacho/retrabalho; 2.6 ações | seções 5, 6, 8 |
| offline-sync | 2.6 fila local; 2.9 sync | seções 6, 9 |
| evidence-uploads | 2.7 tipos/limites/storage | seção 7 |
| operations-dashboard | 2.10 indicadores | seção 8 |
| legacy-modernization | gate do inventário; integra com 2.11/2.12 | seções 2, 10 |
| platform-architecture | processamento assíncrono (jobs/filas) | seção 9 |
| data-migration-cutover | recorte de dados (D-104) | ⚠️ decisão de dados `[OPERAÇÃO]` |

## Cobertura de arquivos do LEGACY_REFERENCE_MAP

- **Views (`resources/views/...`)**: as telas são camada de apresentação. Todo comportamento funcional extraído está mapeado a partir do **controller/model/SQL/JS** que as serve. View `admin/work_orders/*` → `app/Controllers/Admin/WorkOrderController.php` + `app/Models/WorkOrder.php`; `admin/tickets/*` → `app/Controllers/Admin/TicketController.php` + `app/Models/Ticket.php`; `admin/technicians/*` → `app/Controllers/Admin/TechnicianController.php` + models de técnico; `admin/map/index.php` → `app/Controllers/Admin/MapOpsController.php`; `app/sync/index.php` → `app/Controllers/App/HomeController.php` + `fieldops-app.js`; `app/work_orders/show.php` → `app/Models/WorkOrder.php` (aplicação de ação). Todas essas fontes de domínio têm linha na matriz acima.
- **Models**: `WorkOrder` (✅), `WorkOrderEvidence` (✅), `WorkOrderExecutionForm` (✅), `Ticket` (✅), `TicketDocument` (✅), `Client` (✅), `Site` (✅), `User` (✅), `Role` (✅), `TechnicianProfile` (✅), `TechnicianAvailability` (✅), `TechnicianTeam` (✅).
- **Controllers**: `AuthController` (admin/app/api), `BaseController`, `WorkOrderController`, `TicketController`, `ClientController`, `SiteController`, `TechnicianController`, `MapOpsController`, `DashboardController` (admin/root) — todos com linha na matriz.
- **JS**: `public/assets/js/fieldops-app.js` — ações offline, fila IndexedDB, compressão, GPS, ping (seções 6, 8, 9).

---

## Gate de aprovação (matriz 2.12)

> **Status: PENDENTE.** A matriz está pronta para revisão; **nenhuma assinatura** foi concedida. A aprovação depende da nomeação dos papéis (R-001/R-002 — ver `docs/PILOT_RATIFICATIONS.md` e `docs/DECISION_LOG.md` D-105).

### Checklist de gate (a confirmar por Produto e Operação)

| # | Item | Responsável | Status |
| --- | --- | --- | --- |
| G-01 | Classificação cada regra (2.11) confirma `preservar`/`redesenhar`/`adiar`/`descartar` | Produto + Operação | PENDENTE |
| G-02 | Status/transições de ticket e OS aprovados (2.4/2.5 → 3.2/3.3) | Produto + Operação | PENDENTE |
| G-03 | Campos obrigatórios de cliente/endereço (2.3) | Produto | PENDENTE |
| G-04 | Unicidade por documento de cliente (2.3) | Produto | PENDENTE |
| G-05 | Grade semanal de disponibilidade entra no MVP? (2.2) | Produto | PENDENTE |
| G-06 | Assinatura desenhada vs simples por nome no MVP (2.6) | Produto | PENDENTE |
| G-07 | Definição de "técnico parado"/thresholds de recência (2.10) | Operação | PENDENTE |
| G-08 | Provedor de mapa (2.8) | Produto + Arquitetura | PENDENTE (D-102) |
| G-09 | Provedor de storage (evidências) (2.7) | Arquitetura | PENDENTE (D-101) |
| G-10 | Recorte histórico de migração (2.4–2.5) | Dados + Operação | PENDENTE (D-104) |
| G-11 | Matriz de permissões dos 5 perfis (2.1) | Produto + Operação | PENDENTE (tarefa 3.6) |
| G-12 | Matriz de estados de ticket aprovada (3.2) | Produto + Operação | PENDENTE |
| G-13 | Matriz de estados de OS aprovada (3.3) | Produto + Operação | PENDENTE |
| G-14 | Permissões dos 5 perfis aprovadas (3.6) | Produto + Operação | PENDENTE |
| G-15 | API contract publicado (3.9) | Arquitetura + Operação | PENDENTE (D-101) |
| G-16 | Gate funcional 3.10 executado | Produto + Operação + Arquitetura | PENDENTE |

> **Nota (Grupo 3 — 3.1–3.10):** os artefatos que alimentam G-02/G-03/G-07/G-11 e os novos G-12 a G-16 estão publicados em `docs/WORK_ORDER_FLOW.md`, `docs/STATE_MATRICES.md`, `docs/EVIDENCE_POLICY.md`, `docs/OPERATIONAL_POLICIES.md`, `docs/PERMISSIONS_MATRIX.md`, `docs/REQUIRED_FIELDS.md`, `docs/OPERATIONAL_THRESHOLDS.md`, `docs/API_CONTRACT.md` e `docs/FUNCTIONAL_GATE.md`. **Nenhum destes está aprovado** — a confirmação formal depende de R-001/R-002/R-003 (ver `docs/DECISION_LOG.md` D-105).

### Donos

| Papel | Dono (função) | Nomeação de pessoa |
| --- | --- | --- |
| Produto | Liderança de Produto | **PENDENTE** (R-001) |
| Operação | Liderança de Operação | **PENDENTE** (R-002) |
| Arquitetura | Liderança Técnica | **PENDENTE** (R-003) |
| Dados | Liderança de Dados | **PENDENTE** (R-004) |
| Corte | Liderança de Operação | **PENDENTE** (R-005) |

### O que "aprovada" significa

1. Cada regra classificada tem classe confirmada (sem `[PENDENTE]` de domínio no campo de decisão).
2. Toda decisão de domínio cai em um D-ID (`docs/DECISION_LOG.md`) ou R-ID (`docs/PILOT_RATIFICATIONS.md`) com dono e prazo.
3. Nenhuma fatia de implementação (tarefas 6–17) inicia com regra essencial sem decisão/critério de aceite — regra do gate funcional (`legacy-modernization`).
4. **Como a aprovação é registrada:** quando Produto/Operação confirmarem, cada linha `PENDENTE` acima muda para `APROVADO` com data, e o campo de assinatura só pode ser preenchido por pessoa nomeada (R-001/R-002). **Nenhuma assinatura real consta neste documento.**

### Registro de aprovação (a preencher quando confirmado)

| Campo | Valor |
| --- | --- |
| Estado | **PENDENTE** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data de aprovação | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

---

## Documentos vinculados

- `docs/CLASSIFICATION.md` — classificação de cada comportamento (2.11).
- `docs/BUSINESS_RULES.md` — regras extraídas (2.1–2.10).
- `docs/LEGACY_INVENTORY.md` — inventário detalhado.
- `docs/LEGACY_REFERENCE_MAP.md` — onde procurar cada módulo no legado.
- `docs/DECISION_LOG.md` — D-IDs (S3/R2, mapa, thresholds, recorte histórico).
- `docs/PILOT_RATIFICATIONS.md` — R-IDs (nomeações e valores).
