# Plano Grupo 5 — Contratos compartilhados e modelo de dados

## 5.1 Definir IDs, timestamps UTC, enums e schemas compartilhados em `packages/shared/src` sem acoplar o PWA ao ORM

### Objetivo e comportamento esperado
`packages/shared` deve ser a única fonte de constantes/enum nominais, tipos TypeScript e schemas de validação usados por `apps/api`, `apps/web` e PWA. Não pode importar `drizzle-orm`. Todos os identificadores são UUID strings; datas/horas usam UTC no transporte e no banco; enums refletem as matrizes e o glossário do Grupo 3.

### Comportamento atual
`packages/shared/src/index.ts` exporta apenas `workOrderStatuses`, `technicianEventTypes`, `gpsPolicy`, `appEnvironments`, `errorCodes` e tipos derivados (`packages/shared/src/index.ts:1-52`). Os estados da OS ainda são `draft/open/assigned/en_route/arrived/in_progress/blocked/done/cancelled`, divergentes de `docs/STATE_MATRICES.md` e `docs/GLOSSARY.md`. Faltam enums para perfis, ticket, prioridade, tipo de OS, status de evidência, resultado de sync, etc.

### Arquivos envolvidos
- Alterar: `packages/shared/src/index.ts`
- Criar: `packages/shared/src/schemas.ts`
- Criar/alterar: `packages/shared/test/constants.unit.spec.ts`, `packages/shared/test/schemas.unit.spec.ts`
- Dependência: adicionar `zod` a `packages/shared/package.json` (schema validation leve, sem runtime do ORM)

### Trabalho backend/db/migration/dependency
1. Reorganizar `index.ts` em seções: IDs/UUID helpers, timestamps, perfis, prioridade, ticket status, work order status/type, evidence, sync result, error codes, GPS policy.
2. Exportar arrays `as const` e tipos derivados para:
   - `UserRole`: `admin`, `gestor_operacional`, `atendente`, `despachante`, `tecnico`
   - `TicketStatus`: `open`, `in_progress`, `waiting`, `resolved`, `closed`, `cancelled`
   - `WorkOrderStatus`: `pending`, `scheduled`, `dispatched`, `in_progress`, `waiting_evidence`, `in_validation`, `waiting_parts`, `completed`, `cancelled`, `rework`
   - `WorkOrderType`: `corrective`, `preventive`, `installation`, `survey`
   - `Priority`: `low`, `normal`, `high`, `critical`
   - `EvidenceType`: `photo`, `signature`, `attachment`
   - `EvidenceStatus`: `pending_upload`, `uploaded`, `failed`
   - `TechnicianAvailability`: `available`, `busy`, `off`
   - `SyncResult`: `applied`, `already_done`, `rejected`, `conflict`, `retry_later`
3. Manter `ErrorCode` existente; adicionar `IDEMPOTENT_REPLAY` se ausente.
4. Em `schemas.ts` definir Zod schemas reutilizáveis: `uuidString`, `utcTimestampString`, `paginationQuery`, `syncEnvelope`, `workOrderEventPayload`, `evidenceMetadata`.
5. Garantir que schemas não referenciem tabelas Drizzle.

### Validações, autorização, integridade
- Schemas devem rejeitar datas sem fuso (`Z` explícito).
- `uuidString` deve usar `z.uuid()`.
- Erros estáveis do `API_CONTRACT.md` §5 devem ter códigos presentes.

### Riscos e mitigações
- **Risco:** renomear enums no shared quebra compilação de `apps/api` e `apps/web` que ainda não usam os estados finais.  
  **Mitigação:** este grupo pode quebrar builds antigos de protótipo; o implementer deve atualizar todas as referências internas no mesmo PR e rodar `npm run typecheck`.
- **Risco:** adicionar `zod` aumenta bundle do PWA.  
  **Mitigação:** usar apenas schemas pequenos; importar por path; tree-shaking minimiza impacto.

### Testes
- `packages/shared/test/constants.unit.spec.ts`: cobertura de todos os arrays `as const` (não vazios, sem duplicatas, valores esperados).
- `packages/shared/test/schemas.unit.spec.ts`: validar UUID válido/inválido, timestamp UTC válido/inválido, payload de evento.
- `npm run typecheck -w @crewops/shared` sem erros.

### Critérios de conclusão e rastreabilidade
- `packages/shared/src/index.ts` exporta todos os enums dos perfis, ticket, OS, prioridade, evidência, sync e erros (`5.1`).
- Nenhum import de `drizzle-orm` em `packages/shared`.
- Testes unitários passam.

---

## 5.2 Modelar em `packages/db/src` empresas, filiais, usuarios, perfis e sessoes com indices e unicidade por empresa

### Objetivo e comportamento esperado
Tabelas `companies`, `branches`, `users`, `sessions`. Perfis são os cinco do MVP (`admin`, `gestor_operacional`, `atendente`, `despachante`, `tecnico`). Cada linha operacional pertence a uma `company_id`; `branch_id` quando aplicável. Sessão é revogável e pertence a usuário/empresa/filial.

### Comportamento atual
`schema.ts:44-89` define `companies`, `branches`, `users`. `user_role` enum está com valores antigos (`owner`, `dispatcher`, `technician`, `viewer`). Não existe `sessions`. `branches` não tem `code` nem `timezone`. `users.email` tem unique global.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`
- Criar migration: `packages/db/drizzle/0001_...` (via `drizzle-kit generate`)
- Criar teste: `packages/db/test/schema.integration.spec.ts`
- Adaptar seed se colunas novas forem `notNull`

### Trabalho backend/db/migration/dependency
1. Atualizar `userRole` enum para os 5 perfis do MVP.
2. `companies`:
   - adicionar `slug varchar(80)` único? Decisão: adiar; manter `name`, `document`, `active`, timestamps.
   - adicionar `deletedAt` soft delete.
3. `branches`:
   - adicionar `code varchar(40) not null`
   - adicionar `timezone varchar(60)` default `'America/Sao_Paulo'`
   - adicionar campos opcionais de endereço operacional: `street`, `number`, `district`, `city`, `state`, `postalCode`
   - adicionar `deletedAt`
   - unique `(company_id, code)`
   - indexes `(company_id)`, `(company_id, active)`
4. `users`:
   - adicionar `status` enum `active | inactive | blocked` default `active`
   - alterar unique de `email` global para `(company_id, email)` — resolve pendência D-109 até Produto ratificar
   - adicionar `deletedAt`
   - indexes `(company_id)`, `(company_id, status)`, `(company_id, email)`
5. `sessions` (nova):
   - `id uuid primaryKey defaultRandom`
   - `userId uuid not null` → FK `users.id`
   - `companyId uuid not null` → FK `companies.id`
   - `branchId uuid` → FK `branches.id`
   - `role userRole not null`
   - `refreshTokenHash text not null` (nunca o token em claro)
   - `expiresAt timestamptz not null`
   - `revokedAt timestamptz`
   - `deviceId varchar(120)`, `ipHash varchar(64)`, `userAgent text`
   - `createdAt`, `updatedAt`
   - indexes `(user_id)`, `(company_id)`, `(refresh_token_hash)`, `(expires_at)`, `(revoked_at)`

### Validações, autorização, integridade
- `users.status` impede login quando `inactive`/`blocked` (Group 6 valida).
- Soft delete `deletedAt` não apaga dados; queries ativas devem filtrar `IS NULL` (Group 6+).
- FKs com `ON DELETE no action` para evitar perda acidental; exclusão lógica via soft delete.
- Unique `(company_id, email)` evita duplicidade dentro da empresa sem bloquear multi-empresa futura.

### Riscos e mitigações
- **Risco:** mudar unique de `email` global para `(company_id, email)` conflita com seed existente que usa `email` único.  
  **Mitigação:** seed usa uma única empresa, portanto não conflita; migration deve dropar unique antigo e criar novo.
- **Risco:** `sessions` armazena dados sensíveis.  
  **Mitigação:** token em claro nunca é persistido; `refreshTokenHash` com SHA-256 ou bcrypt; sem bytes de senha.

### Testes
- Integration: inserir usuários com mesmo email em empresas diferentes deve funcionar; mesmo email na mesma empresa deve falhar.
- Integration: `sessions` FK rejeita `company_id` inexistente; soft delete coluna presente.
- `npm run test:integration -w @crewops/db`

### Critérios de conclusão e rastreabilidade
- Tabelas `companies`, `branches`, `users`, `sessions` modeladas com soft delete, índices e unicidade por empresa (`5.2`).
- `user_role` reflete os 5 perfis do MVP.
- Seed continua funcionando (`npm run db:seed -- --reset`).

---

## 5.3 Modelar tecnicos, vínculo com usuario, filial e disponibilidade sem incluir o People Core completo do legado

### Objetivo e comportamento esperado
Tabela `technicians` vincula `users` (1:1 ativo), `branches` e `companies`. Armazena apenas disponibilidade atual; não replica grade semanal, `operational_type`, `person_type` nem histórico salarial do legado.

### Comportamento atual
`schema.ts:91-110` define `technicians` com `companyId`, `branchId`, `userId`, `phone`, `active`, timestamps. Falta `availability_status`, `status`, soft delete e unique ativo por `user_id`.

### Comportamento legado
`docs/REQUIRED_FIELDS.md` §2.3 cita `technician_profiles` (`database/migrations/014_people_core_v040.sql`) e `TechnicianController.php:79-86` com `operational_type`, `person_type`, `status`, `availability_status`. `docs/GLOSSARY.md` determina: grade semanal adiada; disponibilidade atual entra.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`, `packages/db/src/seed.ts`
- Migration: novo arquivo em `packages/db/drizzle/`
- Teste: `packages/db/test/schema.integration.spec.ts`

### Trabalho backend/db/migration/dependency
1. Adicionar enum `technicianStatus`: `active`, `inactive`.
2. Adicionar enum `technicianAvailability`: `available`, `busy`, `off`.
3. `technicians`:
   - `status technicianStatus default active not null`
   - `availabilityStatus technicianAvailability default available not null`
   - `employeeId varchar(40)` opcional (matrícula/código interno)
   - `deletedAt timestamptz`
   - unique `(company_id, user_id)` para impedir dois perfis ativos para o mesmo usuário
   - indexes `(company_id)`, `(branch_id)`, `(company_id, status)`, `(company_id, availability_status)`, `(user_id)`
4. Atualizar seed para preencher `availabilityStatus` default `available`.

### Validações, autorização, integridade
- FK `userId` referencia `users.id`; unique `(company_id, user_id)` garante um técnico por usuário na empresa.
- `technicians.status = 'inactive'` impede atribuição (Group 8 valida).
- Soft delete preserva histórico de vinculação.

### Riscos e mitigações
- **Risco:** unique `(company_id, user_id)` pode conflitar se houver técnico soft-deleted e novo ativo para mesmo usuário.  
  **Mitigação:** usar unique parcial `WHERE deleted_at IS NULL` se Drizzle/Postgres suportar; senão validar na aplicação.

### Testes
- Integration: inserir dois técnicos ativos para mesmo `user_id` na mesma empresa falha.
- Integration: soft delete coluna existe e permite reativar depois.
- Seed: `npm run db:seed -- --reset` cria técnico com `availability_status='available'`.

### Critérios de conclusão e rastreabilidade
- `technicians` modelado com vínculo usuário/filial/empresa, status e disponibilidade (`5.3`).
- Não há tabelas de People Core (grade, cargo, etc.).

---

## 5.4 Modelar clientes e enderecos de atendimento separados, incluindo coluna PostGIS e snapshot operacional necessario

### Objetivo e comportamento esperado
`customers` é identidade. `service_addresses` é local físico (renomear de `customer_addresses`), com `geometry(Point,4326)` nulo aceito e pertencente a `company_id`/`customer_id`. `work_orders` carrega snapshot do endereço no momento do atendimento para prova histórica.

### Comportamento atual
`schema.ts:112-145` usa `customers` e `customer_addresses`; tabela não tem `company_id` nem coluna PostGIS. `work_orders` não tem snapshot. `docs/GLOSSARY.md` exige `service_addresses`.

### Comportamento legado
`docs/REQUIRED_FIELDS.md` §2.4-2.5: cliente separado de endereço; `sites` (PHP) vira `service_addresses`; coordenada nula permitida; snapshot preservado em atendimento concluído.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`, `packages/db/src/seed.ts`
- Migration: novo arquivo em `packages/db/drizzle/`
- Teste: `packages/db/test/schema.integration.spec.ts`

### Trabalho backend/db/migration/dependency
1. Renomear tabela `customer_addresses` → `service_addresses`.
2. `service_addresses`:
   - adicionar `companyId uuid not null` → FK `companies.id`
   - adicionar `postalCode varchar(16)`
   - adicionar `geometry geometry(Point, 4326)` nullable
   - adicionar `contactName varchar(160)`, `contactPhone varchar(32)`, `instructions text`
   - adicionar `latitude numeric(10,7)`, `longitude numeric(10,7)` redundantes para leitura fácil
   - adicionar `deletedAt`
   - indexes: `(company_id)`, `(customer_id)`, GiST em `geometry`, `(company_id, city, state)`
3. `customers`:
   - adicionar `status` enum `active`, `inactive` default `active`
   - adicionar `email varchar(190)`
   - unique `(company_id, document)` permitindo múltiplos nulos
   - adicionar `deletedAt`
   - indexes `(company_id, status)`, `(company_id, document)`
4. `work_orders`:
   - adicionar `addressSnapshot jsonb` para guardar cópia do endereço usado no atendimento
   - snapshot preenchido na criação (Group 8); aqui apenas schema.

### Validações, autorização, integridade
- `geometry` aceita nulo (OS sem coordenada permitida).
- FKs garantem que endereço pertence à mesma empresa do cliente e da OS (composite FKs em 5.8).
- Snapshot preserva prova mesmo se `service_addresses` for editado depois.

### Riscos e mitigações
- **Risco:** renomear tabela quebra FKs e seed.  
  **Mitigação:** migration gerada pelo DrizzleKit deve fazer `ALTER TABLE ... RENAME TO` e ajustar FKs; seed deve usar novo nome.
- **Risco:** PostGIS não habilitado no ambiente de teste.  
  **Mitigação:** migration 0000 já cria extensão; teste de schema verifica `geometry` exists.

### Testes
- Integration: inserir `service_addresses` com `geometry(ST_SetSRID(ST_MakePoint(lng,lat),4326))` e consultar por proximidade.
- Integration: inserir sem `geometry` funciona.
- Integration: FK rejeita `company_id` divergente do `customer_id` (via composite FK).
- Seed: cria customer e service_address.

### Critérios de conclusão e rastreabilidade
- Tabela `service_addresses` existe com PostGIS, company_id e soft delete (`5.4`).
- `work_orders.address_snapshot` existe para prova histórica.
- Cliente e endereço são entidades separadas.

---

## 5.5 Modelar tickets, ordens de servico e despachos com FKs, estados, prazos e indices de fila operacional

### Objetivo e comportamento esperado
` tickets` e `work_orders` usam enums finais do Grupo 3. `work_orders` reflete status atual; histórico fica em `work_order_events`. `dispatches` registra atribuição, reagendamento, desatribuição e reatribuição com autor e justificativa.

### Comportamento atual
`schema.ts:147-198` tem `tickets` e `work_orders` com status em `varchar` e enum `work_order_status` ainda antigo (`draft/open/assigned/en_route/arrived/in_progress/blocked/done/cancelled`). Não existe tabela `dispatches`.

### Comportamento legado
`docs/STATE_MATRICES.md` define estados e transições de ticket e OS. `docs/WORK_ORDER_FLOW.md` descreve criação, despacho, check-in/out. `docs/OPERATIONAL_POLICIES.md` §1 registra reatribuição auditável.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`
- Criar: migration em `packages/db/drizzle/`
- Teste: `packages/db/test/schema.integration.spec.ts`

### Trabalho backend/db/migration/dependency
1. Criar enums:
   - `ticketStatus`: `open`, `in_progress`, `waiting`, `resolved`, `closed`, `cancelled`
   - `workOrderStatus`: `pending`, `scheduled`, `dispatched`, `in_progress`, `waiting_evidence`, `in_validation`, `waiting_parts`, `completed`, `cancelled`, `rework`
   - `workOrderType`: `corrective`, `preventive`, `installation`, `survey`
   - `priority`: `low`, `normal`, `high`, `critical`
2. `tickets`:
   - `status ticketStatus default open not null`
   - `priority priority default normal not null`
   - `assignedToUserId uuid` → FK `users.id`
   - `createdByUserId uuid not null` → FK `users.id`
   - `resolvedAt`, `closedAt`
   - `deletedAt`
   - unique `(company_id, number)`
   - indexes `(company_id, status)`, `(company_id, priority)`, `(company_id, created_at)`
3. `work_orders`:
   - `status workOrderStatus default pending not null`
   - `type workOrderType default corrective not null`
   - `priority priority default normal not null`
   - `startedAt`, `validatedAt`, `cancelledAt`, `completedAt`
   - `cancellationReason text`
   - `addressSnapshot jsonb`
   - `currentDispatchId uuid` → FK `dispatches.id` (nullable, adicionado após criação da tabela `dispatches`)
   - `deletedAt`
   - unique `(company_id, number)`
   - indexes de fila: `(company_id, status)`, `(company_id, technician_id, status)`, `(company_id, due_at, status)`, `(company_id, branch_id, status)`, `(company_id, scheduled_at)`
4. `dispatches` (nova):
   - `id uuid primaryKey`
   - `companyId`, `branchId`, `workOrderId` → FKs
   - `technicianId` nullable → FK `technicians.id`
   - `previousTechnicianId` nullable → FK `technicians.id`
   - `authorUserId` not null → FK `users.id`
   - `eventType` enum: `dispatch_created`, `technician_assigned`, `technician_reassigned`, `schedule_changed`, `unassigned`
   - `scheduledAt`, `dueAt`
   - `reason text`
   - `createdAt`
   - indexes `(company_id, work_order_id)`, `(company_id, technician_id)`, `(work_order_id, created_at)`

### Validações, autorização, integridade
- `work_orders.status` default `pending` reflete criação sem técnico/agendamento.
- FK composite (5.8) garante que ticket/customer/address/technician pertencem à mesma empresa.
- `dispatches.eventType` impede valores arbitrários.

### Riscos e mitigações
- **Risco:** alterar enum `work_order_status` com valores em uso no seed/testes legados.  
  **Mitigação:** não há dados produtivos; migration dropar/recreate enum ou usar `ALTER TYPE`; testes adaptados.
- **Risco:** `dispatches` referencia `work_orders` e vice-versa via `currentDispatchId`.  
  **Mitigação:** criar `dispatches` primeiro; `work_orders.current_dispatch_id` FK `ON DELETE SET NULL`.

### Testes
- Integration: inserir OS com status `pending` e transicionar para `dispatched`.
- Integration: `dispatches` unique? Não; histórico permite vários. Verificar FK de `previous_technician_id`.
- Integration: índices de fila existem (`pg_indexes`).

### Critérios de conclusão e rastreabilidade
- `tickets`, `work_orders`, `dispatches` modelados com enums do Grupo 3, prazos e índices operacionais (`5.5`).
- Não há OS sem `company_id`.

---

## 5.6 Modelar `work_order_events` com payload, ator, origem, idempotencia, horarios, offline e localizacao opcional

### Objetivo e comportamento esperado
`work_order_events` é a verdade operacional imutável. Cada evento carrega payload JSONB, ator, origem (`device_id`/`source`), `idempotency_key`, horários `occurred_at` (dispositivo) e `received_at` (servidor), flag `created_offline` e localização opcional.

### Comportamento atual
`schema.ts:228-249` define `work_order_events` com `eventType` ainda do enum antigo, `metadata`, `notes`, `locationEventId`, mas sem `idempotency_key`, `occurred_at`, `received_at`, `created_offline`, `device_id`, payload separado nem coordenadas opcionais.

### Comportamento legado
`openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §4 lista campos obrigatórios: `id`, `company_id`, `branch_id`, `work_order_id`, `technician_id`, `actor_user_id`, `event_type`, `payload`, `idempotency_key`, `occurred_at`, `received_at`, `created_offline`, `device_id`, `lat/lng/accuracy`. `docs/GLOSSARY.md` define event imutável.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`
- Migration: novo arquivo em `packages/db/drizzle/`
- Teste: `packages/db/test/schema.integration.spec.ts`

### Trabalho backend/db/migration/dependency
1. Renomear enum `technician_event_type` → `work_order_event_type` e expandir valores para cobrir:
   - `dispatch_created`, `technician_assigned`, `technician_reassigned`, `schedule_changed`, `unassigned`
   - `check_in`, `service_started`, `service_finished`
   - `status_changed`
   - `note_added`
   - `evidence_uploaded`
   - `waiting_parts`, `waiting_evidence`, `in_validation`
   - `cancelled`, `completed`, `rework_opened`, `rework_resolved`
   - `correction_applied`
   - `manual_location_ping`, `foreground_sync`
2. `work_order_events`:
   - `eventType work_order_event_type not null`
   - `payload jsonb not null default '{}'` (dados semânticos do evento)
   - `metadata jsonb` (dados técnicos: app version, source)
   - `idempotencyKey text not null`
   - `occurredAt timestamptz not null` (horário do dispositivo/negócio)
   - `receivedAt timestamptz default now() not null` (horário do servidor)
   - `createdOffline boolean default false not null`
   - `deviceId varchar(120)`
   - `lat numeric(10,7)`, `lng numeric(10,7)`, `accuracyMeters integer`
   - `locationEventId uuid` → FK `technician_locations.id`
   - `dispatchId uuid` → FK `dispatches.id`
   - `evidenceId uuid` → FK `evidences.id`
   - `correctionForEventId uuid` → FK `work_order_events.id` (auto-referência)
   - `actorUserId` e `actorRole userRole`
   - remover `notes` (vira payload `note_added`)
   - indexes `(company_id, work_order_id, received_at)`, `(work_order_id, occurred_at)`, `(company_id, idempotency_key)`, `(company_id, device_id, idempotency_key)`, `(technician_id, received_at)`, `(correction_for_event_id)`
3. Não adicionar `deletedAt`; eventos são imutáveis.

### Validações, autorização, integridade
- `idempotency_key` + escopo impede duplicação (5.8).
- `occurred_at` pode ser anterior a `received_at`; não aceitar `occurred_at` no futuro além de tolerância (validação aplicação).
- FKs para `technician_locations`, `dispatches`, `evidences` opcionais.

### Riscos e mitigações
- **Risco:** eventos imutáveis sem soft delete podem crescer.  
  **Mitigação:** partitionamento/partição futura; MVP não arquiva.
- **Risco:** payload JSONB sem schema pode armazenar dados inconsistentes.  
  **Mitigação:** validação por Zod schemas do `packages/shared` antes de inserir.

### Testes
- Integration: inserir evento com todas as colunas opcionais nulas funciona.
- Integration: `idempotency_key` duplicado no mesmo escopo falha.
- Integration: `work_order_id` FK rejeita OS inexistente.

### Critérios de conclusão e rastreabilidade
- `work_order_events` contém payload, idempotência, horários, offline, localização e referências opcionais (`5.6`).
- Eventos não são editáveis (sem `updatedAt`/`deletedAt`).

---

## 5.7 Modelar `technician_locations`, `evidences`, `sync_receipts` e `audit_logs` com indices de consulta e retencao

### Objetivo e comportamento esperado
- `technician_locations` renomeado de `technician_location_events`, com pontos por evento e última posição.
- `evidences` renomeado de `work_order_evidences`, com status de upload, tipo, assinatura e referência ao arquivo.
- `sync_receipts` registra resultado idempotente por evento/evidência.
- `audit_logs` registra ações administrativas e segurança.

### Comportamento atual
`schema.ts:200-226` tem `technician_location_events`; `schema.ts:251-278` tem `files` e `work_order_evidences`. Não existem `sync_receipts` nem `audit_logs`.

### Comportamento legado
`docs/GLOSSARY.md`: `technician_location` é ponto por evento; `evidence` tem estado de upload; `sync_receipt` é novo; `audit_logs` para ações administrativas. `docs/EVIDENCE_POLICY.md` define estados `pending_upload`, `uploaded`, `failed`.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`
- Migration: novo arquivo em `packages/db/drizzle/`
- Teste: `packages/db/test/schema.integration.spec.ts`

### Trabalho backend/db/migration/dependency
1. Renomear `technician_location_events` → `technician_locations`:
   - adicionar `receivedAt timestamptz default now() not null`
   - adicionar `geometry geometry(Point,4326) not null`
   - adicionar `eventId uuid` → FK `work_order_events.id`
   - `source` enum: `pwa_foreground`, `pwa_manual_ping`, `web`, `api`, `unknown`
   - indexes: GiST em `geometry`, `(technician_id, captured_at DESC)`, `(company_id, captured_at)`
2. Renomear `work_order_evidences` → `evidences`:
   - `evidenceType` enum `photo`, `signature`, `attachment`
   - `status` enum `pending_upload`, `uploaded`, `failed`
   - `fileId uuid` → FK `files.id`
   - `eventId uuid` → FK `work_order_events.id`
   - `idempotencyKey text not null`
   - `signerName varchar(160)`, `signerRole varchar(80)`
   - `caption text`, `uploadError text`
   - `deletedAt`
   - indexes `(company_id, work_order_id)`, `(work_order_id, status)`, `(company_id, idempotency_key)`, `(technician_id)`
3. `files`: manter; adicionar `deletedAt` e `companyId` já existe. Index `(company_id, object_key)`.
4. `sync_receipts` (nova):
   - `id uuid primaryKey`
   - `companyId`, `deviceId varchar(120)`, `idempotencyKey text`
   - `workOrderEventId uuid` nullable → FK
   - `evidenceId uuid` nullable → FK
   - `status` enum `applied`, `already_done`, `rejected`, `conflict`, `retry_later`
   - `payloadHash text`
   - `processedAt timestamptz default now() not null`
   - `errorCode varchar(40)`, `errorMessage text`
   - indexes `(company_id, device_id, idempotency_key)` unique, `(company_id, work_order_event_id)`, `(company_id, processed_at)`
5. `audit_logs` (nova):
   - `id uuid primaryKey`
   - `companyId`, `actorUserId`, `targetUserId`
   - `resource varchar(60)`, `action varchar(60)`, `resourceId uuid`
   - `payload jsonb`
   - `ipHash varchar(64)`, `userAgent text`
   - `occurredAt`, `createdAt`
   - indexes `(company_id, occurred_at)`, `(resource, action)`, `(actor_user_id)`, `(resource_id)`

### Validações, autorização, integridade
- `evidences.status` controla visibilidade no painel.
- `sync_receipts` unique impede reprocessamento duplicado.
- `audit_logs` não armazena bytes, tokens nem senhas.

### Riscos e mitigações
- **Risco:** renomear tabelas quebram testes/seed.  
  **Mitigação:** ajustar seed e testes no mesmo PR.
- **Risco:** `evidences` com `fileId` not null impede registro antes do upload.  
  **Mitigação:** `fileId` pode ser nulo até confirmação; `status=pending_upload` reflete isso. Ajustar para nullable.

### Testes
- Integration: inserir `technician_locations` com PostGIS; consultar última posição.
- Integration: inserir evidência `pending_upload` sem `fileId` (nullable).
- Integration: `sync_receipts` unique rejeita duplicado.
- Integration: `audit_logs` insere payload sem dados sensíveis.

### Critérios de conclusão e rastreabilidade
- Tabelas `technician_locations`, `evidences`, `sync_receipts`, `audit_logs` existem com índices de consulta (`5.7`).
- Estados de evidência refletem `docs/EVIDENCE_POLICY.md`.

---

## 5.8 Criar constraints que impeçam duplicidade de `idempotency_key` no escopo correto e referencias entre empresas

### Objetivo e comportamento esperado
Nenhum evento/evidência/sync é processado duas vezes com a mesma chave no mesmo escopo. Nenhuma FK permite vincular registros de empresas distintas (ex.: OS de empresa A apontando para técnico de empresa B).

### Comportamento atual
Não há unique em `idempotency_key`. FKs são simples `(id)` sem validar `company_id`.

### Arquivos envolvidos
- Alterar: `packages/db/src/schema.ts`
- Migration: novo arquivo em `packages/db/drizzle/`

### Trabalho backend/db/migration/dependency
1. Unique constraints:
   - `work_order_events`: `(company_id, device_id, idempotency_key)`
   - `evidences`: `(company_id, idempotency_key)` (evidência não depende de device_id)
   - `sync_receipts`: `(company_id, device_id, idempotency_key)`
2. Composite FKs cruzando `company_id`:
   - Criar `uniqueIndex` `(company_id, id)` em `tickets`, `customers`, `service_addresses`, `technicians`, `users`, `branches`, `dispatches`.
   - Alterar FKs de `work_orders` para:
     - `(company_id, ticket_id)` → `tickets(company_id, id)`
     - `(company_id, customer_id)` → `customers(company_id, id)`
     - `(company_id, address_id)` → `service_addresses(company_id, id)`
     - `(company_id, technician_id)` → `technicians(company_id, id)`
     - `(company_id, branch_id)` → `branches(company_id, id)`
   - Aplicar padrão similar em `tickets` (`customer_id`, `address_id`, `assigned_to_user_id`), `dispatches`, `evidences`, `work_order_events`, `technician_locations`, `sync_receipts`.

### Validações, autorização, integridade
- `idempotency_key` duplicada no escopo gera erro de unique do PostgreSQL; aplicação mapeia para `IDEMPOTENT_REPLAY` ou `already_done`.
- Composite FKs rejeitam violação de isolamento multi-empresa no banco.

### Riscos e mitigações
- **Risco:** composite FKs exigem `uniqueIndex(company_id, id)` em todas as tabelas referenciadas; aumentam número de índices.  
  **Mitigação:** são necessários para integridade; manter.
- **Risco:** DrizzleKit pode gerar SQL complexo para adicionar FKs em tabela populada.  
  **Mitigação:** validar migration em banco limpo e com seed.

### Testes
- Integration: tentar inserir OS com `customer_id` de outra empresa falha.
- Integration: tentar inserir evento com `idempotency_key` duplicada no mesmo `(company_id, device_id)` falha.
- Integration: `sync_receipts` duplicado falha.

### Critérios de conclusão e rastreabilidade
- Constraints de idempotência e composite FKs de empresa aplicadas (`5.8`).
- Testes demonstram rejeição de referências cruzadas.

---

## 5.9 Criar migrations e testes de schema para constraints, cascatas, soft delete e extensao PostGIS

### Objetivo e comportamento esperado
Migrations Drizzle determinísticas recriam/alteram o schema final. Testes verificam extensão PostGIS, constraints, índices, soft delete columns, comportamento de rollback e que `drizzle-kit migrate` + `db:migrate:check` passam.

### Comportamento atual
Migration inicial `0000_needy_demogoblin.sql` já cria PostGIS e tabelas iniciais. `packages/db/test/migration.integration.spec.ts` testa aplicação/rollback/check. `packages/db/test/seed.integration.spec.ts` testa seed. Não há teste de schema específico.

### Arquivos envolvidos
- Criar/alterar: `packages/db/drizzle/0001_...`, `packages/db/drizzle/meta/_journal.json`
- Criar: `packages/db/test/schema.integration.spec.ts`
- Reusar: `packages/db/test/migration.integration.spec.ts`, `packages/db/src/migrate-check.ts`

### Trabalho backend/db/migration/dependency
1. Executar `npm run db:generate -w @crewops/db` após alterar `schema.ts` para gerar migration 0001.
2. Revisar SQL gerado: renomeações devem ser `ALTER TABLE ... RENAME TO`; enums devem ser recriados corretamente; PostGIS `CREATE EXTENSION` deve permanecer idempotente.
3. Em `schema.integration.spec.ts`, testar:
   - `SELECT postgis_version()` retorna valor.
   - Todas as tabelas esperadas existem.
   - Colunas `deleted_at` existem nas tabelas operacionais.
   - Unique constraints `(company_id, email)`, `(company_id, code)`, `(company_id, number)` existem.
   - Composite FKs rejeitam referência cruzada.
   - Índice GiST existe em `service_addresses.geometry` e `technician_locations.geometry`.
   - Soft delete: `deleted_at` pode ser setado sem remover a linha.
4. Atualizar `migration.integration.spec.ts` para incluir novas tabelas na lista de verificação.

### Validações, autorização, integridade
- `migrate:check` rejeita divergência entre journal e banco aplicado.
- Rollback deixa banco consistente (prefix check).

### Riscos e mitigações
- **Risco:** migration falha em ambiente onde 0000 já foi aplicada.  
  **Mitigação:** usar banco de teste isolado; migration 0001 deve ser incremental.
- **Risco:** testes de schema quebram se nomes de constraints forem gerados automaticamente.  
  **Mitigação:** usar `information_schema`/`pg_indexes` por nome de coluna/tabela, não por nome de constraint.

### Testes
- `npm run test:integration -w @crewops/db`
- `npm run db:migrate:check`
- `npm run db:rollback` + `npm run db:migrate` manualmente em dev.

### Critérios de conclusão e rastreabilidade
- Migrations aplicam schema final sem erro (`5.9`).
- Testes de schema passam.
- PostGIS habilitado.

---

## 5.10 Documentar o dicionario de dados e decisoes legado -> novo em `docs/DATABASE_MAP.md`

### Objetivo e comportamento esperado
`docs/DATABASE_MAP.md` mapeia cada tabela CrewOps para fontes PHP, campos, tipos, constraints, índices, enumerações e decisões de modelagem (preservar/redesenhar/adiar/descartar). Serve como fonte para implementadores dos grupos 6+ e para reconciliação de migração.

### Comportamento atual
Arquivo não existe; `docs/IMPLEMENTATION_PROGRESS.md:105` e `scripts/validate_docs.sh` já o referenciam como entrega futura do Grupo 5.

### Arquivos envolvidos
- Criar: `docs/DATABASE_MAP.md`

### Trabalho de documentação
1. Cabeçalho: escopo, change, data, status.
2. Seção "Mapeamento tabela a tabela":
   - `companies` → `tenants`
   - `branches` → não existe tabela equivalente direta; decisão novo
   - `users` → `users` + simplificação de RBAC
   - `technicians` → `users` perfil `technician` + `technician_profiles`; grade semanal adiada
   - `customers` → `clients`
   - `service_addresses` → `sites`; separação cliente/endereço
   - `tickets` → `tickets`
   - `work_orders` → `work_orders`; estados reduzidos conforme `STATE_MATRICES.md`
   - `dispatches` → lógica em `WorkOrderController::dispatch`
   - `work_order_events` → `work_order_timeline`, `work_order_dispatch_events`, `work_order_rework_events`; imutável + idempotência
   - `technician_locations` → `technician_profiles.last_latitude/longitude` (apenas última posição); agora pontos por evento
   - `evidences` → `work_order_evidences`; `note` vira evento
   - `sync_receipts` → inexistente no legado
   - `audit_logs` → inexistente formal; ações administrativas dispersas
3. Para cada tabela: colunas, tipos, constraints, indexes, enumerações, observações.
4. Seção "Decisões de modelagem":
   - IDs UUID; timestamps UTC `timestamptz`.
   - Soft delete via `deleted_at`.
   - Isolamento por `company_id`; FKs composite `(company_id, id)`.
   - PostGIS `geometry(Point,4326)`.
   - Eventos imutáveis; status atual é projeção.
   - Snapshot de endereço em `work_orders.address_snapshot`.
5. Seção "Pendências": D-109, escopo de email, timezone obrigatório, etc.

### Validações
- `scripts/validate_docs.sh` deve passar (exit 0).
- Links para `docs/STATE_MATRICES.md`, `docs/GLOSSARY.md`, `docs/REQUIRED_FIELDS.md`, `docs/EVIDENCE_POLICY.md`, `docs/OPERATIONAL_POLICIES.md`, `docs/API_CONTRACT.md`.

### Riscos e mitigações
- **Risco:** documentação ficar desatualizada após ajustes de schema.  
  **Mitigação:** atualizar `DATABASE_MAP.md` sempre que renomear/adicionar tabela durante o Grupo 5.

### Testes
- `./scripts/validate_docs.sh` passa sem falhas.

### Critérios de conclusão e rastreabilidade
- `docs/DATABASE_MAP.md` criado e validado (`5.10`).
- Dicionário cobre todas as tabelas do schema final e decisões legado → novo.

---

## Decisões ainda não resolvidas (explicitar ao implementer)

1. **Unicidade de `users.email`:** schema usará `(company_id, email)` até Produto ratificar escopo global vs empresa (D-109 / `REQUIRED_FIELDS.md` §3).
2. **Campos obrigatórios de `branches`:** `code` e `timezone` serão `not null`; endereço completo da filial será opcional até Operação decidir (`REQUIRED_FIELDS.md` §3).
3. **Disponibilidade do técnico:** `availability_status` default `available`; obrigatoriedade no cadastro adiada (`REQUIRED_FIELDS.md` §3).
4. **Unicidade de cliente por documento:** schema terá unique `(company_id, document)` permitindo nulos; decisão final de produto pendente.
5. **Snapshot de endereço:** armazenar em `work_orders.address_snapshot` (JSONB) preenchido na criação; não replica tabela histórica.
6. **Soft delete de evidências:** manter `deleted_at`; evidências confirmadas não são apagadas fisicamente.
7. **Escopo de `idempotency_key`:** `work_order_events` e `sync_receipts` usam `(company_id, device_id, idempotency_key)`; `evidences` usa `(company_id, idempotency_key)`.
8. **Sessão:** schema armazena `refresh_token_hash`; mecanismo de cookie/token implementado no Grupo 6.

---

## Sequência de implementação ordenada

1. **Preparar shared (5.1):**
   - Adicionar `zod` a `packages/shared`.
   - Reescrever `packages/shared/src/index.ts` com enums finais.
   - Criar `packages/shared/src/schemas.ts`.
   - Escrever/adicionar testes unitários.
   - Rodar `npm run typecheck -w @crewops/shared` e `npm run test:unit -w @crewops/shared`.

2. **Atualizar schema.ts (5.2–5.8):**
   - Renomear/adicionar tabelas e enums no arquivo único `packages/db/src/schema.ts`.
   - Adicionar `sessions`, `dispatches`, `sync_receipts`, `audit_logs`.
   - Renomear `customer_addresses` → `service_addresses`, `technician_location_events` → `technician_locations`, `work_order_evidences` → `evidences`.
   - Adicionar composite FKs e unique de idempotência.
   - Adicionar soft delete columns.

3. **Adaptar seed (dependência 5.2–5.4):**
   - Atualizar `packages/db/src/seed.ts` para novos nomes de tabela, novos enums e colunas obrigatórias (`branch.code`, `branch.timezone`, `technician.availability_status`).

4. **Gerar migrations (5.9):**
   - `npm run db:generate -w @crewops/db`
   - Revisar SQL gerado em `packages/db/drizzle/0001_...`.
   - Aplicar em banco de dev: `npm run db:migrate` e `npm run db:seed -- --reset`.

5. **Escrever testes de schema (5.9):**
   - Criar `packages/db/test/schema.integration.spec.ts`.
   - Atualizar `packages/db/test/migration.integration.spec.ts` para verificar novas tabelas.

6. **Rodar validações de banco (5.9):**
   - `npm run db:migrate:check`
   - `npm run db:rollback` → `npm run db:migrate` → `npm run db:migrate:check`
   - `npm run test:integration -w @crewops/db`

7. **Documentar (5.10):**
   - Criar `docs/DATABASE_MAP.md`.
   - Rodar `./scripts/validate_docs.sh`.

8. **Validação final do grupo:**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run db:migrate:check`
   - `./scripts/validate_docs.sh`

---

## Comandos de validação obrigatórios

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run db:migrate:check
npm run db:seed -- --reset
./scripts/validate_docs.sh
```
