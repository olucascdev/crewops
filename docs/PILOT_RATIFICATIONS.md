# Registro de Ratificações e Medições Pendentes — CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Grupo 1
> Data de registro: **2026-09-01**
> Status: **PENDENTE**. Aqui ficam todas as nomeações, aprovações e medições que exigem uma **pessoa real** ou **dado real** que **não existem no workspace**. Nenhum item abaixo foi aprovado nem medido. Nenhum nome, contato, assinatura ou número de produção aqui é real.

## Como usar

- Todo placeholder de documento de governança (nome de papel, contato, valor numérico de escopo/baseline, threshold numérico) aponta para um **R-ID** deste registro.
- Cada R-ID carrega: **dono** (papel de `docs/PILOT_GOVERNANCE.md`), **prazo** (âncora de gate de `docs/ACCEPTANCE_PLAN.md` + data-alvo PROPOSTA), **impacto de não cumprir**, **status**.
- **Datas-proposta abaixo são estimativas** para dar rastreabilidade; podem ser recalibradas pelos donos dos papéis. **Não são compromissos reais**.
- Nenhuma fatia/fase avança com um R-ID essencial **PENDING** e sem dono/prazo (regra da Fase 0 e do gate funcional do grupo 3).
- Quando o dono resolver (nomear, medir, aprovar), o R-ID passa a **RESOLVED** com data, valor/laudo e referência ao documento de decisão (`docs/DECISION_LOG.md`).

## Grupo A — Nomeações, contatos e delegados da governança

Âncora de prazo comum: **Gate da Fase 0** (`docs/ACCEPTANCE_PLAN.md` — "100% dos papéis de governança nomeados"). Impacto comum: decisão de gate/escalonamento **sem pessoa imputável**; nenhuma fase pode avançar sem dono.

| ID | Item (papel a nomear) | Dono | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Nomear responsável, contato e delegado de **Produto** | Liderança de Produto (papel `Produto`) | Gate Fase 0 | 2026-09-30 | Escopo, priorização e critérios de sucesso sem imputado | PENDING |
| R-002 | Nomear responsável, contato e delegado de **Operação** | Liderança de Operação (papel `Operação`) | Gate Fase 0 | 2026-09-30 | Recorte operacional, thresholds e fluxos reais sem imputado | PENDING |
| R-003 | Nomear responsável, contato e delegado de **Arquitetura** | Liderança Técnica (papel `Arquitetura`) | Gate Fase 0 | 2026-09-30 | Escolhas de stack/S3-R2/mapa e limites de PWA sem imputado | PENDING |
| R-004 | Nomear responsável, contato e delegado de **Dados / Migração** | Liderança de Dados (papel `Dados`) | Gate Fase 0 | 2026-09-30 | Recorte histórico, qualidade e reconciliação sem imputado | PENDING |
| R-005 | Nomear responsável, contato e delegado de **Corte / Rollback** | Liderança de Operação (papel `Corte`) | Gate Fase 0 | 2026-09-30 | Autorização de corte/rollback e aceite operacional sem imputado | PENDING |

> **Escopo destes R-IDs (R-001 a R-005):** a **função** de delegado (cargo) de cada papel já está definida em `docs/PILOT_GOVERNANCE.md` (seção "Delegados por papel (nível de função)") com alçada, autoridade de escalonamento, dono da nomeação e prazo. Os itens R-001 a R-005 **permanecem PENDING** porque cobrem a nomeação da **pessoa** (responsável, contato e delegado-pessoa) — não a definição da função. Definir a função de delegado **não** resolve um R-ID.

## Grupo B — Aprovação do glossário

| ID | Item | Aprovadores (papéis) | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-011 | Aprovar glossário de `ticket`, `work_order`, `dispatch`, `event`, `evidence`, `technician_location`, `customer`, `service_address` (e termos adicionais) | Produto + Operação + Arquitetura | Gate Fase 0 (specs devem usar termos aprovados) | 2026-09-30 | Terminologia não autoritativa; specs podem divergir do significado do legado | PENDING |

## Grupo C — Escopo do piloto (MVP_SCOPE)

| ID | Item | Dono | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-012 | Confirmar **empresa piloto** (nome/critério de escolha) | Operação (+ Produto) | Gate Fase 0 | 2026-09-30 | Não há recorte para dimensionar/extrair o piloto | PENDING |
| R-013 | Confirmar **filiais/cidades** (código, nome, cidade/UF, fuso) | Operação | Gate Fase 0 | 2026-09-30 | Contexto de filial/fuso, mapa e agenda não dimensionáveis | PENDING |
| R-014 | Confirmar **usuários por perfil** (`admin`, `gestor_operacional`, `atendente`, `despachante`, `tecnico`) | Operação + Dados | Gate Fase 0 | 2026-09-30 | Matriz de permissões, RBAC e treinamento não verificáveis | PENDING |
| R-015 | Confirmar **técnicos ativos** (quantidade, distribuição, dispositivo) | Operação | Gate Fase 0 | 2026-09-30 | Matriz de dispositivos e cenário offline/load não validáveis | PENDING |

## Grupo D — Volume representativo do piloto (MVP_SCOPE)

| ID | Item | Dono | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-016 | OS/dia, OS/semana, pico/hora (alvo do piloto) | Operação + Dados | Antes da Fase 0 (sizing) / Fase 3 | 2026-10-15 | Dimensionamento de API/sync/upload sem base | PENDING |
| R-017 | Tickets/dia + taxa de conversão ticket→OS (alvo do piloto) | Operação | Antes da Fase 0 (sizing) / Fase 3 | 2026-10-15 | Tamanho de fila e carga de despacho sem base | PENDING |
| R-018 | Evidências/OS + tamanho médio + pico (alvo do piloto) | Operação + Dados | Antes da Fase 4 | 2026-10-31 | Dimensionamento de upload/storage/retention sem base | PENDING |

## Grupo E — Medições do baseline de produção (FIELDOPS_BASELINE)

Não há acesso a banco de produção no workspace; `fieldops.sql` é seed/demo. Cada medida abaixo é **compromisso datado de medição** (leitura somente no FieldOps de produção + confirmação de significado pela Operação). Dono default: **Dados** (executa a consulta) + **Operação** (valida o significado). Âncora: **Gate da Fase 0** ("Baseline publicado").

| ID | Métrica | Dono | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-020 | Total de OS (3/6/12 meses) + OS por status | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de volume sem dado real | PENDING |
| R-021 | OS por filial / por técnico | Dados + Operação | Gate Fase 0 | 2026-09-30 | Distribuição de carga sem dado real | PENDING |
| R-022 | Tickets e conversão ticket→OS | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de entrada de tickets sem dado real | PENDING |
| R-023 | Evidências por tipo e tamanho | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de evidência/upload sem dado real | PENDING |
| R-024 | Técnicos ativos | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de frota/matriz de dispositivos sem dado real | PENDING |
| R-025 | Usuários ativos por perfil | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de RBAC/permissões sem dado real | PENDING |
| R-026 | Tempos de ciclo (criação→atribuição, atribuição→início, execução, 1ª sync) | Dados + Operação | Gate Fase 0 | 2026-09-30 | Baseline de tempos sem observação/medida | PENDING |

> Regra: R-020 a R-026 são **compromissos de medição**. Quando executados, devem vir com **data de consulta/observação, query/source e laudo** da pessoa do papel dono. Só então a linha deixa de ser `PENDING`.

## Grupo F — Critérios numéricos de aceite por fase (ACCEPTANCE_PLAN)

| ID | Placeholder | Símbolo | Dono | Ancoragem | Data-alvo (proposta) | Impacto se não cumprir | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-030 | Idade da outbox | `<X>` min (Fase 3) | Operação | Antes da Fase 3 | 2026-10-15 | Critério offline não mensurável | PENDING |
| R-031 | Upload de evidência com sucesso | `<Y>%` (Fase 4) | Operação | Antes da Fase 4 | 2026-10-31 | Critério de evidência não mensurável | PENDING |
| R-032 | Painel refletir OS concluída | `<Z>` segundos (Fase 5) | Operação + Produto | Antes da Fase 5 | 2026-11-30 | Critério de tempo real não mensurável | PENDING |
| R-033 | Reconcilição staging (diferença) e % migrado sem erro | `<X>%` (Fase 6) | Dados | Antes da Fase 6 | 2026-12-31 | Critério de migração não mensurável | PENDING |
| R-034 | Thresholds de recência (sync e localização) | `<X>`/`<Y>` min | Operação (+ Produto para texto de UI) | Antes da Fase 5 | 2026-11-30 | Alerta de "sem sync"/"posição desatualizada" sem definição operacional | PENDING |

## Grupo G — Correlação com decisões técnicas

Os itens abaixo **não são uma nova pendência**, mas a pendência decisória correspondente já registrada em `docs/DECISION_LOG.md`. Mantêm-se aqui apenas para alertar que **dependem de valores/medições** que só existem com dado real:

| DECISION_LOG ID | Tema | Dono | Prazo (âncora) | Relação |
| --- | --- | --- | --- | --- |
| D-101 | S3 vs R2 (armazenamento de evidências) | Arquitetura (+ Dados) | Antes da Fase 4 | `evidence-uploads`; R-018, R-023 |
| D-102 | Provedor de mapa/geocodificação | Produto + Arquitetura | Antes da Fase 5 | `operations-dashboard`; R-013 |
| D-103 | Thresholds de recência | Operação (+ Produto) | Antes da Fase 5 | `operations-dashboard`, `GPS_POLICY.md`; R-034 |
| D-104 | Recorte histórico da migração | Dados (+ Operação) | Antes da Fase 6 | `data-migration-cutover`; R-020, R-021 |

## Grupo H — Correlação com o fechamento das regras do MVP (3.1–3.10)

Os artefatos do Grupo 3 (`docs/WORK_ORDER_FLOW.md`, `docs/STATE_MATRICES.md`, `docs/EVIDENCE_POLICY.md`, `docs/OPERATIONAL_POLICIES.md`, `docs/PERMISSIONS_MATRIX.md`, `docs/REQUIRED_FIELDS.md`, `docs/OPERATIONAL_THRESHOLDS.md`, `docs/API_CONTRACT.md`, `docs/FUNCTIONAL_GATE.md`) **não alteram** o status de nenhum R-ID acima: todos permanecem **PENDING** até nomeação/medição/aprovação por pessoa real. **Nenhum artefato do Grupo 3 é aprovação assinada.**

| Artefato / tema do Grupo 3 | R-ID(s) dependente(s) | Dono | Status |
| --- | --- | --- | --- |
| `WORK_ORDER_FLOW.md` (3.1) | R-001, R-002, R-011 | Produto + Operação | PENDING |
| `STATE_MATRICES.md` ticket (3.2) e OS (3.3) | R-001, R-002 | Produto + Operação | PENDING |
| `EVIDENCE_POLICY.md` (3.4) | R-001, R-002 | Produto + Operação | PENDING |
| `OPERATIONAL_POLICIES.md` (3.5) | R-001, R-002 | Produto + Operação | PENDING |
| `PERMISSIONS_MATRIX.md` (3.6) | R-014 | Operação + Dados | PENDING |
| `REQUIRED_FIELDS.md` (3.7) | R-013, R-014 | Produto + Operação | PENDING |
| `OPERATIONAL_THRESHOLDS.md` (3.8) | R-034 | Operação | PENDING |
| `API_CONTRACT.md` (3.9) | R-002, R-003 | Arquitetura + Operação | PENDING |
| `FUNCTIONAL_GATE.md` (3.10) | R-001, R-002, R-003 | Produto + Operação + Arquitetura | PENDING |

## Regras

- Um R-ID só é **RESOLVED** com **data real**, **valor/laudo**, **quem (papel)** e **referência** documental registrada em `docs/DECISION_LOG.md` ou em um doc específico (ex.: escopo/baseline).
- **Datas-proposta** são estimativas de planejamento, não compromissos de pessoas. Não substituem a nomeação (R-001 a R-005).
- Revisão semanal: atualizar estado quando o dono nomear/medir/aprovar.

## Documentos vinculados

- `docs/PILOT_GOVERNANCE.md` — papéis/donos (R-001 a R-005).
- `docs/MVP_SCOPE.md` — escopo e volume (R-012 a R-018).
- `docs/FIELDOPS_BASELINE.md` — baseline de produção (R-020 a R-026).
- `docs/ACCEPTANCE_PLAN.md` — critérios por fase e gates (R-030 a R-034).
- `docs/GLOSSARY.md` — aprovação de terminologia (R-011).
- `docs/DECISION_LOG.md` — decisões técnicas (D-101 a D-104) e onde registrar a resolução.
