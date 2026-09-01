## Why

O FieldOps em PHP concentra regras operacionais valiosas, mas mistura comportamento de negocio, SQL, interface e infraestrutura, o que torna arriscada uma conversao direta para TypeScript. O CrewOps precisa nascer como uma reconstrucao controlada por dominios e fatias verticais, preservando o conhecimento funcional do legado e tratando offline, auditoria, evidencias e localizacao por evento como fundamentos do MVP.

## Contexto

O repositorio contem o sistema FieldOps legado e um monorepo CrewOps inicial. A migracao deve manter o FieldOps disponivel como referencia funcional e consulta temporaria enquanto o novo fluxo operacional e validado, sem reutilizar a arquitetura PHP como desenho tecnico do CrewOps.

## Objetivo

Entregar um MVP operacional em que gestor e equipe de campo consigam executar o fluxo completo:

```txt
criar OS -> despachar tecnico -> receber no PWA -> executar offline/online
-> registrar eventos, localizacao e evidencias -> acompanhar mapa e timeline
```

## What Changes

- Criar uma trilha formal para extrair entidades, regras, permissoes, queries e fluxos criticos do PHP antes de reimplementar cada dominio.
- Organizar o CrewOps como monorepo com Next.js PWA, NestJS, PostgreSQL + PostGIS, Drizzle, Redis + BullMQ, WebSocket, IndexedDB + Dexie, S3/R2 e Docker.
- Implementar autenticacao e perfis simples para `admin`, `gestor_operacional`, `atendente`, `despachante` e `tecnico`.
- Separar empresa/filiais, clientes/enderecos, tickets, ordens de servico, despacho, eventos, localizacoes e evidencias.
- Tornar `work_order_events` a verdade operacional auditavel, mantendo `work_orders.status` como estado atual para consulta eficiente.
- Tornar o PWA do tecnico local-first: a acao e registrada localmente antes da tentativa de envio e exibe estado pendente quando nao houver conectividade.
- Processar sincronizacao com `idempotency_key`, resultado individual por evento, retry e reconciliacao segura.
- Processar fotos e assinaturas por compressao local, fila, URL pre-assinada S3/R2 e estados `pending_upload`, `uploaded` e `failed`.
- Atualizar o painel via WebSocket em primeiro plano, com Redis para filas e distribuicao, sem transformar o MVP em microservicos.
- Exibir localizacao por evento e ultima posicao conhecida, incluindo recencia e precisao do ponto.
- Migrar dados somente depois do MVP funcional, passando por tabelas de staging, transformacao, reconciliacao e ensaio de corte.
- Manter o PHP somente leitura durante a estabilizacao final e definir rollback antes do desligamento.

## Escopo

- Uma empresa piloto com multiplas filiais.
- Usuarios e cinco perfis operacionais simples.
- Clientes e enderecos de atendimento.
- Tickets vinculaveis a ordens de servico.
- Criacao, despacho, execucao e finalizacao de OS.
- Timeline de eventos, GPS por evento, fotos, assinatura e notas.
- Offline/sync do tecnico, mapa de ultima posicao e dashboard operacional.
- Relatorios operacionais essenciais e auditoria do fluxo de OS.
- Migracao dos dados necessarios ao piloto e estrategia de convivencia/corte.

## Fora de escopo

- SaaS multiempresa completo, billing e white-label avancado.
- Financeiro, estoque, roteirizacao avancada, chat interno e BI sofisticado.
- Microservicos, Kubernetes, Kafka e CQRS pesado.
- App nativo antes da validacao do MVP.
- Garantia de GPS continuo em segundo plano ou com tela bloqueada no PWA.
- Migracao indiscriminada de todo o historico legado.

## Capabilities

### New Capabilities

- `identity-access`: autenticacao, sessao, perfis simples e autorizacao por acao operacional.
- `organization-branches`: empresa piloto, filiais e vinculos de usuarios e tecnicos.
- `customer-service-addresses`: clientes e enderecos de atendimento separados e georreferenciaveis.
- `ticketing-dispatch`: separacao entre solicitacao, execucao, atribuicao e agendamento.
- `data-migration-cutover`: staging, transformacao, reconciliacao, convivencia, corte e rollback do legado.

### Modified Capabilities

- `platform-architecture`: consolidar os limites do monorepo, infraestrutura Docker, jobs e atualizacoes em primeiro plano.
- `legacy-modernization`: transformar a analise do PHP em um gate obrigatorio antes de cada fatia vertical.
- `field-operations`: formalizar o ciclo de vida da OS, eventos, localizacao por evento e regras de finalizacao.
- `offline-sync`: formalizar fila local, protocolo idempotente, conflitos, retry e observabilidade de sincronizacao.
- `evidence-uploads`: formalizar compressao, upload direto, estados, retry e finalizacao com upload pendente.
- `operations-dashboard`: formalizar sala de operacao, indicadores, recencia da posicao e alertas de falta de sincronizacao.

## Impact

- `apps/web`: painel operacional e PWA do tecnico, incluindo cache local, outbox e estados de sincronizacao.
- `apps/api`: modulos NestJS, contratos HTTP, WebSocket, autorizacao, sincronizacao, evidencias e operacao.
- `packages/db`: schema Drizzle, PostGIS, migrations, indices, staging e consultas operacionais.
- `packages/shared`: contratos, eventos, estados, schemas de validacao e codigos de erro compartilhados.
- Redis/BullMQ: jobs de upload, retries, notificacao operacional e tarefas assincronas.
- S3/R2: armazenamento de evidencias com URL pre-assinada e ciclo de vida controlado.
- FieldOps PHP: fonte de referencia funcional, origem de dados e sistema temporario de consulta durante a transicao.

## Riscos

- Regras escondidas no PHP nao serem identificadas antes da reimplementacao.
- Duplicacao ou perda de eventos por retry offline sem idempotencia ponta a ponta.
- Conflitos entre a ordem local do PWA e mudancas feitas pela central.
- Fotos grandes consumirem memoria, dados moveis ou armazenamento local.
- Equipe comercial comunicar GPS como rastreamento continuo.
- Dados legados inconsistentes contaminarem o modelo novo.
- Corte antecipado sem metricas, rollback e periodo de estabilizacao.

## Plano de validacao

- Aprovar inventario funcional e matriz legado -> CrewOps antes de implementar cada dominio.
- Cobrir regras de status, permissao, idempotencia, conflito e finalizacao com testes automatizados.
- Simular perda de rede, reenvio, eventos fora de ordem, duplicacao e recuperacao do PWA.
- Validar upload com arquivo grande, falha parcial, URL expirada e retry manual.
- Executar piloto com tecnicos reais em internet instavel e medir taxa/idade da fila pendente.
- Reconciliar contagens e amostras de dados entre FieldOps, staging e CrewOps.
- Realizar ensaio de corte e rollback antes de tornar o legado somente leitura.
