# Regras de Negócio do Legado FieldOps — Inventário Funcional

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Grupo 2 (2.1–2.10)
> Data de registro: **2026-09-01**
> Status: **INVENTÁRIO (evidência do legado PHP)**. Este documento extrai as regras funcionais do FieldOps **como ele funciona hoje** (leitura somente). Ele **não** define o que o CrewOps deve manter — a classificação (2.11) e a matriz de rastreabilidade (2.12) estão em `docs/CLASSIFICATION.md` e `docs/TRACEABILITY_MATRIX.md`.
> Convenção de evidência: cada regra cita `path:line` de um arquivo legível no legado. A fonte manda; se houver divergência entre a observação e o código, o código prevalece.

## Como usar e limites

- **Fonte autoritativa de regra nova:** OpenSpec (specs em `openspec/`). Este doc é a **base de evidência** do comportamento atual.
- **Não copiar estrutura legada:** o objetivo é extrair a regra, não o acoplamento PHP.
- **Pendências não decididas** aparecem como `[PRODUTO]` / `[OPERAÇÃO]` / `[ARQUITETURA]` e correlacionam a R-IDs/D-IDs. Não foram resolvidas neste grupo.
- Terminologia segue `docs/GLOSSARY.md` (proposta, PENDING — R-011).

---

## 2.1 Autenticação, sessão, usuários e RBAC

### Login por e-mail + senha (hash)

- Login admin valida `email` contra `users.email` e `password_verify` contra `users.password`. Falha → "Credenciais inválidas." `app/Controllers/Admin/AuthController.php:34-42`
- Login do app técnico idem, com `csrf_verify()` adicional. `app/Controllers/App/AuthController.php:42-65`
- Login API (JWT) idem; falha → 401. `app/Controllers/Api/V1/AuthApiController.php:24-31`

### Status ativo obrigatório

- `users.status` em `('active','inactive','blocked')`, default `active`, com soft delete. `database/migrations/001_create_users_table.sql:10`
- Login admin exige `status='active'`; senão "Usuário inativo ou bloqueado." `app/Controllers/Admin/AuthController.php:44-48`
- Login app idem. `app/Controllers/App/AuthController.php:67-71`
- Login API retorna 403 se inativo. `app/Controllers/Api/V1/AuthApiController.php:33-36`

### Separação de guardas (admin × técnico)

- Sessão admin: `$_SESSION['user']` com `id, tenant_id, name, email, avatar, phone, job_title, is_technician, roles, permissions`. `app/Controllers/Admin/AuthController.php:60-71`
- Sessão app: `$_SESSION['app_user']` + `$_SESSION['app_guard']='technician'`. `app/Controllers/App/AuthController.php:89-101`
- `currentUser()` escolhe sessão por prefixo de URI (`/app`). `app/Controllers/BaseController.php:35-42`
- Middleware escolhe guard por URI; app exige `app_guard='technician'`. `app/Middleware/AuthMiddleware.php:10-25`

### Bloqueio cruzado de perfis operacionais

- Admin **bloqueia** técnicos/parceiros PJ: se `technician_profiles.operational_type ∈ ('technician','partner_pj')` → redireciona ao login. `app/Controllers/Admin/AuthController.php:50-55`
- App **bloqueia** `system_user`: "Usuários internos devem acessar o portal administrativo." `app/Controllers/App/AuthController.php:73-78`
- App exige `is_technician=1` se não houver perfil vinculado. `app/Controllers/App/AuthController.php:80-84`

### RBAC granular

- Tabelas `roles`, `permissions`, `role_permissions`, `user_roles`. `database/migrations/002_create_rbac_tables.sql:4-35`
- `User::getPermissions()` achata `SELECT DISTINCT p.name ...` via joins. `app/Models/User.php:17-27`
- `User::getRoles()` retorna nome+label ordenado por label. `app/Models/User.php:29-39`
- `requirePermission()` compara com `$user['permissions']`; senão 403. `app/Controllers/BaseController.php:87-95`
- API JWT embute `roles` + `permissions` no token; `expires_in=3600`. `app/Controllers/Api/V1/AuthApiController.php:41-62`

### Contexto de empresa (tenant) default

- `firstTenantForUser()` via `tenant_users` (status ativo) → 1º tenant. `app/Models/User.php:217-228`
- Se usuário sem `tenant_id`, grava o tenant resolvido no login. `app/Controllers/Admin/AuthController.php:73-87` / `app/Controllers/App/AuthController.php:103-117`

### Auditoria de login

- `AuditLog::record('login'|'logout'|'app_login'|'app_logout'|'api_login', ...)`. `app/Controllers/Admin/AuthController.php:90,100`; `app/Controllers/App/AuthController.php:120,130`; `app/Controllers/Api/V1/AuthApiController.php:50`

### Regras para o CrewOps (rastreabilidade — ver matriz)

- Perfis operacionais legados são **roles genéricas** nomeadas; CrewOps precisa 5 perfis fixos `admin / gestor_operacional / atendente / despachante / tecnico`. (5 perfis — tarefa 3.6)
- Permissões legadas são granulares por nome; CrewOps fará matriz simples recurso×ação (tarefa 3.6).
- Isolamento `tenant_id` → `company_id` (D-003/isolamento em `identity-access`/`organization-branches`).
- Autenticação por cookie/sessão no painel e token/cookie no PWA (tarefa 6.2) — não copiar JWT duplo por padrão.

---

## 2.2 Empresa/tenant, filiais, técnicos e disponibilidade

### Empresa e unidades (tenant)

- `tenants` (`uuid,name,slug,domain,status,plan`, soft delete). `database/migrations/005_create_tenants_table.sql:4-18`
- `tenant_units` = unidade/filial com `name,code,address,city,state,zip,lat,lng,status`. `database/migrations/005_create_tenants_table.sql:20-39`
- `tenant_users` vínculo N:N usuário↔tenant, com `role_id` específica do tenant. `database/migrations/005_create_tenants_table.sql:41-52`
- `tenant_settings` chave/valor tipado por tenant. `database/migrations/005_create_tenants_table.sql:54-64`
- `users.tenant_id` adicionado após id; contexto ativo. `database/migrations/005_create_tenants_table.sql:67-69`

### Perfil do técnico (People Core)

- `technician_profiles`: `operational_type ENUM('system_user','technician','partner_pj')`; `person_type('pf','pj')`; `status('draft','pending','active','blocked','inactive')`; `availability_status('available','busy','off')`. `database/migrations/014_people_core_v040.sql:1-35`
- Vínculo `user_id` opcional (SET NULL). `database/migrations/014_people_core_v040.sql:4,34`
- `TechnicianProfile::findByUserId()` retorna o perfil mais recente. `app/Models/TechnicianProfile.php:112-118`
- Validação de criação/edição: `full_name required min:3`, `operational_type required in ...`, `person_type`, `status`, `availability_status`, `email`. `app/Controllers/Admin/TechnicianController.php:79-86,139-146`
- `userAlreadyLinked()` impede um usuário em dois perfis. `app/Controllers/Admin/TechnicianController.php:94-98,153-157`

### Disponibilidade atual × grade semanal

- Disponibilidade **atual** em `technician_profiles.availability_status` + `availability_notes` + `last_seen_at`. `database/migrations/016_availability_rating_v042.sql:41-43`; set via `setAvailabilityStatus`. `app/Models/TechnicianProfile.php:125-128`
- Grade **semanal** em `technician_availability_slots` (`weekday,start_time,end_time,slot_type,notes`). `database/migrations/016_availability_rating_v042.sql:1-15`
- `replaceWeekly()` substitui toda a grade (delete + insert). `app/Models/TechnicianAvailability.php:19-41`
- `weeklyMatrix()` organiza por dia. `app/Models/TechnicianAvailability.php:66-78`
- `boardSummary()` usa disponibilidade atual + `last_seen_at >= 24h` como proxy de "visto". `app/Models/TechnicianAvailability.php:43-64`

### Equipes

- `technician_teams` (`name,region,lead_name,status`) + `technician_team_members` (N:N perfil↔equipe). `database/migrations/014_people_core_v040.sql:37-60`
- `syncTeams()` substitui vínculos. `app/Models/TechnicianProfile.php:91-99`

### Fora do MVP (não mapeado para manter)

- Compliance/docs (`technician_compliance_requirements`, `technician_documents`, terms), ratings (`technician_ratings`), wallet (`technician_wallet_entries`) existem e foram **adiados/descartados** (ver classificação 2.11).
- `home_radius_km`, `base_latitude/longitude` (base do técnico) — registrados, mas a decisão de uso é de produto.

### Regras para o CrewOps

- `tenants` → `companies` (piloto única, R-012); `tenant_units` → `branches`; `tenant_settings` → config company/branch (D-* / `organization-branches`).
- Técnico vinculado a usuário + filial; disponibilidade atual `available/busy/off` entra; grade semanal como referência, **decisão de entrar no MVP é de produto** `[PRODUTO]` (R-014/R-015).
- CremOps **não** modela People Core completo (compliance, wallet, ratings) — ver 2.11.

---

## 2.3 Clientes e sites/endereços

### Modelo

- `clients` (`name,document,email,phone,address,city,state,zip,notes,status`, soft delete, tenant). `database/migrations/006_create_clients_sites.sql:4-24`
- `sites` (`client_id,name,code,address,city,state,zip,lat,lng,contact_name,contact_phone,notes,status`, soft delete). `database/migrations/006_create_clients_sites.sql:26-51`
- `lat/lng` DECIMAL(10,7) — **não-PostGIS**. `database/migrations/006_create_clients_sites.sql:36-37`

### Campos obrigatórios / validação

- Cliente: `name required min:2 max:150`; `email` válida; `status in(active,inactive)`. `app/Controllers/Admin/ClientController.php:68-72`
- Site: `name required min:2 max:150`; `client_id required exists:clients:id`. `app/Controllers/Admin/SiteController.php:49-52`
- Site atualização: só `name` obrigatório. `app/Controllers/Admin/SiteController.php:77-78`

### Duplicidade e busca

- **Sem duplicidade explícita por documento.** Busca por nome/email/documento no index (filtro pós-paginação). `app/Controllers/Admin/ClientController.php:29-38`
- `allByTenant()` (id+nome) e `getSites()` (sites ativos do cliente). `app/Models/Client.php:19-33`
- Contadores: tickets e OS abertas por cliente (para exibir na ficha). `app/Models/Client.php:35-49`

### Exclusão

- Soft delete via `deleteWithAudit()` (auditável). `app/Controllers/Admin/ClientController.php:170-183` / `app/Controllers/Admin/SiteController.php:84-91`
- FK `sites.client_id ON DELETE CASCADE`; `tickets.client_id/site_id ON DELETE SET NULL`. `database/migrations/006_create_clients_sites.sql:50`; `007_create_tickets_work_orders.sql:41-42`

### Decisões pendentes `[PRODUTO]/[OPERAÇÃO]`

- Campos obrigatórios exatos de cliente/endereço → produto/operação (R-014).
- Unicidade por documento de cliente → produto/operação.
- `clients` → `customers`; `sites` → `service_addresses` (separar identidade de local físico).

---

## 2.4 Tickets

### Ciclo de vida e prioridade

- Prioridade: `low,normal,high,critical` (default `normal`). `database/migrations/007_create_tickets_work_orders.sql:23`; labels `app/Models/Ticket.php:18-23`
- Status: `open,in_progress,waiting,resolved,closed,cancelled` (default `open`). `database/migrations/007_create_tickets_work_orders.sql:24`; labels `app/Models/Ticket.php:25-32`

### Campos

- Obrigatório: `title` (`required min:3 max:255`) e `priority`. `app/Controllers/Admin/TicketController.php:89-92`
- `number` único por tenant `TKT-YYYY-NNNN`. `app/Models/Ticket.php:34-42` (`q uq_tenant_number` em `007:33`)
- Vínculos opcionais: `client_id, site_id, category_id, opened_by, assigned_to`. `007:18-26`
- Status `open` no create; login via admin cria `opened_by` atual. `app/Controllers/Admin/TicketController.php:104-129`
- Campos extras de atendimento: `contact_*`, `channel`, `asset_tag/serial`, `impact/urgency_level`, `opened_in_field`, `location_address`, `access_notes`. `app/Controllers/Admin/TicketController.php:117-128`

### SLA / atraso

- `due_at` define prazo; `resolved_at` e `closed_at` preenchidos no `updateStatus`. `app/Controllers/Admin/TicketController.php:193-199`
- Atraso ticket (KPIs): `status NOT IN ('closed','cancelled') AND due_at < NOW()`. `app/Models/Ticket.php:110`

### Anexos e documentos

- `ticket_documents`; `uploadForTicket`. `app/Controllers/Admin/TicketController.php:202-229,231-250`
- Contagem exibida no listWithRelations (`docs_total`). `app/Models/Ticket.php:62,71-75`

### Conversão em OS

- **Não automática.** `work_orders.ticket_id` opcional (`007:51`); OS avulsa permitida. `WorkOrderController::store` aceita `ticket_id`. `app/Controllers/Admin/WorkOrderController.php:169`
- Ticket mostra OS vinculadas (`linkedOrders`) e contagem/última OS. `app/Models/Ticket.php:64-65,76-82`; `app/Controllers/Admin/TicketController.php:157-163`

### Técnico abre ticket em campo

- `storeTicket` no app: `opened_by` e `assigned_to` = técnico; `opened_in_field=1`; `opened_via='field_app'`. `app/Controllers/App/HomeController.php:149-175`

---

## 2.5 Ordens de serviço (OS)

### Status e prioridade

- Status (final, após migração 038): `pending,scheduled,dispatched,in_progress,waiting_evidence,in_validation,waiting_parts,completed,cancelled,rework`. `app/Models/WorkOrder.php:30-41`; `database/migrations/038_quality_rework_dispatch_board_v087.sql:4` (altera enum para incluir `waiting_evidence` e `in_validation`).
- Prioridade `low,normal,high,critical`, default `normal`. `app/Models/WorkOrder.php:43-48`; `007:57`
- `number` `OS-YYYY-NNNN` por tenant/ano. `app/Models/WorkOrder.php:50-58` (`uq_tenant_number` `007:68`)

### Criação

- Obrigatório `title` (`min:3 max:255`) e `priority`. `app/Controllers/Admin/WorkOrderController.php:144-147`
- Status inicial: `scheduled` se houver técnico **e** agendamento; senão `pending`. `app/Controllers/Admin/WorkOrderController.php:166`
- Timeline `created` + `dispatch_update` no create. `app/Controllers/Admin/WorkOrderController.php:183-195`
- `type` default `corrective` (`corrective|preventive|installation|survey`). `app/Controllers/Admin/WorkOrderController.php:164`; `007:56`

### Despacho

- `dispatch()`: atribui `technician_id`, `scheduled_at`, `due_at` e status; grava `work_order_dispatch_events` (`event_type` `reassigned`/`dispatch_updated`). `app/Controllers/Admin/WorkOrderController.php:241-335`
- Regras de status automáticas no dispatch: com agendamento+sem técnico e status `pending` → `scheduled`; com técnico+agendamento e status em `(pending,scheduled)` → `dispatched`. `app/Controllers/Admin/WorkOrderController.php:264-269`
- Despacho dispara webhook `work_order.dispatch.updated`. `app/Controllers/Admin/WorkOrderController.php:321-331`

### Quick action (reatribuição / mover / mudar prioridade-prazo-status)

- `quickAction()` aceita `open_rework`, `close_rework`, ou mover: técnico/status/prioridade/due_at/scheduled_at. `app/Controllers/Admin/WorkOrderController.php:338-442`
- `event_type` derivado: `reassigned`/`assigned`/`moved`. `app/Controllers/Admin/WorkOrderController.php:407-412`
- Timeline com ações `technician_assigned/reassigned`, `priority_changed`, `due_changed`, `queue_changed`. `app/Controllers/Admin/WorkOrderController.php:427-438`
- `in_progress` preenche `started_at`; `completed` preenche `completed_at`. `app/Controllers/Admin/WorkOrderController.php:400-405`

### Retrabalho

- `upsertRework()` abre (status `rework`) ou fecha; grava `work_order_rework_events`. `app/Models/WorkOrder.php:544-588`
- Campos de rework no `work_orders` (`rework_flag,rework_status,rework_reason,rework_root_cause,rework_notes,rework_requested_by/at,rework_due_at,rework_origin,rework_contestation,rework_resolution_notes,rework_closed_at`). `database/migrations/038_quality_rework_dispatch_board_v087.sql:5-16`
- `event_type` em `work_order_rework_events`: `requested|returned|contestation|resolved|reopened`. `database/migrations/038_quality_rework_dispatch_board_v087.sql:29`
- Motivos/causas/origem de rework são listas fixas. `app/Controllers/Admin/WorkOrderController.php:639-679`

### Finalização e timeline

- `updateStatus()` permite qualquer status do mapa; `completed` → `completed_at`. `app/Controllers/Admin/WorkOrderController.php:601-636`
- `addTimeline()` grava em `work_order_timeline` (`action,from_status,to_status,notes`). `app/Models/WorkOrder.php:155-162`; `007:85-99`
- `recordDispatchEvent()` grava evento de despacho (diff de técnico/status/prioridade/due_at/queue). `app/Models/WorkOrder.php:590-614`
- Board/colunas derivam de `queueLabels`. `app/Models/WorkOrder.php:18-28`, `506-516`

### Formulário de execução

- `work_order_execution_forms` com `checklist_json, require_photos, require_signature, require_gps`. `database/migrations/009_dispatch_forms_v022.sql:4-13`
- Migração 011 desdobra JSON em colunas `checklist_items, extra_fields, photo_mode, signature_mode`. `database/migrations/011_mobile_sync_compat_v032c.sql:3-20`
- `saveExecutionForm()` salva estrutura; timeline `form_updated`. `app/Controllers/Admin/WorkOrderController.php:444-491`

---

## 2.6 App do técnico

### Acesso e lista

- `requireTechnician()` valida sessão `app_guard='technician'` e `is_technician`. `app/Controllers/App/HomeController.php:21-29`
- Index usa `mobileCards` (open_total, in_progress, scheduled_today, overdue) + `listForTechnicianMobile` + `syncMeta`. `app/Controllers/App/HomeController.php:31-66`
- `listForTechnicianMobile()`: exclui `cancelled`; ordena `in_progress` primeiro, depois `dispatched/scheduled`. `app/Models/WorkOrder.php:357-395`

### Detalhe

- `showActivity()` via `getTechnicianActivityDetail()` (traz OS + execution_form + evidences + timeline + mobile_payload). `app/Controllers/App/HomeController.php:68-87`; `app/Models/WorkOrder.php:975-1045`

### Ações (check-in, check-out, checklist, nota, assinatura)

- `applyTechnicianAction()` centraliza; cada ação devolve `{work_order_id,type,ok,message,detail}`. `app/Models/WorkOrder.php:1047-1197`
- **Check-in** (`checkin`): exige GPS; status→`in_progress`, `started_at`; cria nota mobile `kind=checkin_gps`; timeline `mobile_checkin`. `app/Models/WorkOrder.php:1071-1088`
- **Check-out** (`checkout`): exige GPS; status→`completed`, `completed_at`; nota `checkout_gps`; timeline `mobile_checkout`. `app/Models/WorkOrder.php:1090-1107`
- **Checklist** (`checklist`): exige ≥1 item; valida `extra_fields` obrigatórias; nota `kind=checklist`; timeline `mobile_checklist`. `app/Models/WorkOrder.php:1109-1134`
- **Evidência textual** (`evidence_note`): exige texto ou arquivo; até 4 arquivos; nota `kind=evidence_note`; timeline `mobile_evidence_note`. `app/Models/WorkOrder.php:1136-1160`
- **Assinatura** (`signature`): exige `signer_name`; cria evidência `signature` com `signer_role` e `signature_confirmed=1`; timeline `mobile_signature`. `app/Models/WorkOrder.php:1162-1177`

### Pré-condições no cliente (IndexedDB/PWA)

- Ações exigem GPS (`checkin/checkout/checklist/evidence_note`); falha se não obtém GPS real. `public/assets/js/fieldops-app.js:321-322`
- `evidence_note` exige texto ou arquivo; `signature` exige nome **e** assinatura desenhada no canvas. `public/assets/js/fieldops-app.js:315-318`
- **Divergência cliente×servidor na assinatura:** o cliente captura **assinatura desenhada** (`signature_drawn`), mas o servidor (`applyTechnicianAction`) só grava `signer_name`/`signer_role` e **ignora** o desenho. `public/assets/js/fieldops-app.js:311,317,324` vs `app/Models/WorkOrder.php:1162-1175`
- Compressão de imagem no cliente: max 1600px, qualidade 0.82 (JPEG). `public/assets/js/fieldops-app.js:193-208`
- `collectGps()` com `enableHighAccuracy, timeout 12000, maximumAge 15000`. `public/assets/js/fieldops-app.js:269-278`

### Localização periódica

- `pingTechnicianLocation()`: só em rota `/app/`; limite 2min entre pings; POST `/app/location/ping`. `public/assets/js/fieldops-app.js:343-361`
- `setInterval(180000)` (3min) + `visibilitychange` quando visível e online. `public/assets/js/fieldops-app.js:398-401`

---

## 2.7 Evidências

### Modelo e tipos

- `work_order_evidences`: `evidence_type('attachment'|'signature'|'note')`, `title`, `notes`, `file_name/path/mime/size`, `signer_name/role`, `metadata_json`, `created_by`. `database/migrations/010_execution_evidence_v023.sql:4-19`
- `listByWorkOrder()` ordena por `created_at DESC`. `app/Models/WorkOrderEvidence.php:11-21`

### Armazenamento atual (local em disco)

- Anexo admin: `storeUploadedFile()` → `public/uploads/work_orders/{tenantId}/{workOrderId}/{Ymd_His}_{rand}_{safeName}.{ext}`. `app/Models/WorkOrderEvidence.php:125-161`
- Mobile offline: `storeBase64File()` → mesma pasta, via `file_put_contents` do binário. `app/Models/WorkOrderEvidence.php:163-207`
- `file_path` salvo como `/uploads/work_orders/...` (relativo, sem URL temporária).

### Limites (separados por caminho de upload)

**Multipart** (`storeUploadedFile` — admin `storeEvidence` / app `uploadEvidence`):
- Tamanho máx **10MB** validado no servidor (`$maxSize = 10 * 1024 * 1024`; `$uploadedFile['size']`). `app/Models/WorkOrderEvidence.php:131-134`
- Extensões `jpg,jpeg,png,pdf,webp`. `app/Models/WorkOrderEvidence.php:136-140`
- Verifica `error === UPLOAD_ERR_OK` e grava via `move_uploaded_file()` (valida origem `is_uploaded_file()` internamente). `app/Models/WorkOrderEvidence.php:127,151`

**Base64** (`storeBase64File` — fila offline / `applyTechnicianAction evidence_note`):
- **Nenhum limite de tamanho no servidor** — `storeBase64File()` não compara com `$maxSize`; decodifica (`base64_decode`) e grava direto via `file_put_contents`. `app/Models/WorkOrderEvidence.php:163-207`
- `file_size` é só metadado (`strlen($binary)`), não um gate de rejeição. `app/Models/WorkOrderEvidence.php:205`
- Extensões `jpg,jpeg,png,pdf,webp`; infere extensão por mime quando ausente. `app/Models/WorkOrderEvidence.php:178-192`

**Client-side (PWA)**:
- Máximo **4 arquivos** por evidência, imposto só no cliente (`files.slice(0, 4)`). `public/assets/js/fieldops-app.js:292`
- Compressão de imagem (max 1600px, qualidade 0.82) no cliente. `public/assets/js/fieldops-app.js:193-208`

**Contagem no servidor: ausente**
- `applyTechnicianAction evidence_note` itera `$files` sem cap (`foreach ($files as $file)`), logo **não impõe o limite de 4** do cliente. `app/Models/WorkOrder.php:1149-1157`
- `syncActions` processa lote arbitrário de `actions` sem limite por requisição. `app/Controllers/App/HomeController.php:574-606`

### Falhas/riscos de segurança conhecidos (não preservar)

- **DoS por base64 sem limite de tamanho**: payload grande → `base64_decode` consome memória/CPU e `file_put_contents` grava bytes direto em disco, sem rejeitar. `app/Models/WorkOrderEvidence.php:174,200`
- **Amplificação por contagem/lote**: `syncActions` + `evidence_note` permitem N arquivos base64 numa requisição → estoura armazenamento/processamento. `app/Models/WorkOrder.php:1149-1157`; `app/Controllers/App/HomeController.php:574-606`
- **MIME confia no cliente**: multipart usa `$uploadedFile['type']`; base64 usa `$file['mime']` direto no registro. Sem sniffing de conteúdo no caminho base64; no multipart `mime_content_type` é só fallback e não é comparado. `app/Models/WorkOrderEvidence.php:158,169,204`
- **Sem `is_uploaded_file()`/equivalente no caminho base64**: bytes vêm direto da requisição e são gravados com `file_put_contents`; só o caminho multipart usa `move_uploaded_file()`. `app/Models/WorkOrderEvidence.php:200` vs `:151`
- **`mkdir(..., 0777)`** (world-writable) nos dois caminhos. `app/Models/WorkOrderEvidence.php:143,194`
- **Pasta pública**: grava em `public/uploads/...` e expõe em `/uploads/...` (relativo, sem URL assinada) → qualquer arquivo é publicamente recuperável; sem autorização por tenant/work-order. `app/Models/WorkOrderEvidence.php:142,157,193,203`
- **Sem hash/integridade** do arquivo. `app/Models/WorkOrderEvidence.php:26-46`

### Outros limites conhecidos

- Armazenamento em **disco local** → não escalável. `app/Models/WorkOrderEvidence.php:142-145`
- Base64 mobile aumenta payload e trafega na requisição. `app/Models/WorkOrderEvidence.php:51-72`
- **Sem estados de upload** (`pending_upload`/`uploaded`/`failed`): falha lança exceção imediata. `app/Models/WorkOrderEvidence.php:127-134,167,175`
- **Nota mistura eventos operacionais com evidências** (`evidence_type='note'` guarda check-in/check-out/checklist/GPS) → CrewOps separa: nota vira `work_order_event`. `app/Models/WorkOrderEvidence.php:100-123`

### Requisitos para CrewOps (redesenhar — não preservar)

- **Validação server-side por caminho**: limite de tamanho e de contagem de arquivos impostos no servidor (independe do cliente); base64 revalidado antes de gravar. Tarefas 13.4/13.5.
- **MIME/content sniffing no servidor**: validar conteúdo real (magic bytes) além da extensão; não confiar em MIME do cliente. Tarefa 13.1.
- **Permissões seguras**: sem `mkdir(0777)`; usar permissões restritas ("private") + diretório não-world-writable. Tarefa 13.4.
- **Storage privado**: fora da webfolder pública; entregar via URL pré-assinada/temporária (D-101/D-110). Tarefa 13.4/13.5.
- **Autorização e delivery não-público**: validar posse do técnico (existe via `getTechnicianActivityDetail`, `app/Models/WorkOrder.php:1052`) e servir arquivo somente a quem tem acesso à OS. Tarefa 13.3.
- **Hash/integridade + estados de upload** (`pending_upload`/`uploaded`/`failed`). Tarefas 13.6/13.7.

### Endpoints

- Admin: `storeEvidence` (anexo), `storeSignature` (assinatura simples por nome). `app/Controllers/Admin/WorkOrderController.php:493-582`
- App: `uploadEvidence` (anexo com GPS/metadata), `applyTechnicianAction` cria nota/assinatura. `app/Controllers/App/HomeController.php:531-572`; `app/Models/WorkOrder.php:1047-1197`

---

## 2.8 Localização e mapa

### O que o mapa mostra

- Pontos de OS (`work_orders` com `sites.lat/lng` não nulos) e tickets abertos (`status in open/in_progress/waiting`). `app/Models/WorkOrder.php:800-817`; `app/Models/Ticket.php:149-167`
- `mapSummary()` e `mapPoints()`. `app/Models/WorkOrder.php:782-817`
- `MapOpsController::index`/`data` usam `listTechniciansWithGeo`, extensão de `show_technicians`, `recent_only`. `app/Controllers/Admin/MapOpsController.php:15-80`

### Posição do técnico (última posição conhecida)

- `technician_profiles.last_latitude,last_longitude,last_location_at,last_location_accuracy,last_location_source`. `database/migrations/040_mapops_live_technician_position_v088r1.sql:3-10`
- `updateLastLocation()` atualiza a **última** posição (e `last_seen_at`). `app/Models/TechnicianProfile.php:130-144`
- `pingLocation()` no app grava `last_*` (source `pwa_ping`). `app/Controllers/App/HomeController.php:502-529`

### Recência (labels/estado)

- `listTechniciansWithGeo()` computa `location_recency_minutes/label/state`. `app/Models/User.php:199-211`
  - sem posição → `none` / "Sem posição ao vivo";
  - `<5min` → "Agora há pouco";
  - `<60min` → "Há N min";
  - ≤15min → `fresh`; ≤120min → `stale`; ≥120min → `old`;
  - labels >60min: "Há Nh".
- `recent_only` filtra `last_location_at >= 4 horas`. `app/Models/User.php:171-173`

### Distinção ponto atual × ponto antigo

- **Legado guarda só a última posição** (colunas `last_*`). **Não** tem tabela de pontos/stream. `app/Models/User.php:175-197`
- CrewOps modela `technician_locations` (pontos por evento) + última posição conhecida (ver `docs/GLOSSARY.md` — `technician_location`).

### Migração 039 (white label/BI)

- `039` insere `tenant_settings` de marca e `settings` de release. `database/migrations/039_mapops_bi_whitelabel_v088.sql:3-26`

---

## 2.9 Sincronização legado

### Download incremental

- `syncData()` → `buildTechnicianSyncPayload()`. `app/Controllers/App/HomeController.php:492-500`; `app/Models/WorkOrder.php:399-417`
- Payload: `cards`, `activities`, `sync{prepared_at, marker, since, mode, version}`. `app/Models/WorkOrder.php:405-416`
- `since` = `last_marker` (max `updated_at`). `app/Models/WorkOrder.php:727-744`
- Cliente chama `/app/sync/data?since=<marker>` e cacheia (activities, meta cards). `public/assets/js/fieldops-app.js:101-114`
- IndexedDB `fieldops-mobile` v3; stores `activities` (keyPath id), `queue` (keyPath local_id), `meta` (keyPath key). `public/assets/js/fieldops-app.js:2-21`

### Upload de ações

- `syncActions()` processa lote; resposta `results[]{work_order_id,type,ok,message,detail}`. `app/Controllers/App/HomeController.php:574-606`
- Cliente envia via `postActions` (POST `/app/sync/actions`, body `{actions}`) e marca `status='sent'|'failed'`. `public/assets/js/fieldops-app.js:115-123,125-155`

### Fila local e ordem

- `enqueueAction()` gera `local_id = tipo-Timestamp-random` e grava em `queue` com `status('queued'|'pending'|'sent'|'failed')`. `public/assets/js/fieldops-app.js:156-161`
- `flushQueue()` envia todos `!== 'sent'`; sem ACK persistente além do `server_message`. `public/assets/js/fieldops-app.js:125-155`
- Ordem: envia na ordem da fila; servidor processa sequencialmente. `app/Controllers/App/HomeController.php:595-600`

### Riscos/limitações

- **Sem idempotência**: reenvio reaplica ação (risco de duplicação de nota/evidence/status). `public/assets/js/fieldops-app.js:138-142`
- `local_id` baseado em `Date.now()+random` → sem chave idempotente garantida. `public/assets/js/fieldops-app.js:157`
- Reenvio sem `idempotency_key`/`sync_receipts`. `app/Controllers/App/HomeController.php:574-606`
- **Sem conflito explícito**: ação aplica sobre o estado atual (ex.: OS cancelada/concluída offline ainda sofre ação). `app/Models/WorkOrder.php:1047-1197`
- Dependência implícita do horário do dispositivo (local_id/marker). `public/assets/js/fieldops-app.js:157`; `app/Models/WorkOrder.php:403`

---

## 2.10 Indicadores / dashboard

### Definições de negócio (fonte da regra)

- **open_total**: `status NOT IN ('completed','cancelled')`. `app/Models/WorkOrder.php:198` (kpis) / `:750` (mobileCards)
- **in_progress**: `status = 'in_progress'`. `app/Models/WorkOrder.php:199`
- **completed_today**: `status='completed' AND DATE(completed_at)=CURDATE()`. `app/Models/WorkOrder.php:200`
- **overdue**: `status NOT IN ('completed','cancelled') AND due_at < NOW()` (kpis não exige `due_at IS NOT NULL`; queueSummary sim). `app/Models/WorkOrder.php:201,224`
- **rework_total**: `rework_flag=1 OR status='rework'`. `app/Models/WorkOrder.php:202`
- **unassigned_total**: `technician_id IS NULL AND status NOT IN ('completed','cancelled')`. `app/Models/WorkOrder.php:203`
- **awaiting_execution_total**: `status IN ('pending','scheduled','dispatched')`. `app/Models/WorkOrder.php:204`
- **redistributed_today**: eventos de despacho `event_type='reassigned'` hoje. `app/Models/WorkOrder.php:205`
- **returns_today** (kpis): eventos de rework `event_type in ('requested','returned','contestation')` hoje. `app/Models/WorkOrder.php:206`
- **queueSummary**: unassigned/awaiting/scheduled/in_progress/awaiting_evidence/in_validation/rework/overdue/completed_today. `app/Models/WorkOrder.php:213-240`
- **operationalSnapshot**: adiciona `total`, `devolutions_today`, `awaiting_evidence`, `in_validation`. `app/Models/WorkOrder.php:475-504`
- **mobileCards** (técnico): `open_total,in_progress,scheduled_today,overdue`. `app/Models/WorkOrder.php:746-765`
- **biSummary**: `total_orders, completed_total, open_total, overdue_total, unassigned_total, rework_total, avg_hours_to_assign, avg_hours_to_complete, returns_total, reassignments_total, rework_rate`. `app/Models/WorkOrder.php:819-840`
- **biSlaSnapshot**: `within_sla, due_today, overdue, avg_aging_hours`. `app/Models/WorkOrder.php:952-966`
- **biAgingTable**: buckets `encerrada/sem_sla/vencendo_hoje/vencida/dentro_sla` por `due_at` + aging em horas. `app/Models/WorkOrder.php:883-907`

### Tickets

- `Ticket::kpis()`: `total, backlog(status in open/in_progress/waiting), closed_total, resolved_total, overdue, opened_today`. `app/Models/Ticket.php:102-123`

### Técnico parado (definição ausente)

- **Não há indicador único "técnico parado" no legado.** `technician_profiles.availability_status` e `last_seen_at` são usados em `TechnicianAvailability::boardSummary` (`available_now, busy_now, off_now, seen_24h`). `app/Models/TechnicianAvailability.php:43-64`
- CrewOps precisa **definir** "técnico parado" (tarefa 3.8 / R-034): baseado em `last_sync` reportado + disponibilidade. `[OPERAÇÃO]`

### Onde os indicadores são consumidos

- `app/Controllers/Admin/DashboardController.php:51-77` (admin) e `app/Controllers/DashboardController.php:28-57` (raiz) montam KPIs/queue/snapshot/board.

---

## Pontos de divergência relevante (resumo)

1. **Assinatura:** cliente captura desenho, servidor grava só nome → divergência a resolver.
2. **Nota vs evidência:** `note` mistura evento operacional e prova → CrewOps separa (D-002).
3. **Posição:** legado guarda só a última; CrewOps guarda pontos por evento.
4. **Status work_orders:** migração 038 estende enum (inclui `waiting_evidence`,`in_validation`); migração 007 inicial não os tinha — a fonte é a **migração 038** (mais recente).
5. **Atraso overdue:** `kpis` sem `due_at IS NOT NULL` (SQL pode avaliar NULL como falso em `NOT IN AND due_at<NOW`), `queueSummary` exige `due_at IS NOT NULL`. Divergência sutil a padronizar.

---

## Documentos vinculados

- `docs/LEGACY_REFERENCE_MAP.md` — onde procurar cada regra no legado.
- `docs/LEGACY_INVENTORY.md` — inventário detalhado (queries, status, permissões, snippets).
- `docs/CLASSIFICATION.md` — classificação 2.11 por regra (preservar/redesenhar/adiar/descartar).
- `docs/TRACEABILITY_MATRIX.md` — matriz 2.12 `fonte PHP → regra → spec → tarefa → teste` + gate de aprovação.
- `docs/DECISION_LOG.md` — decisões que essas classificações geram (D-IDs).
- `docs/PILOT_RATIFICATIONS.md` — pendências de valores/medição (R-IDs) correlacionadas.
