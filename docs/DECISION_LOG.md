# Registro de Decisões e Pendências — CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.7
> Data de registro: **2026-09-01**
> Status dos itens: `APPROVED` (decidido e registrado), `REGISTERED` (registrado em design, sem aprovação formal ainda) ou `PENDING` (pendente — com dono e prazo). **Nenhum item** marcado `APPROVED` ou `REGISTERED` aqui foi validado por assinatura de pessoa real; `APPROVED` significa "decisão registrada", requerendo confirmação dos donos no gate. As pendências (D-101 a D-104) têm dono, prazo e impacto e estão correlacionadas a `docs/PILOT_RATIFICATIONS.md`.

## Modelo de registro

Cada item usa: **ID**, **Data de registro**, **Título**, **Contexto**, **Opções**, **Decisão/Estado**, **Dono**, **Prazo**, **Impacto de não decidir**, **Relação**.

## Decisões já registradas

> Datas de registro: **2026-09-01** (data em que foram registradas neste log; referem-se a decisões descritas em `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md`).

| ID | Data | Título | Decisão | Estado | Dono | Relação |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 2026-09-01 | PWA local-first | Ação nasce local (outbox Dexie) e sincroniza depois | REGISTERED (design.md Decisão 6) | Produto + Arquitetura | `offline-sync` |
| D-002 | 2026-09-01 | Eventos como verdade operacional | `work_order_events` imutáveis; `work_orders.status` é projeção | REGISTERED (design.md Decisão 4) | Arquitetura + Operação | `field-operations` |
| D-003 | 2026-09-01 | GPS por evento, sem rastreamento contínuo | Localização em eventos + última posição; sem background tracking no PWA | REGISTERED (design.md Decisão 9) | Produto | `field-operations`, `GPS_POLICY.md` |
| D-004 | 2026-09-01 | Evidência via upload direto | URL pré-assinada + confirmação em 2 etapas; armazenamento neutro | REGISTERED (design.md Decisão 8) | Arquitetura | `evidence-uploads` |
| D-005 | 2026-09-01 | Reconstrução por fatias | Fatia vertical com gate de conhecimento, não conversão PHP→TS | REGISTERED (design.md Decisão 1) | Arquitetura | `legacy-modernization` |

## Pendências (PENDING) — iniciais do grupo

> Cada pendência tem **dono**, **prazo** (âncora de fase + data-alvo proposta) e **impacto**. Data-alvo é proposta de planejamento, não compromisso de pessoa.

### D-101 — S3 vs R2 (armazenamento de evidências)

- **Data de registro:** 2026-09-01
- **Contexto:** o contrato de armazenamento deve ser neutro; a escolha depende do ambiente alvo do deploy.
- **Opções:** (a) Amazon S3; (b) Cloudflare R2; (c) outro armazenamento compatível S3.
- **Estado:** **PENDING** — apenas critérios e dono registrados.
- **Critérios de escolha:** custo; egress; residência de dados; operação/observabilidade do ambiente alvo; compatibilidade com SDK de URL pré-assinada.
- **Dono:** Arquitetura (+ Dados para residência/custo).
- **Prazo:** antes da fatia de evidências — **Gate da Fase 4**, data-alvo proposta **2026-10-31**. Correlação: R-018 / R-023 (`PILOT_RATIFICATIONS.md`).
- **Impacto de não decidir:** bloqueia a implementação do upload de evidência.
- **Relação:** `evidence-uploads`, design.md Decisão 8.

### D-102 — Provedor de mapa/geocodificação

- **Data de registro:** 2026-09-01
- **Contexto:** o modelo PostGIS é independente; o provedor de tiles/geocodificação precisa ser definido antes da fatia do mapa.
- **Opções:** provedor de mapa (ex.: Mapbox, Google Maps, Leaflet + tiles) sem alterar o modelo de dados.
- **Estado:** **PENDING**.
- **Critérios:** custo por requisição; cobertura na região do piloto; geocodificação de endereços; termos de uso/privacidade.
- **Dono:** Produto + Arquitetura.
- **Prazo:** antes da fatia do mapa — **Gate da Fase 5**, data-alvo proposta **2026-11-30**. Correlação: R-013.
- **Impacto de não decidir:** bloqueia sala de operação/mapa.
- **Relação:** `operations-dashboard`, design.md Open Questions.

### D-103 — Thresholds de recência (sync e localização)

- **Data de registro:** 2026-09-01
- **Contexto:** valores para classificar sync/localização como recente, atenção ou desatualizado dependem da operação.
- **Opções:** faixas de minutos (ex.: recente < X; atenção X–Y; desatualizado ≥ Y) para **última sincronização** e **última localização**.
- **Estado:** **PENDING** — provisório/placeholder em `GPS_POLICY.md` (R-034).
- **Dono:** Operação (+ Produto para o texto de UI).
- **Prazo:** antes da **Fase 5** (sala de operação), data-alvo proposta **2026-11-30**. Correlação: R-034.
- **Impacto de não decidir:** alertas de "técnico sem sync" e "posição desatualizada" sem definição operacional.
- **Relação:** `operations-dashboard`, `GPS_POLICY.md`, field-operations.

### D-104 — Recorte histórico da migração

- **Data de registro:** 2026-09-01
- **Contexto:** quanto de dados legados migrar na primeira carga. Não deve ser cópia total automática.
- **Opções:** (a) período definido por utilidade operacional; (b) ativos em aberto + recentes; (c) por qualidade dos dados.
- **Estado:** **PENDING**.
- **Critérios:** utilidade operacional; qualidade/deduplicação dos dados; janela de corte; custo e tempo de reconciliação.
- **Dono:** Dados (+ Operação para utilidade).
- **Prazo:** antes da **Fase 6** (migração e piloto), data-alvo proposta **2026-12-31**. Correlação: R-020 / R-021.
- **Impacto de não decidir:** migração sem escopo ou carga inválida contamina o modelo novo.
- **Relação:** `data-migration-cutover`, design.md Open Questions.

### D-105 — Nomeação dos papéis de governança (insumo para os gates)

- **Data de registro:** 2026-09-01
- **Contexto:** todas as decisões acima têm dono **por função**, mas a **pessoa imputável** (nome, contato, delegado) não existe no workspace.
- **Estado:** **PENDING** — correlacionado a R-001 a R-005.
- **Dono:** as nomeações são responsabilidade das lideranças de Produto, Operação, Arquitetura, Dados e Corte (conforme `PILOT_GOVERNANCE.md`).
- **Prazo:** **Gate da Fase 0**, data-alvo proposta **2026-09-30**.
- **Impacto de não decidir:** decisão de gate e escalonamento sem destinatário imputável; nenhuma aprovação formal é possível.
- **Relação:** `docs/PILOT_GOVERNANCE.md`, `docs/PILOT_RATIFICATIONS.md`.

## Registros do Grupo 2 (classificação 2.11 / matriz 2.12)

> Itens gerados pela classificação dos comportamentos do legado (`docs/CLASSIFICATION.md`). Estão **REGISTERED** — registrados como decisão de design derivada da classificação e da matriz (`docs/TRACEABILITY_MATRIX.md`), **requerendo confirmação** dos donos no gate (R-001/R-002/R-003). Nenhum é aprovação assinada.

| ID | Data | Título | Classificação | Decisão registrada | Estado | Dono | Relação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D-106 | 2026-09-01 | Nota de execução separada de evidência | redesenhar (2.7/2.6) | Nota/evento operacional vira `work_order_event`; evidência restringe-se a arquivo/assinatura | REGISTERED | Arquitetura + Operação | `field-operations`, `evidence-uploads` (tarefa 13.3) |
| D-107 | 2026-09-01 | Assinatura: desenho vs nome simples no MVP | redesenhar (2.6) | Cliente captura desenho mas servidor grava só nome — divergência; decidir se MVP suporta desenho ou só nome | REGISTERED | Produto | `evidence-uploads` (tarefas 13.2/13.3) |
| D-108 | 2026-09-01 | Definição de "técnico parado" | redesenhar (2.10) | Legado não tem indicador único; CrewOps define por `last_sync` reportado + disponibilidade | REGISTERED | Operação | `operations-dashboard` (tarefas 3.8/15.2; R-034) |
| D-109 | 2026-09-01 | Unicidade por documento de cliente | redesenhar (2.3) | Legado não impede duplicata; decidir política de unicidade/deduplicação | REGISTERED | Produto | `customer-service-addresses` (tarefa 7.6) |
| D-110 | 2026-09-01 | Storage de evidências em disco local | redesenhar (2.7) | Substituir `public/uploads/...` por object storage com URL pré-assinada | REGISTERED | Arquitetura | `evidence-uploads` (D-101, tarefas 13.4/13.5) |
| D-111 | 2026-09-01 | Segurança de upload de evidência | redesenhar (2.7) | Validação server-side de tamanho/contagem + MIME por content sniffing (magic bytes) + permissões seguras (sem `mkdir 0777`) + storage privado/entrega via URL pré-assinada + autorização por tenant/work-order e delivery não-público; **não preservar** MIME de cliente/pasta pública | REGISTERED | Arquitetura + Segurança | `evidence-uploads` (D-101/D-110, tarefas 13.1/13.3/13.4/13.5) |

> **Não confundir D-101 a D-104 (pendências de fornecedor/valor) com D-106 a D-111 (decisões derivadas da classificação).** Os primeiros dependem de escolha externa/medição; os últimos são desdobramentos do inventário que ainda precisam de confirmação.

## Registros do Grupo 3 (fechamento das regras do MVP — 3.1 a 3.10)

> Itens propostos pelo fechamento das regras do MVP (`docs/WORK_ORDER_FLOW.md`, `docs/STATE_MATRICES.md`, `docs/EVIDENCE_POLICY.md`, `docs/OPERATIONAL_POLICIES.md`, `docs/PERMISSIONS_MATRIX.md`, `docs/REQUIRED_FIELDS.md`, `docs/OPERATIONAL_THRESHOLDS.md`, `docs/API_CONTRACT.md`, `docs/FUNCTIONAL_GATE.md`). Estão **REGISTERED** (proposta registrada, sem aprovação formal) ou **PENDING** (onde há valor/medição pendente). **Nenhum item é aprovação assinada**; a confirmação depende de R-001/R-002/R-003 (D-105).

| ID | Data | Título | Decisão registrada | Estado | Dono | Relação |
| --- | --- | --- | --- | --- | --- | --- |
| D-112 | 2026-09-01 | Matriz de transições de ticket (3.2) | Transições propostas com autor+motivo; o legado permite "qualquer para qualquer"; MVP reduz ao conjunto controlado | REGISTERED | Produto + Operação | `ticketing-dispatch` (tarefas 3.2/8.1) |
| D-113 | 2026-09-01 | Matriz de transições de OS (3.3) | Transições propostas; criação `scheduled`/`pending`; auto-despacho `pending/scheduled → dispatched`; check-in → `in_progress`; check-out → `completed`; rework via `open_rework` | REGISTERED | Produto + Operação | `field-operations` (tarefas 3.3/8.3) |
| D-114 | 2026-09-01 | Política de evidências obrigatórias por tipo de OS (3.4) | Foto/assinatura/GPS por tipo; config por OS sobrepõe; validação administrativa em `waiting_evidence`/`in_validation`; estados `pending_upload`/`uploaded`/`failed` | REGISTERED | Produto + Operação | `evidence-uploads` (D-107; tarefas 3.4/13.7) |
| D-115 | 2026-09-01 | Políticas operacionais (3.5) | Reatribuição registra `technician_reassigned`; cancelamento pós-`completed` só via rework; OS `completed` não reabre; rework preserva eventos; offline classifica `conflict`/`rejected` | REGISTERED | Produto + Operação | `field-operations`/`offline-sync` (tarefas 3.5/8.8/11.6) |
| D-116 | 2026-09-01 | Matriz de permissões dos 5 perfis (3.6) | Matriz simples recurso×ação substitui RBAC granular do legado | REGISTERED | Produto + Operação | `identity-access` (R-014; tarefa 3.6) |
| D-117 | 2026-09-01 | Campos obrigatórios e validações (3.7) | Campos mínimos por entidade; unicidade por empresa/ano; timestamps UTC; soft delete | REGISTERED | Produto + Operação | `organization-branches`/`customer-service-addresses` (D-109; tarefa 3.7) |
| D-118 | 2026-09-01 | Thresholds operacionais (3.8) | `overdue` observado; "técnico parado"/"sync antigo"/recência propostos com valores `<X>`/`<Y>` (R-034/D-103) | PENDING | Operação (+ Produto para UI) | `operations-dashboard` (D-103/R-034; tarefas 3.8/15.2) |
| D-119 | 2026-09-01 | Contrato da API v1 (3.9) | Base `/api/v1`; versionamento por major; paginação; datas UTC; erros estáveis; idempotência; WebSocket de invalidação | REGISTERED | Arquitetura + Operação | `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §2/§7/§8/§10 (tarefa 3.9) |
| D-120 | 2026-09-01 | Gate funcional do MVP (3.10) | Nenhuma fatia inicia sem regra essencial decidida; checklist e mapeamento de dependências grupos 4–17 | REGISTERED | Produto + Operação + Arquitetura | `legacy-modernization` (tarefa 3.10) |

## Regras do registro

- Toda pendência tem **dono e prazo**. Sem isso, não é registrada como pendência válida.
- Decisão aprovada é marcada como **APPROVED**; troca requer nova entrada/justificativa.
- Nenhum `APPROVED`/`REGISTERED` aqui é aprovação assinada por pessoa real; trata-se de decisão registrada em design, confirmada no gate por quem for nomeado (D-105).
- Nenhuma fatia inicia sem a decisão essencial correspondente registrada (gate funcional do `legacy-modernization`; regras formais em `docs/BUSINESS_RULES.md`, a produzir no Grupo 2).
- Revisão semanal das pendências; atualizar estado quando a decisão for tomada.

## Documentos vinculados

- `docs/PILOT_GOVERNANCE.md` — donos dos temas e nomeações (R-001 a R-005).
- `docs/PILOT_RATIFICATIONS.md` — pendências de nomeação/medição/valores (R-011 a R-034).
- `docs/ACCEPTANCE_PLAN.md` — fases e gates.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — Open Questions (D-101 a D-104).
