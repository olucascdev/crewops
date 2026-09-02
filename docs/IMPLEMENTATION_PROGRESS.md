# Progresso de Implementação — CrewOps

> Consolidado em 2026-09-01 a partir do arquivo de tarefas OpenSpec, docs do change, worktree e histórico Git.

## Escopo e governança

O MVP reconstrói o FieldOps em monorepo TypeScript: Next.js/PWA, NestJS, PostgreSQL/PostGIS, Drizzle, Redis/BullMQ, WebSocket, Dexie e storage de objetos. Fluxo-alvo: criar work order, despachar técnico, executar online/offline, registrar eventos, localização e evidências, acompanhar painel, mapa e timeline.

Fatos de governança:

- OpenSpec é fonte de verdade para comportamento novo; PHP legado é referência funcional, somente leitura.
- Escritas desta reconstrução ficam em `crewops/`; legado e arquivos fora de `crewops/` não devem ser alterados.
- Implementação ocorre por fatias, após extrair, classificar e aprovar regras e critérios.
- MVP cobre uma empresa piloto com filiais e cinco perfis; financeiro, estoque, SaaS completo, BI avançado, roteirização, microserviços e GPS contínuo ficam fora.
- GPS é por evento e última posição conhecida; PWA não promete rastreamento contínuo em background.
- Nomeações, escopo do piloto, métricas, thresholds, storage, mapa, assinatura e demais decisões formais continuam pendentes nos R-IDs/D-IDs registrados.

## Grupo 1 — Governança, baseline e piloto

**Plano:** registrar responsáveis e delegação; definir recorte e volume piloto; criar critérios de aceitação; glossário; baseline do legado; política de GPS; registro de decisões e pendências.

**Implementação:** os artefatos previstos existem em `docs/`: `PILOT_GOVERNANCE.md`, `MVP_SCOPE.md`, `ACCEPTANCE_PLAN.md`, `GLOSSARY.md`, `FIELDOPS_BASELINE.md`, `GPS_POLICY.md`, `DECISION_LOG.md` e `PILOT_RATIFICATIONS.md`.

**Revisão/aprovação:** completude estrutural registrada como verificada; aprovação formal não concedida. Nomes, contatos, escopo real, métricas de produção, valores numéricos e decisões de gate permanecem PENDING.

**Tasks:** `1.1–1.7` estão `[x]` no arquivo de tarefas OpenSpec.

## Grupo 2 — Inventário funcional do legado

**Plano:** mapear autenticação/RBAC, organização/técnicos, clientes/endereços, tickets, work orders, app técnico, evidências, localização, sync e indicadores; classificar preservar/redesenhar/adiar/descartar; publicar rastreabilidade fonte PHP → regra → spec → tarefa → teste.

**Implementação:** `docs/BUSINESS_RULES.md`, `LEGACY_INVENTORY.md`, `CLASSIFICATION.md`, `TRACEABILITY_MATRIX.md` e `LEGACY_REFERENCE_MAP.md` existem. O inventário cita fontes PHP e seed, distingue evidência de código de medição de produção e registra divergências.

**Revisão/aprovação:** inventário e classificação estão registrados, mas a matriz está PENDENTE de aprovação de Produto/Operação; não há aprovação assinada.

**Tasks:** `2.1–2.12` estão `[x]` no arquivo de tarefas OpenSpec.

## Grupo 3 — Fechamento das regras do MVP

**Plano:** consolidar fluxo ponta a ponta; matrizes de estados; política de evidências; políticas de reatribuição/cancelamento/reabertura/retrabalho/offline; permissões; campos; thresholds; contrato API; gate funcional.

**Implementação:** existem `WORK_ORDER_FLOW.md`, `STATE_MATRICES.md`, `EVIDENCE_POLICY.md`, `OPERATIONAL_POLICIES.md`, `PERMISSIONS_MATRIX.md`, `REQUIRED_FIELDS.md`, `OPERATIONAL_THRESHOLDS.md`, `API_CONTRACT.md` e `FUNCTIONAL_GATE.md`.

**Revisão/aprovação:** documentos são propostas registradas. Aprovação formal permanece PENDENTE; thresholds, storage, mapa, assinatura, unicidade de cliente, recorte histórico e nomeações continuam bloqueios documentados. O gate funcional está documentado, não aprovado.

**Tasks:** `3.1–3.10` estão `[x]` no arquivo de tarefas OpenSpec.

## Grupo 4 — Fundação do monorepo e ambientes

### Plano 4.1–4.10

| Tarefa | Plano |
| --- | --- |
| 4.1 | Auditar workspaces, Node/TypeScript e scripts de dev, build, lint, typecheck e test. |
| 4.2 | Completar `.env.example` tipado, sem segredos reais, para API, web, PostgreSQL/PostGIS, Redis, S3/R2 e WebSocket. |
| 4.3 | Configurar Docker Compose com PostgreSQL/PostGIS, Redis, API, web, volumes e healthchecks. |
| 4.4 | Validar configuração de API/web na inicialização, com mensagem clara para variável ausente. |
| 4.5 | Configurar migrations Drizzle determinísticas, verificação e rollback compatível. |
| 4.6 | Configurar testes unitários, integração e E2E por workspace, com isolamento de banco/Redis. |
| 4.7 | Configurar CI para install bloqueado, lint, typecheck, testes, build e validação OpenSpec. |
| 4.8 | Expor saúde de processo, banco, Redis e filas, distinguindo saudável de degradado. |
| 4.9 | Criar seed mínimo sintético, sem massa sensível do legado. |
| 4.10 | Validar onboarding local do zero e registrar comandos no README. |

### Estado baseado em evidência

O filesystem e o diff confirmam trabalho efetivo em 4.1–4.9: root/workspaces/scripts, `.env.example`, Compose, loaders de ambiente, Drizzle e helpers, harness de testes, CI, health endpoint e seed existem. O README raiz existe, mas não registra comandos de onboarding; portanto 4.10 não está comprovada.

O arquivo de tarefas OpenSpec mantém **todas as tarefas 4.1–4.10 `[ ]`**. Logo, a implementação existe como trabalho não aprovado, não como Grupo 4 concluído.

**Ponto exato de parada:** após a fundação parcial do Grupo 4, com configuração, infraestrutura de desenvolvimento, testes, CI, health e seed adicionados; antes da validação/aprovação formal do Grupo 4 e antes de iniciar o Grupo 5. Não há evidência de implementação dos Grupos 5+.

### Arquivos do trabalho observado

Arquivos modificados no worktree relacionados à fundação: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `docker-compose.yml`, `apps/api/package.json`, `apps/api/src/main.ts`, `apps/api/src/modules/app.module.ts`, `apps/api/src/realtime/realtime.gateway.ts`, `apps/api/src/routes/health.controller.ts`, `apps/api/tsconfig*`, `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/next-env.d.ts`, `apps/web/tsconfig*`, `packages/db/package.json`, `packages/db/drizzle.config.ts`, `packages/db/src/index.ts`, `packages/db/src/schema.ts`, `packages/shared/package.json`, `packages/shared/src/index.ts`.

Arquivos criados no worktree relacionados à fundação: `.dockerignore`, `.github/workflows/ci.yml`, `.nvmrc`, `apps/api/Dockerfile`, `apps/api/src/config.ts`, `apps/api/src/health/health.service.ts`, `apps/api/src/infra/database.ts`, `apps/api/src/infra/redis.ts`, `apps/api/src/infra/tokens.ts`, testes/configuração de `apps/api`, Dockerfile e testes/configuração de `apps/web`, `biome.json`, migrations/helpers/testes/configuração de `packages/db`, testes/configuração de `packages/shared`, `scripts/validate_docs.sh` e `scripts/validate_openspec.sh`.

### Comandos e testes

Evidências existentes nos docs/Git: `git diff --check` foi registrado como PASS; `scripts/validate_docs.sh` anteriormente registrou exit 0 com 8 avisos de referências futuras; `npm run test` antes não existia, mas agora há script no worktree.

Nesta consolidação, a validação obrigatória executada após criar este arquivo é registrada na seção abaixo. Não foi atribuído sucesso a build, lint, typecheck, testes, Docker, migrations ou E2E sem execução e resultado observados nesta rodada.

### Bloqueios e falhas

- Grupo 4 segue sem checkboxes concluídos no OpenSpec.
- O README raiz não contém onboarding local reproduzível, impedindo comprovar 4.10.
- Health reporta filas como degradadas porque workers BullMQ ainda não existem; isso é esperado até o Grupo 14, não saúde plena de filas.
- Schema/shared ainda usam estados como `draft/open/assigned/en_route/arrived/in_progress/blocked/done/cancelled`, divergentes das matrizes/specs do Grupo 3; `STATE_MATRICES.md` atribui alinhamento ao Grupo 5.
- `packages/db` usa estrutura de tabelas/colunas ainda divergente do modelo OpenSpec, sem prova de PostGIS, idempotência completa ou modelo final; Grupo 5 permanece necessário.
- Decisões PENDING do Grupo 3 continuam bloqueando fatias posteriores conforme `FUNCTIONAL_GATE.md`.
- Não há retorno de implementador disponível nesta inspeção. Filesystem e Git, contudo, comprovam que houve alterações reais; retorno vazio não permite concluir aprovação nem autoria.

## Próxima ação exata

Retomar o workflow no ponto de **review/validação do Grupo 4**, não iniciar Grupo 5: executar os checks objetivos de 4.1–4.10, corrigir falhas encontradas, completar onboarding no README raiz, revisar divergências da fundação e só então submeter para aprovação. Não marcar tasks sem implementação validada e aprovação objetiva.

## Validação desta consolidação

Comando executado a partir de `crewops` após criar este arquivo: `./scripts/validate_docs.sh`.

Resultado final observado: **PASS, exit 0, 0 falhas, 2 avisos**.

- Avisos: `DATABASE_MAP.md` e `docs/DATABASE_MAP.md` são referências futuras declaradas do Grupo 5.
- Checks obrigatórios, incluindo documentos, seções, placeholders, R-IDs, links existentes e origens legadas, passaram.
- Uma execução intermediária falhou por referências ambíguas ao README e ao arquivo de tarefas; o texto foi ajustado neste arquivo, sem criar arquivos compensatórios nem modificar o validator.

## Alterações desta tarefa

Somente este arquivo foi criado por esta tarefa: `docs/IMPLEMENTATION_PROGRESS.md`. Nenhum arquivo existente foi editado.
