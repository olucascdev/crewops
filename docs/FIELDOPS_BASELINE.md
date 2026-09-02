# Baseline do FieldOps (legado PHP/MySQL)

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.5
> Data de registro: **2026-09-01**
> Status: **PENDENTE de medição**. Este documento é a linha de base do sistema legado para comparar o CrewOps. **Evidência de código/seed** (seções 1.1, 3, 4, 5, 6) é real e citada no repo. **Números de produção** **não estão disponíveis no workspace** — `fieldops.sql` é apenas seed/demo. Os valores de produção estão marcados **PENDING** e cada um tem dono, prazo e impacto registrados em `docs/PILOT_RATIFICATIONS.md` (R-020 a R-026) como **compromisso de medição datado**.

## 1. Volumes

### 1.1 Evidência de dados no repositório (SEED/DEMO — não é produção)

O dump `fieldops.sql` (repo) contém apenas um dataset **demo/seed**, e serve para confirmar o modelo de dados, não o volume de produção:

| Entidade | Rows no seed | Comentário |
| --- | --- | --- |
| `tenants` | 1 | "FieldOps Demo" (plan `trial`, status `active`) |
| `users` | 2 | admin + técnico demo (fictícios) |
| `technician_profiles` | 1 | "Técnico Demo", base São Paulo |
| `clients` | 2 | clientes demo |
| `sites` | 3 | "Matriz São Paulo", "Filial Campinas", "Matriz Rio" |
| `work_orders` | 1 | "Visita técnica mobile demo", status `completed` |
| `work_order_timeline` | 1 | `dispatch_update` |
| `tickets` / `work_order_evidences` / `dispatch_events` / `rework_events` | 0 | não populados no seed |

**Conclusão:** o seed demo tem escala mínima (1 OS). Não representa volume de produção.

### 1.2 Volume de produção — PENDING (compromisso datado de medição)

> **Nenhum valor abaixo foi medido.** Consultar o banco de produção (somente leitura) de `fieldops.sql`/`fieldops` é responsabilidade de **Dados**, com confirmação de significado por **Operação**. A coluna "Medida em" é preenchida quando a medição real acontecer. Cada linha corresponde a um R-ID.

| Métrica | Valor | Fonte | Medida em (a preencher) | Dono da medição | Prazo | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Total de OS (3 meses) | `<X>` | Query em `work_orders` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-020](PILOT_RATIFICATIONS.md) |
| Total de OS (6 meses) | `<X>` | Query em `work_orders` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-020](PILOT_RATIFICATIONS.md) |
| Total de OS (12 meses) | `<X>` | Query em `work_orders` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-020](PILOT_RATIFICATIONS.md) |
| OS por status | `<distribuição>` | `WorkOrder::kpis()` / `queueSummary()` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-020](PILOT_RATIFICATIONS.md) |
| OS por filial / técnico | `<X>` | `work_orders` + `technician_profiles` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-021](PILOT_RATIFICATIONS.md) |
| Tickets e conversão para OS | `<X>` / `<%>` | `tickets` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-022](PILOT_RATIFICATIONS.md) |
| Evidências (fotos, assinaturas, notas) | `<X>` | `work_order_evidences` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-023](PILOT_RATIFICATIONS.md) |
| Técnicos ativos | `<X>` | `technician_profiles` | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-024](PILOT_RATIFICATIONS.md) |
| Usuários ativos por perfil | `<X>` | `users` + perfil | — | Dados (+ Operação) | Gate Fase 0 — 2026-09-30 | PENDING [R-025](PILOT_RATIFICATIONS.md) |

## 2. Tempos

> **PENDING (R-026).** Não há como medir tempos de ciclo apenas com código estático; exigem observação (logs/banco) ou confirmação da Operação. Os itens abaixo são **compromisso de medição datado**, com método de referência extraído do código.

| Métrica | Método de medição (referência de código) | Dono | Prazo | Status |
| --- | --- | --- | --- | --- |
| Criação → atribuição | Diferença `work_orders.created_at` → primeiro `work_order_dispatch_events` | Dados + Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-026](PILOT_RATIFICATIONS.md) |
| Atribuição → início | `started_at` (check-in) − evento de despacho | Dados + Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-026](PILOT_RATIFICATIONS.md) |
| Execução (início → fim) | `completed_at` − `started_at` | Dados + Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-026](PILOT_RATIFICATIONS.md) |
| Tempo até 1ª sync no app | `syncMeta()` (marca `updated_at`/`created_at`) | Dados + Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-026](PILOT_RATIFICATIONS.md) |

## 3. Erros / bugs conhecidos (evidência de código)

| Problema | Evidência de código | Impacto |
| --- | --- | --- |
| **Sync sem idempotência (risco de duplicação)** | `App/HomeController::syncActions()` reaplica ações via `WorkOrder::applyTechnicianAction()` sem `idempotency_key`; retry pode duplicar evento | Evento duplicado, timeline inconsistente |
| **Upload offline por base64** | `WorkOrderEvidence::createFromBase64()` — dados em base64 no POST; arquivo salvo em disco local | Alto consumo de payload/memória; sem URL pré-assinada |
| **Limite/restrição de upload** | `createAttachment()`: máx. **10MB**; extensões `jpg/jpeg/png/pdf/webp`; senão `RuntimeException` | Rejeição de fotos de campo grandes |
| **GPS obrigatório em check-in/check-out** | `applyTechnicianAction()`: `checkin`/`checkout` retornam erro se `lat/lng` vazio | Ação bloqueada sem coordenada |
| **Mapa baseado em `sites.lat/lng`, não na posição do técnico** | `WorkOrder::mapPoints()` usa `s.lat, s.lng` do site; `LIMIT 500` | Ponto do técnico não "ao vivo"; mapa limitado a 500 pontos |
| **Só última posição do técnico** | `technician_profiles.last_latitude/longitude/location_at/accuracy/source` (migration 040) | Não há stream/histórico de posição |
| **Timeline não imutável nem idempotente** | `work_order_timeline` é tabela de linhas com `action`; sem chave de idempotência | Correção/retry geram registros duplicados |

## 4. Telas mais usadas (inventário de views)

**Painel admin** (`resources/views/admin`):

- `dashboard` — sala de operação/indicadores (`DashboardController`).
- `work_orders/index.php` — lista de OS; `board.php` — quadro; `agenda.php` — agenda; `form.php` — criar; `show.php` — detalhe.
- `tickets/index.php`, `form.php`, `show.php` — chamados.
- `map/index.php` — MapOps (filtros, resumo, pontos; `kiosk` para tela externa).
- `bi/*` — BI Ops Lite (`BiOpsController`).
- `technicians/*`, `clients/*`, `sites/*` — cadastros.
- `users/*`, `roles/*` — identidade/RBAC.

**App técnico** (`resources/views/app`):

- `work_orders/index.php` — lista de atividades; `show.php` — detalhe/execução.
- `sync/index.php` — Sincronização (`cards` + `syncMeta`).
- `tickets/*` — chamados (quando aplicável ao técnico).
- `home/*`, `profile/*`, `support/*`, `notifications/*`.

**Frequência real:** **PENDING** — requer confirmação por observação de **Operação** (junto com R-026, que cobre tempos de uso por tela quando observado). A lista acima é apenas o **inventário de telas existentes**, derivado de código, não de uso real.

## 5. Indicadores operacionais atuais (métricas definidas no código)

Definições extraídas de `WorkOrder::kpis()`, `queueSummary()`, `operationalSnapshot()`, `mobileCards()`, `mapSummary()`:

| Indicador | Definição no código |
| --- | --- |
| OS abertas (`open_total`) | `status NOT IN ('completed','cancelled')` |
| OS em execução (`in_progress`) | `status = 'in_progress'` |
| OS concluídas hoje | `status='completed' AND DATE(completed_at)=CURDATE()` |
| OS atrasadas (`overdue`) | `status NOT IN ('completed','cancelled') AND due_at < NOW()` |
| OS em retrabalho (`rework total`) | `rework_flag = 1 OR status = 'rework'` |
| OS não atribuídas (`unassigned`) | `technician_id IS NULL AND status NOT IN ('completed','cancelled')` |
| OS aguardando execução | `status IN ('pending','scheduled','dispatched')` |
| OS devolvidas/redistribuídas hoje | contagem de `work_order_dispatch_events` (`reassigned`) e `work_order_rework_events` |
| Técnicos em campo / parados | requer observação de `technician_profiles` + `last_location_at` |

> Os valores atuais desses indicadores em produção **não são medidos aqui** (dependem do R-020/R-021). A coluna "Definição no código" é extração real da regra, não número.

## 6. Limitações técnicas do legado

- Regras de negócio acopladas em controllers/views/models (SQL embutido em PHP).
- Sem offline real first-class: sync depende de payload incremental por `updated_at` marker (`buildTechnicianSyncPayload` / `syncMeta`) e fila base64 no `syncActions`.
- Evidências armazenadas em **sistema de arquivos local** (`public/uploads/work_orders/{tenant}/{wo}/`), não em storage de objeto.
- Mapa usa coordenadas de **site** e **última posição** do técnico; sem PostGIS (o legado não usa `geometry`).
- Sem idempotência ponta a ponta; risco de duplicação de evento.
- Sem histórico imutável de eventos (timeline é tabela de linhas editável).
- Versão do legado: `0.8.8` / `0.8.8-r1` (migrations 039/040) — preparado para `0.9.0 HML Candidate`.

## Regras de completude do baseline

- **Evidência real (código/seed):** seções 1.1, 3, 5 e 6 — podem ser citadas como fato (estão no repo).
- **Medição de produção:** seções 1.2 e 2 — **só** podem ser citadas como fato após a medição real, com **data de consulta/observação**, **query/source** e **laudo** da pessoa/papel dono registrados em `docs/PILOT_RATIFICATIONS.md` (R-020 a R-026).
- **Leitura somente:** a medição usa leitura somente do banco FieldOps de produção (nunca escrita no legado).

## Documentos vinculados

- `docs/LEGACY_REFERENCE_MAP.md` — onde localizar cada regra.
- `docs/PILOT_RATIFICATIONS.md` — compromissos de medição (R-020 a R-026).
- `docs/ACCEPTANCE_PLAN.md` — baseline como mínimo aceitável (Fase 0).
- `docs/DECISION_LOG.md` — pendências de dados/volume (D-103, D-104).
- `database/migrations/007_create_tickets_work_orders.sql`, `010_execution_evidence_v023.sql`, `011_mobile_sync_compat_v032c.sql`, `039_mapops_bi_whitelabel_v088.sql`, `040_mapops_live_technician_position_v088r1.sql`.
