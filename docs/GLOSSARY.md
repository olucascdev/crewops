# Glossário do CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.4
> Data de registro: **2026-09-01**
> Status: **PROPOSTO — aprovação PENDENTE** (registro datado em `docs/PILOT_RATIFICATIONS.md` R-011, data-alvo 2026-09-30, Gate Fase 0). Este glossário propõe uma definição única por termo. Número de sinônimos do legado foi levantado da stack PHP (controllers, models, migrations e views). Divergências com o legado estão explícitas. **Nenhuma aprovação foi concedida**; o documento **não** é autoritativo enquanto R-011 estiver PENDING.

## Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Registro pendente | [R-011](PILOT_RATIFICATIONS.md) — `docs/PILOT_RATIFICATIONS.md` |
| Aprovadores (papéis) | Produto + Operação + Arquitetura |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002/R-003) |
| Data-alvo (proposta) | 2026-09-30 (Gate Fase 0) |
| Impacto se não aprovado | Terminologia não autoritativa; specs podem divergir do significado do legado |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

> Regra: não usar este glossário como fonte autoritativa em spec/implementação enquanto R-011 estiver PENDING. O conteúdo abaixo é **proposta fundamentada** no código PHP legado.

## Como usar

- Cada termo tem **uma única definição aprovada**. Specs novos devem usar o termo do glossário.
- Sinônimos do legado são **referência**, não termos de uso em especificação nova.
- Coluna "Rótulo na interface" indica o texto a exibir para o usuário.

## Termos do MVP (obrigatórios)

### ticket

- **Definição curta:** problema ou solicitação reportada pelo cliente; a "porta de entrada" do atendimento. Não é a execução em campo.
- **Modelo de dados:** `tickets` (CrewOps). Status `open`, `in_progress`, `waiting`, `resolved`, `closed`, `cancelled`; prioridade `low`, `normal`, `high`, `critical`.
- **Sinônimos no FieldOps PHP:** `chamado`, `solicitação`, `ticket`.
- **Escopo no MVP:** entra. Pode gerar uma OS; também permite OS avulsa (sem ticket).
- **Relacionamentos:** `customer`, `service_address`, `work_order` (opcional), `technician` (quando atribuído a um atendente).
- **Exemplo operacional:** Cliente liga "sem internet em casa"; atendente abre um `ticket` `high`; despachante gera uma OS vinculada.
- **Rótulo na interface:** "Chamado".

### work_order

- **Definição curta:** unidade de execução em campo; carrega o estado atual e representa o serviço que o técnico realiza.
- **Modelo de dados:** `work_orders` (CrewOps) — entidade de estado atual; histórico fica em `work_order_events`. Status `pending`, `scheduled`, `dispatched`, `in_progress`, `waiting_evidence`, `in_validation`, `waiting_parts`, `completed`, `cancelled`, `rework`. Tipos `corrective`, `preventive`, `installation`, `survey`.
- **Sinônimos no FieldOps PHP:** `ordem de serviço`, `OS`, `atendimento`.
- **Escopo no MVP:** entra — é o núcleo do piloto.
- **Relacionamentos:** `ticket` (opcional), `customer`, `service_address`, `technician` (via `dispatch`), `work_order_event`, `evidence`, `technician_location`.
- **Exemplo operacional:** uma OS `dispatch`ada para Técnico A com prioridade `high`, `scheduled_at` definido; técnico executa e muda o status.
- **Rótulo na interface:** "Ordem de serviço" (abreviável para "OS" em lugares densos).

### dispatch

- **Definição curta:** atribuição ou agendamento de um técnico a uma OS (ou reagendamento/desatribuição/reatribuição). **Não inclui roteirização nem cálculo de rota.**
- **Modelo de dados:** `dispatches` (CrewOps) + eventos de despacho auditáveis (`work_order_dispatch_events` no legado). Campos: técnico, OS, autor, horário, justificativa, `scheduled_at`.
- **Sinônimos no FieldOps PHP:** `dispatch`, `atribuição`, `agendamento`, `reassign/reatribuição`.
- **Escopo no MVP:** entra como evento auditável; roteirização fica fora.
- **Relacionamentos:** `work_order`, `technician`.
- **Exemplo operacional:** despachante troca o técnico de uma OS; o sistema registra técnico anterior → novo, autor, horário e justificativa.
- **Rótulo na interface:** "Despacho".

### event / work_order_event

- **Definição curta:** registro imutável de um acontecimento operacional da execução; é a verdade auditável da OS (timeline, prova, mapa, debugging).
- **Modelo de dados:** `work_order_events` (CrewOps) — `event_type`, `payload`, `actor_user_id`, `occurred_at`, `received_at`, `created_offline`, `device_id`, `idempotency_key`, `lat/lng/accuracy` opcionais.
- **Sinônimos no FieldOps PHP:** `work_order_timeline` (ex.: `dispatch_update`, `mobile_checkin`, `mobile_checkout`, `mobile_checklist`, `mobile_evidence_note`, `mobile_signature`, `mobile_upload`), `work_order_dispatch_events`, `work_order_rework_events`.
- **Escopo no MVP:** entra — coluna vertebral da auditoria e do offline.
- **Relacionamentos:** `work_order`, `technician`, `evidence`, `technician_location`.
- **Exemplo operacional:** técnico faz check-in → cria `work_order_event` (`technician_checked_in`) com GPS e atualiza o status da OS na mesma transação.
- **Rótulo na interface:** "Evento" / "Linha do tempo".

### evidence

- **Definição curta:** prova coletada na execução — foto, assinatura ou anexo — com metadados, estado de upload e referência ao objeto em armazenamento.
- **Modelo de dados:** `evidences` (CrewOps) — `evidence_type`, `file_name`, `file_mime`, `file_size`, `signer_name`, `signer_role`, estado de upload (`pending_upload`, `uploaded`, `failed`), referência ao bucket/objeto.
- **Sinônimos no FieldOps PHP:** `work_order_evidences` (`evidence_type`: `attachment`, `signature`, `note`); mobile usa base64 offline; anexo/file.
- **Escopo no MVP:** entra; upload direto a S3/R2 com URL pré-assinada (fornecedor pendente — ver `DECISION_LOG.md`).
- **Relacionamentos:** `work_order`, `event`, `technician`.
- **Exemplo operacional:** técnico anexa foto da instalação → compressão → `pending_upload` → upload direto → `uploaded`; pasta local usada pelo legado é substituída por objeto em storage.
- **Rótulo na interface:** "Evidência" / "Foto" / "Assinatura".

### technician_location

- **Definição curta:** ponto de localização capturado em um evento operacional (check-in, mudança de status, evidência, assinatura, ping manual) ou em captura periódica em primeiro plano. Não é rastreamento contínuo.
- **Modelo de dados:** `technician_locations` (CrewOps) — `technician_id`, `work_order_id` (opcional), `lat`, `lng`, `accuracy`, `source`, `captured_at`, `received_at`.
- **Sinônimos no FieldOps PHP:** **ultima posição conhecida** em `technician_profiles.last_latitude`, `last_longitude`, `last_location_at`, `last_location_accuracy`, `last_location_source` (só a última, via `pingLocation`); o legado não tem tabela de pontos/stream.
- **Escopo no MVP:** entra como pontos por evento + última posição conhecida. Rastreamento contínuo fica fora (requer app nativo — ver `GPS_POLICY.md`).
- **Relacionamentos:** `technician`, `work_order` (opcional), `event`.
- **Exemplo operacional:** técnico faz ping manual / conclui serviço → ponto gravado com origem `pwa_ping` ou `checkout_gps`, precisão e horário; painel exibe recência.
- **Rótulo na interface:** "Última posição há X minutos".

### customer

- **Definição curta:** entidade de negócio do cliente (identidade e dados cadastrais), independente dos endereços de atendimento.
- **Modelo de dados:** `customers` (CrewOps) — `name`, `document` (CNPJ/CPF), contato, status.
- **Sinônimos no FieldOps PHP:** `clients`, `cliente`.
- **Escopo no MVP:** entra com cadastro mínimo; sem modelo tributário/financeiro.
- **Relacionamentos:** `service_address` (1:N), `ticket`, `work_order`.
- **Exemplo operacional:** um cliente pode ter vários locais de atendimento (matriz, filial, casa).
- **Rótulo na interface:** "Cliente".

### service_address

- **Definição curta:** local físico onde o serviço é prestado, com endereço e coordenada geográfica (georreferenciável).
- **Modelo de dados:** `service_addresses` (CrewOps) — endereço, cidade, UF, CEP, `geometry` PostGIS, contato opcional.
- **Sinônimos no FieldOps PHP:** `sites`, `site`, `endereço de atendimento`, "Matriz/Filial" usado como nome de site.
- **Escopo no MVP:** entra; separado do cadastro do cliente.
- **Relacionamentos:** `customer` (N:1), `work_order`, `ticket`, `technician_location` (quando o ponto se relaciona ao local).
- **Exemplo operacional:** OS é criada para o "site Matriz São Paulo" do cliente X; o mapa usa a coordenada deste endereço.
- **Rótulo na interface:** "Endereço de atendimento".

## Termos adicionais

### company
- **Definição:** organização piloto (provedor). **Legado:** `tenants` (multi-tenant). **CrewOps:** `companies` (1 no piloto). **Escopo:** entra como contexto de isolamento.

### branch
- **Definição:** filial/unidade organizacional do provedor, com fuso e contexto. **Legado:** não há tabela `branches`; o legado representa "filial" ora via `sites` (nome) ora no `tenant`. **CrewOps:** `branches`. **Escopo:** entra.

### technician
- **Definição:** profissional de campo, vinculado a um usuário e a uma filial, com disponibilidade. **Legado:** `users` (perfil `technician`) + `technician_profiles`. **CrewOps:** `technicians`. **Escopo:** entra.

### sync_receipt
- **Definição:** registro de idempotência/resultado de processamento de um evento sincronizado. **Legado:** inexistente — o `syncActions` reaplica ações sem idempotência (risco de duplicação). **CrewOps:** `sync_receipts`. **Escopo:** entra como base do protocolo idempotente.

### outbox
- **Definição:** fila local (IndexedDB/Dexie) de eventos/ações pendentes de envio no PWA. **Legado:** fila offline mobile via base64 + `syncActions`. **CrewOps:** armazenamento local `outboxEvents` + `pendingEvidence`. **Escopo:** entra (núcleo local-first).

### retrabalho / rework
- **Definição:** reabertura de uma OS já executada para correção. **Legado:** `work_orders.rework_flag` + `work_order_rework_events` (`event_type`: `requested|returned|contestation|resolved|reopened`); motivos/causas/origem são listas fixas. **CrewOps:** estado `rework` + política de reatribuição/cancelamento/reabertura (tarefa 3.5). **Escopo:** entra como estado e evento (2.5/2.10).

### grade semanal / disponibilidade do técnico
- **Definição:** grade recorrente de disponibilidade por dia da semana. **Legado:** `technician_availability_slots` (`weekday`, `start_time`, `end_time`, `slot_type`). Também há disponibilidade **atual** em `technician_profiles.availability_status` (`available`/`busy`/`off`). **CrewOps:** modelar disponibilidade atual; grade semanal **adiada** até decisão de produto (R-014/R-015). **Escopo:** atual entra; grade é adiada.

## Divergências explícitas legado → CrewOps

- **`dispatch` no CrewOps é apenas atribuição/agendamento**, não inclui roteirização (no legado o termo aparece associado a mapa/rota).
- **`sites` do legado é um endereço de atendimento**, mas o nome de sites ("Matriz", "Filial") costuma misturar unidade organizacional com local físico. No CrewOps, `branch` (organizacional) e `service_address` (local do cliente) são entidades distintas.
- **`work_order_timeline` do legado vira `work_order_events`** (imutável, com idempotência e origem offline).
- **Posição do técnico:** legado guarda apenas a **última** posição (`technician_profiles.last_*`); CrewOps guarda **pontos por evento** em `technician_locations`.
- **Evidência `note`:** no legado, notas e check-in são gravados como `work_order_evidences` (`evidence_type='note'`); no CrewOps a nota vira `work_order_event` (`note_added`), separada da evidência de arquivo.

## Termos proibidos em spec nova (ambiguidade)

- `atendimento` (usar `work_order` ou `ticket` conforme contexto).
- `site` (usar `service_address`).
- `chamado` (usar `ticket`).
- `OS` (usar `work_order`; "OS" só em contexto de interface).

## Documentos vinculados

- `openspec/project.md` — conceitos separados.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — modelo de dados e decisões.
- `docs/ARCHITECTURE.md` — limites de PWA e GPS.
- `docs/LEGACY_REFERENCE_MAP.md` — onde extrair regras do legado.
