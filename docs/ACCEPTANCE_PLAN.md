# Plano de Aceitação do Piloto CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.3
> Data de registro: **2026-09-01**
> Status: **PENDENTE de aprovação**. Critérios numéricos que ainda usam `<X>`/`<Y>`/`<Z>` são **placeholders** e estão registrados como pendências datadas em `docs/PILOT_RATIFICATIONS.md` (R-030 a R-033) com dono, prazo e impacto. **Nenhum valor foi aprovado por assinatura.** Um critério só é executável quando a casa numérica estiver **RESOLVED** antes do gate da fase correspondente.

## Objetivo

Definir, por fase, gate de entrada, critérios mensuráveis e gate de saída, além de severidades de defeito, para que o piloto avance apenas com qualidade verificável e rastreável.

## Como ler os critérios

Cada critério carrega **métrica alvo**, **método de medição**, **dono** (papel de `docs/PILOT_GOVERNANCE.md`) e **prazo/gate**. Nenhum critério é considerado SMART apenas por ter porcentagem; ele precisa de método e dono executáveis.

## Severidades de defeito

| Severidade | Definição | Regra de gate |
| --- | --- | --- |
| **Crítico** | Impede uso, causa perda de dado, risco de segurança ou falha de corte | **Deve ser zero** para avançar de fase |
| **Alto** | Impacta operação de forma significativa (mas dá para operar com contorno) | Deve ter **mitigação aprovada** antes de avançar |
| **Médio** | Inconveniente ou contorno aceitável | Pode avançar; registrado no backlog do piloto |
| **Baixo** | Cosmético ou melhoria | Pode avançar; backlog contínuo |

**Regra:** os gates abaixo usam "zero Crítico aberto" como condição de saída. Melhoria contínua não bloqueia fase; bug Crítico bloqueia.

## Método de medição (referência comum)

- **Medição de produção:** sempre anonimizada/agregada (sem PII); em ambiente de homologação ou leitura somente do FieldOps.
- **Teste automatizado:** fixture conhecida + asserção de resultado; reconciliar total da lista com o indicador.
- **Observação operacional:** acompanhado em dispositivo/cenário real do piloto, com laudo e data.

## Fases do piloto (alinhadas a `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` → Migration Plan)

### Fase 0 — Preparação

- **Gate de entrada:** mudança OpenSpec ativa; `PILOT_GOVERNANCE.md`, `MVP_SCOPE.md` e `DECISION_LOG.md` criados com nomes/donos registrados; ambientes Docker/CI/segredos configurados (CI/teste são do grupo 4).
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Papéis de governança nomeados | 100% dos 5 papéis (0 placeholder de dono para decisão essencial) | Conferir `PILOT_GOVERNANCE.md` + `PILOT_RATIFICATIONS.md` (R-001 a R-005) | Produto + Operação + Arquitetura + Dados + Corte | Gate Fase 0 — 2026-09-30 | R-001..R-005 |
| Baseline do FieldOps publicado | Documento `FIELDOPS_BASELINE.md` com valores de produção OU compromissos de medição datados | Conferir `PILOT_RATIFICATIONS.md` R-020 a R-026 | Dados + Operação | Gate Fase 0 — 2026-09-30 | R-020..R-026 |
| Pendências críticas com dono/prazo | 100% das pendências essenciais com dono e prazo | Inspecionar `DECISION_LOG.md` (D-101 a D-104) | Produto + Arquitetura + Dados | Gate Fase 0 | D-101..D-104 |
| Escopo do piloto confirmado | 100% dos campos de `MVP_SCOPE.md` com valor real OU compromisso datado | Conferir R-012 a R-018 | Operação + Dados | Gate Fase 0 — 2026-09-30 | R-012..R-018 |
| Glossário aprovado | R-011 RESOLVED (aprovação registrada) | Conferir `PILOT_RATIFICATIONS.md` R-011 | Produto + Operação + Arquitetura | Gate Fase 0 — 2026-09-30 | R-011 |

- **Gate de saída:** nenhuma decisão essencial sem dono/prazo; zero Crítico aberto.

### Fase 1 — Descoberta funcional

- **Gate de entrada:** Fase 0 concluída.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Matriz fonte PHP → regra → spec → tarefa → teste | Cobertura ≥ 95% dos fluxos críticos (auth, OS, ticket, despacho, app técnico, evidência, mapa, sync) | Revisão da matriz `docs/BUSINESS_RULES.md`/`LEGACY_REFERENCE_MAP.md` + rastreio cruzado regra→teste | Arquitetura + Operação | Gate Fase 1 | Grupo 2/3 |
| Estados, perfis e campos obrigatórios aprovados | 0 decisão essencial aberta | Conferir aprovações registradas por Produto/Operação | Produto + Operação | Gate Fase 1 | `MVP_SCOPE.md`, `BUSINESS_RULES.md` |

- **Gate de saída:** matriz aprovada por Produto/Operação; 0 Crítico aberto.

### Fase 2 — Fundação vertical

- **Gate de entrada:** Fase 1 concluída; regras essenciais fechadas.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Fluxo vertical ponta a ponta | Login → lista do técnico → detalhe → mudar status → painel funcionando | Teste E2E da fatia vertical | Arquitetura + Operação | Gate Fase 2 | Grupo 9 |
| Sync não duplica | 0% de duplicação (mesma `idempotency_key` nunca gera 2 eventos) | Teste de lote/idempotência (`sync_receipts`) | Arquitetura | Gate Fase 2 | `offline-sync` |
| Transição de status inválida | 100% dos casos inválidos rejeitados | Teste da máquina de estados (unit/integração) | Arquitetura | Gate Fase 2 | `field-operations` |

- **Gate de saída:** fatia vertical homologada com cenários do legado; 0 Crítico aberto.

### Fase 3 — Execução local-first

- **Gate de entrada:** Fase 2 concluída; schema/eventos/idempotência prontos.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Mudar status sem internet | 100% dos casos (ação registrada local) | Teste offline em dispositivo do piloto | Operação + Arquitetura | Gate Fase 3 | `offline-sync` |
| Fila sobrevive a reload | 100% dos casos | Teste de reload offline (Dexie/outbox) | Arquitetura | Gate Fase 3 | `offline-sync` |
| Idade da outbox | `<X>` min em ≥ 95% das medições | Telemetria de `outbox` por técnico/dispositivo | Operação | Antes da Fase 3 — 2026-10-15 | R-030 (D-103) |

- **Gate de saída:** cenários offline validados em dispositivo real do piloto; 0 Crítico aberto.

### Fase 4 — Evidências e finalização

- **Gate de entrada:** Fase 3 concluída.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Upload de evidência com sucesso | > `<Y>%` das tentativas | Telemetria de upload (sucesso/falha/retry) + amostra | Operação | Antes da Fase 4 — 2026-10-31 | R-031 (D-101) |
| OS finalizada com evidência local pendente no painel | 100% dos casos | Teste E2E de pendência de evidência + alerta no painel | Arquitetura + Operação | Gate Fase 4 | `evidence-uploads` |
| Objetos órfãos removidos | Job testado e janela de retenção respeitada | Teste do job de limpeza (BullMQ) | Arquitetura | Gate Fase 4 | `evidence-uploads` |
| Tamanho/pico de evidência | Compatível com limites aprovados (compressão antes da fila) | Medir payload pré-compressão/pós-compressão; comparar com R-018 | Operação + Dados | Antes da Fase 4 — 2026-10-31 | R-018 (R-023) |

- **Gate de saída:** recuperação de falha e objetos órfãos validados; 0 Crítico aberto.

### Fase 5 — Sala de operação

- **Gate de entrada:** Fase 4 concluída.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| OS concluída refletida no painel | < `<Z>` segundos em condições normais | Medir latência WebSocket→render + reconexão/reconciliação | Operação + Produto | Antes da Fase 5 — 2026-11-30 | R-032 |
| Recência classificada | recente/atenção/desatualizada conforme thresholds | Conferir `GPS_POLICY.md` + D-103/R-034 | Operação (+ Produto) | Antes da Fase 5 — 2026-11-30 | R-034 (D-103) |
| Rastreabilidade do indicador | 100% dos indicadores chegam à lista que forma seu total | Teste de dashboard: total soma com a lista | Arquitetura | Gate Fase 5 | `operations-dashboard` |
| Reequilíbrio após reconexão | Sem perda de estado | Teste de reconexão WebSocket + reconciliação por API | Arquitetura | Gate Fase 5 | `realtime` |

- **Gate de saída:** mapa, alertas, WebSocket e relatórios essenciais validados; 0 Crítico aberto.

### Fase 6 — Migração e piloto

- **Gate de entrada:** Fase 5 concluída; recorte histórico definido (D-104); staging construído.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Cargas no staging reconciliadas | Diferença < `<X>%` OU 0 divergências críticas entre FieldOps/staging/CrewOps | Reconciliação automática de contagens, chaves, status, datas, relacionamentos e amostras | Dados | Antes da Fase 6 — 2026-12-31 | R-033 (D-104) |
| Registros migrados sem erro | > `<X>%` do recorte migrado sem invalidez/erro | Relatório de staging `legacy_*` (origem, lote, hash, estado, erro) | Dados | Antes da Fase 6 — 2026-12-31 | R-033 (D-104) |
| Resultado por item observável | Aplicado/duplicado/rejeitado/conflito/retry observável | Telemetria da migração + export do resultado por item | Dados | Gate Fase 6 | `data-migration-cutover` |
| Severidades críticas corrigidas; usuários treinados | 0 Crítico aberto; treinamento registrado | Registro de correção + evidência de treinamento por perfil | Operação + Produto | Gate Fase 6 | `piloto` |

- **Gate de saída:** reconciliação aceita por Dados; zero Crítico aberto.

### Fase 7 — Corte e estabilização

- **Gate de entrada:** Fase 6 concluída; runbook de rollback aprovado; backup e plano de contingência prontos.
- **Critérios mensuráveis:**

| Critério | Métrica alvo | Método de medição | Dono | Prazo/gate | Ref |
| --- | --- | --- | --- | --- | --- |
| Carga delta + smoke tests | Sem falha crítica | Ensaio em homologação + listas de checagem de smoke | Corte + Operação | Gate Fase 7 | `cutover` |
| OS/evento na janela de estabilização | Processado dentro da janela | Monitoramento de fila/evento durante a janela | Operação | Gate Fase 7 | `cutover` |
| Rollback testado | Ensaio de rollback com sucesso e sem perda | Execução do runbook em homologação | Corte + Arquitetura | Gate Fase 7 | `cutover` |
| FieldOps somente leitura | Apenas com todos os gates de saída satisfeitos | Conferência cruzada dos critérios antes do corte | Corte | Gate Fase 7 | `cutover` |

- **Gate de saída:** aceite operacional + reconciliação final; 0 Crítico aberto.

## Critérios transversais (aplicam-se a todas as fases)

- **SMART:** todo critério tem métrica alvo, método de medição, dono e prazo (tabelas acima). Critério com `<...>` **não é SMART** até o R-ID correspondente estar RESOLVED.
- Medições de produção sempre anonimizadas/agregadas (sem PII).
- Alterações no plano geram nova versão com justificativa; versões anteriores preservadas.

> **Nota de pendência de valores:** `<X>`, `<Y>`, `<Z>` e `<X>%` não têm valor real no workspace. Estão registrados como R-030 a R-033 em `docs/PILOT_RATIFICATIONS.md`, com dono e prazo. **Nenhum gate das fases 3–6 avança** com o valor correspondente ainda PENDING.

## Documentos vinculados

- `docs/PILOT_GOVERNANCE.md` — dono de cada gate (R-001 a R-005).
- `docs/PILOT_RATIFICATIONS.md` — pendências de valores/nomeações (R-030 a R-034).
- `docs/FIELDOPS_BASELINE.md` — referência do mínimo aceitável (R-020 a R-026).
- `docs/DECISION_LOG.md` — thresholds e escolhas pendentes (D-101 a D-104).
- `docs/GPS_POLICY.md` — critério de comunicação (não prometer rastreamento contínuo).
