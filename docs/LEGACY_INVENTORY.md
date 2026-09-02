# Inventário Detalhado do Legado FieldOps PHP

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Grupo 2 (2.1–2.10)
> Data de registro: **2026-09-01**
> Status: **INVENTÁRIO (evidência, leitura somente)**. Contém os artefatos do legado que foram examinados, com snippets, queries, status, enums e permissões. Nenhum comportamento aqui é aprovação; a classificação está em `docs/CLASSIFICATION.md`.
> Toda origem é citada como `app/...:linha` ou `database/migrations/....sql:linha`.

---

## 1. Autenticação, sessão, usuários, RBAC (2.1)

### Arquivos examinados

| Artefato | Caminho | Relevância |
| --- | --- | --- |
| Login admin | `app/Controllers/Admin/AuthController.php` | fluxo login/logout + sessão + tenant default |
| Login técnico | `app/Controllers/App/AuthController.php` | login app com `app_guard` + CSRF |
| Login API | `app/Controllers/Api/V1/AuthApiController.php` | JWT com roles+permissions |
| Base | `app/Controllers/BaseController.php` | `currentUser/requireAuth/requireAdminUser/requireAppTechnician/requirePermission` |
| Middleware | `app/Middleware/AuthMiddleware.php` | guard por URI (`app` vs `admin` vs `api`) |
| Models | `app/Models/User.php`, `app/Models/Role.php` | permissões/roles/SQL |
| Migrations | `001_create_users_table.sql`, `002_create_rbac_tables.sql` | schema users + RBAC |

### Status de usuário

`ENUM('active','inactive','blocked') DEFAULT 'active'`, soft delete `deleted_at`. `001:10,14`

### RBAC — schema

- `roles` (`name` unique, `label`). `002:4-11`
- `permissions` (`name` unique, `label`, `group`). `002:13-19`
- `role_permissions` (PK `(role_id,permission_id)`, cascade). `002:21-27`
- `user_roles` (PK `(user_id,role_id)`, cascade). `002:29-35`

### RBAC — queries

```sql
-- permissões achatadas por usuário
SELECT DISTINCT p.name
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = ?            -- app/Models/User.php:19-26

-- roles por usuário
SELECT r.id, r.name, r.label
FROM roles r JOIN user_roles ur ON ur.role_id = r.id
WHERE ur.user_id = ? ORDER BY r.label ASC   -- app/Models/User.php:31-38
```

### Sessões

- Admin `$_SESSION['user']` com `roles` (array de nomes) e `permissions` (lista achatada). `app/Controllers/Admin/AuthController.php:60-71`
- App `$_SESSION['app_user']` + `$_SESSION['app_guard']='technician'` + `$_SESSION['app_tenant']`. `app/Controllers/App/AuthController.php:89-101,111`
- API não usa sessão; retorna Bearer `expires_in 3600`. `app/Controllers/Api/V1/AuthApiController.php:41-62`

### Bloqueios de perfil

- Admin bloqueia `operational_type ∈ ('technician','partner_pj')`. `app/Controllers/Admin/AuthController.php:50-55`
- App bloqueia `operational_type='system_user'`. `app/Controllers/App/AuthController.php:73-78`
- App exige `is_technician=1` se sem perfil. `app/Controllers/App/AuthController.php:80-84`

### Tenant default

```sql
SELECT t.* FROM tenant_users tu JOIN tenants t ON t.id=tu.tenant_id
WHERE tu.user_id=? AND tu.status='active' AND t.deleted_at IS NULL AND t.status='active'
ORDER BY t.name ASC LIMIT 1        -- app/Models/User.php:219-226
```

---

## 2. Empresa/tenant, filiais, técnicos, disponibilidade (2.2)

### Schema

- `tenants`: `uuid,name,slug,domain,status,plan`. `005:4-18`
- `tenant_units` (filial): `name,code,address,city,state,zip,lat,lng,status`. `005:20-39`
- `tenant_users`: `tenant_id,user_id,role_id,status`, UNIQUE `(tenant_id,user_id)`. `005:41-52`
- `tenant_settings`: `tenant_id,key,value,type`, UNIQUE `(tenant_id,key)`. `005:54-64`
- `technician_profiles`: `operational_type,person_type,status,availability_status,full_name,trade_name,company_*,cpf_cnpj,email,phone,whatsapp,emergency_contact,city,state,regions_text,skills_text,base_documents_text,notes,pix_key,bank_*`. `014:1-35` (+ `home_radius_km,base_latitude,base_longitude,availability_notes,score_manual,last_seen_at` via `016:37-43`).
- `technician_teams` + `technician_team_members`. `014:37-60`
- `technician_availability_slots`: `weekday,start_time,end_time,slot_type('available','busy','off'),notes`. `016:1-15`

### Enums de perfil do técnico

```sql
operational_type ENUM('system_user','technician','partner_pj') DEFAULT 'technician'   -- 014:5
person_type       ENUM('pf','pj') DEFAULT 'pf'                                        -- 014:6
status            ENUM('draft','pending','active','blocked','inactive') DEFAULT 'pending' -- 014:7
availability_status ENUM('available','busy','off') DEFAULT 'available'               -- 014:8
```

### Validação de criação/atualização de técnico

```php
'full_name' => 'required|min:3|max:150',
'operational_type' => 'required|in:system_user,technician,partner_pj',
'person_type' => 'required|in:pf,pj',
'status' => 'required|in:draft,pending,active,blocked,inactive',
'availability_status' => 'required|in:available,busy,off',
'email' => 'email|max:180'          // app/Controllers/Admin/TechnicianController.php:79-86
```

### Disponibilidade

- Atual: `availability_status` + `availability_notes` + `last_seen_at` (seta via `setAvailabilityStatus`). `app/Models/TechnicianProfile.php:125-128`
- Semana: `replaceWeekly()` deleta e reinsere slots. `app/Models/TechnicianAvailability.php:19-41`
- Board: `available_now, busy_now, off_now, seen_24h, avg_manual_score`. `app/Models/TechnicianAvailability.php:43-64`

### Regras de vínculo

- `userAlreadyLinked()` impede um `user_id` em dois perfis ativos. `app/Models/TechnicianProfile.php:101-110`
- `is_technician` do usuário é setado em `store`/`update` conforme `operational_type`. `app/Controllers/Admin/TechnicianController.php:101-103,160-162`

---

## 3. Clientes e sites/endereços (2.3)

### Schema

- `clients`: `name,document(CNPJ/CPF),email,phone,address,city,state,zip,notes,status('active','inactive'),deleted_at`. `006:4-24`
- `sites`: `client_id,name,code,address,city,state,zip,lat,lng,contact_name,contact_phone,notes,status,deleted_at`. `006:26-51`
- `lat/lng DECIMAL(10,7)` (não-PostGIS). `006:36-37`

### Validação

- Cliente create/update: `name required min:2 max:150`; `email`; `status in(active,inactive)`. `app/Controllers/Admin/ClientController.php:68-72,136-140`
- Site create: `name required min:2 max:150`; `client_id required exists:clients:id`. `app/Controllers/Admin/SiteController.php:49-52`
- Site update: `name required min:2`. `app/Controllers/Admin/SiteController.php:77-78`

### Busca (sem duplicidade explícita)

`ClientController::index` filtra `name`, `email`, `document` via `stripos` (pós-paginação). `app/Controllers/Admin/ClientController.php:29-38`. **Não há constraint de unicidade por documento.**

### Exclusão

- Soft delete auditável: `deleteWithAudit()`. `app/Controllers/Admin/ClientController.php:170-183`; `app/Controllers/Admin/SiteController.php:84-91`
- Cascade/FK: `sites.client_id ON DELETE CASCADE`; `tickets.client_id/site_id ON DELETE SET NULL`. `006:50`; `007:41-42`

---

## 4. Tickets (2.4)

### Schema e enums

- `ticket_categories` (`name,color,active`). `007:4-12`
- `tickets`: `number UNIQUE(tenant),client_id,site_id,category_id,title,description,priority('low','normal','high','critical'),status('open','in_progress','waiting','resolved','closed','cancelled'),opened_by,assigned_to,due_at,resolved_at,closed_at`. `007:14-45`
- `uq_tenant_number` `(tenant_id,number)`. `007:33`

### Número

```php
return 'TKT-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);  // app/Models/Ticket.php:41
```

### Validação e criação

```php
'title' => 'required|min:3|max:255',
'priority' => 'required|in:low,normal,high,critical'    // app/Controllers/Admin/TicketController.php:89-92
```
Admin: status inicial `open`, `opened_by` = usuário atual. `app/Controllers/Admin/TicketController.php:104-129`

### Status e timestamps

- `updateStatus()`: `resolved` → `resolved_at`; `closed` → `closed_at`. `app/Controllers/Admin/TicketController.php:193-199`

### Conversão em OS

- Não automática. `work_orders.ticket_id` opcional. `007:51`; `app/Controllers/Admin/WorkOrderController.php:169`
- Ticket lista OS vinculadas (`linkedOrders`). `app/Models/Ticket.php:76-82`; `app/Controllers/Admin/TicketController.php:157-163`

### App (técnico abre em campo)

- `storeTicket`: `opened_by` e `assigned_to` = técnico; `channel='field_app'`; `opened_via='field_app'`; `opened_in_field=1`. `app/Controllers/App/HomeController.php:149-175`

---

## 5. Ordens de serviço (2.5)

### Status (fonte: migração 038)

```sql
ALTER TABLE work_orders MODIFY COLUMN status
ENUM('pending','scheduled','dispatched','in_progress','waiting_evidence','in_validation','waiting_parts','completed','cancelled','rework')
NOT NULL DEFAULT 'pending'     -- 038:4
```
> A migração 007 (base) não incluía `waiting_evidence` nem `in_validation`; a **038 é a fonte atual** e expande o enum. `app/Models/WorkOrder.php:30-41` reflete os 10 estados.

### Prioridade

`ENUM('low','normal','high','critical') DEFAULT 'normal'`. `007:57`; labels `app/Models/WorkOrder.php:43-48`

### Número

```php
return 'OS-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);  // app/Models/WorkOrder.php:57
```

### Criação

```php
'title' => 'required|min:3|max:255',
'priority' => 'required|in:low,normal,high,critical'          // app/Controllers/Admin/WorkOrderController.php:144-147
```
Status inicial: `scheduled` se `technician_id && scheduled_at`; senão `pending`. `app/Controllers/Admin/WorkOrderController.php:166`

### Despacho

- `dispatch()`: atualiza `technician_id,scheduled_at,due_at,status`; grava `work_order_dispatch_events`. `app/Controllers/Admin/WorkOrderController.php:241-335`
- Evento `recordDispatchEvent()`: `event_type('assigned','reassigned','moved','dispatch_updated')`, diffs de técnico/status/prioridade/due_at/queue + `justification`. `app/Models/WorkOrder.php:590-614`; `038:48-75`

### Quick action

- `quickAction()`: reativar rework ou mover (técnico/status/prioridade/due_at/schedule). `app/Controllers/Admin/WorkOrderController.php:338-442`
- Event type derivado: `reassigned`/`assigned`/`moved`. `app/Controllers/Admin/WorkOrderController.php:407-412`

### Retrabalho

- `upsertRework()`: abre (status `rework`) ou fecha; grava `work_order_rework_events`. `app/Models/WorkOrder.php:544-588`
- `work_order_rework_events.event_type` `('requested','returned','contestation','resolved','reopened')`. `038:29`
- Motivos/causas origens fixos. `app/Controllers/Admin/WorkOrderController.php:639-679`

### Timeline

```sql
INSERT INTO work_order_timeline (work_order_id, tenant_id, user_id, action, from_status, to_status, notes, created_at) ...
-- app/Models/WorkOrder.php:157-161
```
Ações observadas: `created`, `dispatch_update`, `status_change`, `mobile_checkin`, `mobile_checkout`, `mobile_checklist`, `mobile_evidence_note`, `mobile_signature`, `mobile_upload`, `form_updated`, `rework_opened`, `rework_resolved`, `technician_assigned`, `technician_reassigned`, `priority_changed`, `due_changed`, `queue_changed`, `evidence_added`, `signature_added`.

### Formulário de execução

- `work_order_execution_forms` (`checklist_json, require_photos, require_signature, require_gps`) `009:4-13`.
- Migração 011 desdobra em `checklist_items, extra_fields, photo_mode, signature_mode`. `011:3-20`
- `saveExecutionForm()` salva; timeline `form_updated`. `app/Controllers/Admin/WorkOrderController.php:444-491`

---

## 6. App do técnico (2.6)

### Guard

- `requireTechnician()`: exige `is_technician` e `app_guard='technician'`. `app/Controllers/App/HomeController.php:21-29`

### Lista e cards

- `listForTechnicianMobile()`: exclui `cancelled`; ordena `in_progress` → `dispatched/scheduled` → resto. `app/Models/WorkOrder.php:357-395`
- `mobileCards()`: `open_total,in_progress,scheduled_today,overdue`. `app/Models/WorkOrder.php:746-765`

### Detalhe

- `getTechnicianActivityDetail()`: OS + execution_form + evidences + timeline + `mobile_payload`. `app/Models/WorkOrder.php:975-1045`

### Ações — pré-condições servidor

| Ação | Pré-condição servidor | Efeito | Evidência |
| --- | --- | --- | --- |
| `checkin` | GPS obrigatório | `in_progress` + `started_at` + nota `checkin_gps` | `WorkOrder.php:1071-1088` |
| `checkout` | GPS obrigatório | `completed` + `completed_at` + nota `checkout_gps` | `WorkOrder.php:1090-1107` |
| `checklist` | ≥1 item; campos extras obrigatórios | nota `checklist` | `WorkOrder.php:1109-1134` |
| `evidence_note` | texto ou arquivo (até 4) | nota `evidence_note` + `createFromBase64` por arquivo | `WorkOrder.php:1136-1160` |
| `signature` | `signer_name` | evidência `signature` + `signature_confirmed=1` | `WorkOrder.php:1162-1177` |

### Ações — pré-condições cliente (IndexedDB)

- `collectGps()` (enableHighAccuracy, timeout 12s, maximumAge 15s). `fieldops-app.js:269-278`
- `checkin/checkout/checklist/evidence_note` exigem GPS; falha se ausente. `fieldops-app.js:321-322`
- `signature` exige `signer_name` E `signature_drawn` (canvas). `fieldops-app.js:315-318`
- Compressão: max 1600px, qualidade 0.82. `fieldops-app.js:193-208`
- Evidência anexa até 4 arquivos. `fieldops-app.js:292`

> **Divergência a resolver (2.11/3.x):** o cliente captura assinatura **desenhada**; o servidor **ignora** `signature_drawn` e só persiste `signer_name`/`signer_role`. `fieldops-app.js:311,317,324` vs `app/Models/WorkOrder.php:1162-1175`.

---

## 7. Evidências (2.7)

### Schema

`work_order_evidences`: `evidence_type('attachment','signature','note'),title,notes,file_name,file_path,file_mime,file_size,signer_name,signer_role,metadata_json,created_by`. `010:4-19`

### Tipos

- `attachment` — arquivo (admin ou base64 mobile). `app/Models/WorkOrderEvidence.php:23-72`
- `signature` — `signer_name/role` + `metadata.confirmed`. `app/Models/WorkOrderEvidence.php:74-98`
- `note` — texto + `metadata{source,gps,kind}` (check-in/out, checklist, evidência textual). `app/Models/WorkOrderEvidence.php:100-123`

### Storage (limites por caminho e falhas)

**Multipart** (`storeUploadedFile`, admin `storeEvidence` / app `uploadEvidence`):
- Tamanho máx `10 * 1024 * 1024` validado no servidor. `app/Models/WorkOrderEvidence.php:131-134`
- Extensões `jpg,jpeg,png,pdf,webp`. `app/Models/WorkOrderEvidence.php:136-140`
- `move_uploaded_file()` (valida origem). `app/Models/WorkOrderEvidence.php:151`
- Pasta local `public/uploads/work_orders/{tenantId}/{workOrderId}/{Ymd_His}_{bin2hex(4)}_{safeName}.{ext}`. `app/Models/WorkOrderEvidence.php:142-149`

**Base64** (`storeBase64File`, fila offline / `evidence_note`):
- **Sem limite de tamanho no servidor** — decodifica com `base64_decode` e grava direto com `file_put_contents`; não usa `$maxSize`. `app/Models/WorkOrderEvidence.php:163-207`
- `file_size` só metadado (`strlen($binary)`). `app/Models/WorkOrderEvidence.php:205`
- Extensões `jpg,jpeg,png,pdf,webp`; infere por mime quando ausente. `app/Models/WorkOrderEvidence.php:178-192`
- Pasta local idêntica ao multipart. `app/Models/WorkOrderEvidence.php:193-199`

**Client-side:** até 4 arquivos (`files.slice(0, 4)`). `fieldops-app.js:292`
**Servidor (contagem):** `evidence_note` itera `$files` sem cap; `syncActions` aceita lote arbitrário. `app/Models/WorkOrder.php:1149-1157`; `app/Controllers/App/HomeController.php:574-606`

**Falhas/riscos (não preservar):**
- **Sem limite de tamanho/contagem no servidor para base64** → risco de DoS (memória/disco) e amplificação por lote. `app/Models/WorkOrderEvidence.php:174,200`; `app/Models/WorkOrder.php:1149-1157`
- **MIME confia no cliente** (`$uploadedFile['type']` / `$file['mime']`); sem content sniffing real no base64; `mime_content_type` é só fallback no multipart. `app/Models/WorkOrderEvidence.php:158,169,204`
- **Sem `is_uploaded_file()`/equivalente no base64** — bytes da requisição gravados via `file_put_contents`. `app/Models/WorkOrderEvidence.php:200`
- **`mkdir(..., 0777)`** world-writable. `app/Models/WorkOrderEvidence.php:143,194`
- **Pasta pública** `public/uploads/...` servida em `/uploads/...` (relativo, sem URL assinada); arquivo publicamente recuperável. `app/Models/WorkOrderEvidence.php:142,157,193,203`
- **Sem hash, sem URL temporária, sem estado de upload, sem autorização de delivery**; falha lança exceção. `app/Models/WorkOrderEvidence.php:127-134,166-176`
- **Base64 mobile aumenta payload** e trafega na requisição. `app/Models/WorkOrderEvidence.php:51-72`
- **CrewOps (redesenhar):** validação server-side de tamanho/contagem/MIME por content sniffing; permissões seguras (sem 0777); storage privado com URL pré-assinada (D-101/D-110); autorização por tenant/work-order; delivery não-público. Tarefas 13.1/13.3/13.4-13.7.

### Endpoints

- Admin `storeEvidence` (anexo) / `storeSignature` (nome). `app/Controllers/Admin/WorkOrderController.php:493-582`
- App `uploadEvidence` (anexo + GPS/metadata). `app/Controllers/App/HomeController.php:531-572`

---

## 8. Localização e mapa (2.8)

### Mapa

- Pontos de OS com `sites.lat/lng` não nulos + tickets abertos. `app/Models/WorkOrder.php:800-817`; `app/Models/Ticket.php:149-167`
- `mapSummary()`: `total,unassigned,rework,overdue,sites,clients`. `app/Models/WorkOrder.php:782-798`
- Ctrl: `MapOpsController::index/data` com filtros `status,technician_id,client_id,site_id,priority,rework_only,date_from,date_to,show_technicians,recent_only`. `app/Controllers/Admin/MapOpsController.php:15-80`

### Última posição conhecida

```sql
technician_profiles.last_latitude, last_longitude, last_location_at,
last_location_accuracy, last_location_source   -- 040:3-10
```
`updateLastLocation()` atualiza a última posição + `last_seen_at`; source default `app_ping`. `app/Models/TechnicianProfile.php:130-144`

### Recência

`listTechniciansWithGeo()` computa `location_recency_minutes`, `location_recency_label`, `location_recency_state`. `app/Models/User.php:199-211`

| Estado | Faixa | Rótulo |
| --- | --- | --- |
| `none` | sem posição | "Sem posição ao vivo" |
| `fresh` | ≤15min | <5min "Agora há pouco"; <60min "Há N min" |
| `stale` | 15–120min | <60min "Há N min"; ≤120min "Há Nh" |
| `old` | ≥120min | "Há Nh" |

`recent_only` → `last_location_at >= DATE_SUB(NOW(), INTERVAL 4 HOUR)`. `app/Models/User.php:171-173`

### Ping do app

- `pingLocation()` grava última posição (source `pwa_ping`). `app/Controllers/App/HomeController.php:502-529`
- Cliente: rota `/app/`; intervalo 2min mínimo; `setInterval 180000` (3min) + `visibilitychange`. `fieldops-app.js:343-361,398-401`

> **Distinção ponto atual × antigo:** o legado **só** tem a última posição (`last_*`). Não há stream de pontos. CrewOps cria `technician_locations` (pontos por evento) + última posição conhecida. (`docs/GLOSSARY.md` — `technician_location`).

---

## 9. Sincronização legado (2.9)

### Endpoints

- `syncData()` → `buildTechnicianSyncPayload()`. `app/Controllers/App/HomeController.php:492-500`
- `syncActions()` → `applyTechnicianAction()` por ação. `app/Controllers/App/HomeController.php:574-606`
- `pingLocation()` → posição. `app/Controllers/App/HomeController.php:502-529`

### Payload de download

```php
return [
  'technician_id' => $technicianId,
  'cards' => $cards,               // mobileCards
  'activities' => $activities,     // listForTechnicianSync
  'sync' => ['prepared_at'=>now(),'marker'=>$marker,'since'=>$since,'mode'=>'incremental'|'full','version'=>'v0.8.7'],
];                                 // app/Models/WorkOrder.php:405-416
```

- `since` = `last_marker` = `MAX(COALESCE(updated_at,created_at))`. `app/Models/WorkOrder.php:727-744`
- `listForTechnicianSync` exclui `cancelled`; filtra `COALESCE(updated_at,created_at) >= since`. `app/Models/WorkOrder.php:419-471`

### Fila local (IndexedDB)

- DB `fieldops-mobile` v3. Stores: `activities` (keyPath `id`), `queue` (keyPath `local_id`), `meta` (keyPath `key`). `fieldops-app.js:2-21`
- `enqueueAction()`: `local_id = tipo-Timestamp-random`; status `queued`/`pending`. `fieldops-app.js:156-161`
- `flushQueue()`: envia todos com status ≠ `sent`; marca `sent`/`failed` com `server_message`. `fieldops-app.js:125-155`
- `postActions()`: POST `/app/sync/actions` body `{actions}`. `fieldops-app.js:115-123`

### Riscos/limitações

- **Sem idempotência** (reenvio reaplica; não há `idempotency_key`). `fieldops-app.js:138-142`; `app/Controllers/App/HomeController.php:595-600`
- `local_id` por timestamp+random não é idempotência garantida. `fieldops-app.js:157`
- **Sem conflito explícito** — ação aplica sobre estado atual. `app/Models/WorkOrder.php:1047-1197`
- Dependência implícita de tempo do dispositivo. `fieldops-app.js:157`; `app/Models/WorkOrder.php:403`

---

## 10. Indicadores / dashboard (2.10)

### Indicadores de OS (fonte da regra)

| Indicador | SQL (fonte) | Evidência |
| --- | --- | --- |
| `open_total` | `SUM(status NOT IN ('completed','cancelled'))` | `WorkOrder.php:198` |
| `in_progress` | `SUM(status = 'in_progress')` | `WorkOrder.php:199` |
| `completed_today` | `SUM(status='completed' AND DATE(completed_at)=CURDATE())` | `WorkOrder.php:200` |
| `overdue` | `SUM(status NOT IN (...) AND due_at < NOW())` | `WorkOrder.php:201` |
| `rework_total` | `SUM(CASE WHEN rework_flag=1 OR status='rework' THEN 1 ELSE 0 END)` | `WorkOrder.php:202` |
| `unassigned_total` | `SUM(CASE WHEN technician_id IS NULL AND status NOT IN (...) THEN 1 ELSE 0 END)` | `WorkOrder.php:203` |
| `awaiting_execution_total` | `SUM(CASE WHEN status IN ('pending','scheduled','dispatched') THEN 1 ELSE 0 END)` | `WorkOrder.php:204` |
| `redistributed_today` | evento `reassigned` hoje | `WorkOrder.php:205` |
| `returns_today` | rework `requested/returned/contestation` hoje | `WorkOrder.php:206` |

### Queue summary

`queueSummary()` → `unassigned,awaiting_execution,scheduled,in_progress,awaiting_evidence,in_validation,rework,overdue,completed_today`. `app/Models/WorkOrder.php:213-240`. Labels em `queueLabels`. `WorkOrder.php:18-28`

### Snapshot operacional

`operationalSnapshot()` → mesma base de `queueSummary` + `total` + `devolutions_today` + `awaiting_evidence` + `in_validation`. `app/Models/WorkOrder.php:475-504`

### BI

- `biSummary()`: `total_orders,completed_total,open_total,overdue_total,unassigned_total,rework_total,avg_hours_to_assign,avg_hours_to_complete,returns_total,reassignments_total,rework_rate`. `WorkOrder.php:819-840`
- `biSlaSnapshot()`: `within_sla,due_today,overdue,avg_aging_hours`. `WorkOrder.php:952-966`
- `biAgingTable()`: buckets `encerrada/sem_sla/vencendo_hoje/vencida/dentro_sla`. `WorkOrder.php:883-907`

### Tickets

`Ticket::kpis()` → `total,backlog(in open/in_progress/waiting),closed_total,resolved_total,overdue,opened_today`. `app/Models/Ticket.php:102-123`

### Técnico parado / disponibilidade

- `TechnicianAvailability::boardSummary()` → `available_now,busy_now,off_now,seen_24h,avg_manual_score`. `app/Models/TechnicianAvailability.php:43-64`
- **Não** existe indicador único "técnico parado" no legado. CrewOps deve definir (3.8/R-034) com base em `last_sync` reportado + disponibilidade. `[OPERAÇÃO]`

---

## 11. Permissões (RBAC) — referência cruzada

| Permissão (nome) | Onde é exigida | Contexto |
| --- | --- | --- |
| `users.view` | `TechnicianController::index/show/compliance` | visualizar técnico |
| `users.create` | `TechnicianController::create/store` | criar técnico |
| `users.edit` | `TechnicianController::update/updateAvailabilityStatus/storeAvailability/storeRating/...` | editar técnico |

> O legado usa permissões por **nome granular**; o CrewOps adota matriz simples recurso×ação com 5 perfis fixos (tarefa 3.6).

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — regras por domínio.
- `docs/CLASSIFICATION.md` — classificação 2.11.
- `docs/TRACEABILITY_MATRIX.md` — matriz 2.12.
- `docs/LEGACY_REFERENCE_MAP.md` — onde procurar cada módulo.
- `docs/DECISION_LOG.md` — decisões geradas.
- `docs/PILOT_RATIFICATIONS.md` — pendências de valores (R-IDs).
