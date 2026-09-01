# CrewOps - Contexto do Projeto

## Missao

CrewOps e a nova plataforma operacional para provedores de internet e equipes de campo. Ele substitui gradualmente o FieldOps em PHP puro por uma stack moderna, mantendo o conhecimento funcional do sistema antigo sem portar a implementacao antiga arquivo por arquivo.

## Estrategia de Migracao

Nao converter PHP para TypeScript diretamente.

O FieldOps deve ser tratado como referencia funcional para extrair:

- entidades e relacionamentos;
- fluxos de chamado e ordem de servico;
- regras de status;
- permissoes;
- relatorios;
- queries importantes;
- telas mais usadas;
- campos obrigatorios;
- regras de auditoria;
- regras operacionais de atendimento em campo.

A reconstrucao deve acontecer por dominio e por fatias verticais completas.

## Stack Alvo

- `apps/web`: Next.js PWA para painel operacional/admin e experiencia mobile do tecnico.
- `apps/api`: NestJS API.
- `packages/db`: Drizzle ORM, schema e migrations para PostgreSQL + PostGIS.
- `packages/shared`: tipos, contratos e constantes compartilhadas.
- Redis + BullMQ: filas, jobs, retries, cache e fan-out operacional.
- WebSocket: atualizacoes em primeiro plano.
- IndexedDB + Dexie: armazenamento local do PWA.
- S3/R2: fotos, assinaturas e anexos via upload resiliente.
- Docker: ambiente local, homologacao e deploy inicial.

## Verdade Sobre GPS no PWA

CrewOps deve vender a primeira versao como acompanhamento operacional com localizacao por evento e ultima posicao conhecida do tecnico.

Com PWA, o sistema consegue bem:

- capturar localizacao com o app aberto;
- capturar localizacao no check-in;
- capturar localizacao ao mudar status;
- capturar localizacao ao anexar evidencia;
- enviar pontos periodicos enquanto o app esta em uso;
- mostrar mapa com ultima localizacao conhecida.

Com PWA, o sistema nao deve prometer GPS continuo perfeito em segundo plano com tela bloqueada.

Se o cliente exigir rastreamento continuo em segundo plano no MVP, o produto precisa considerar app nativo, Expo ou capacidade mobile dedicada.

## Modelo Operacional

A verdade operacional esta nos eventos.

O status atual da OS pode existir em `work_orders.status`, mas auditoria, timeline, mapa, prova de atendimento, relatorios e debugging de sincronizacao dependem de eventos como:

- `work_order_status_changed`;
- `technician_checked_in`;
- `photo_added`;
- `signature_collected`;
- `note_added`;
- `location_captured`.

## Conceitos Separados

- `ticket`: problema ou solicitacao do cliente.
- `work_order`: execucao em campo.
- `dispatch`: atribuicao ou agendamento.
- `work_order_event`: historico auditavel da execucao.
- `evidence`: fotos, assinatura e anexos.
- `technician_location`: pontos de localizacao.
- `customer`: cliente.
- `service_address`: endereco de atendimento.

## Escopo MVP

Comecar com uma empresa, multiplas filiais e perfis simples:

- `admin`;
- `gestor_operacional`;
- `atendente`;
- `despachante`;
- `tecnico`.

Primeira entrega desejada:

1. Gestor cria OS.
2. Despachante atribui para tecnico.
3. Tecnico recebe no PWA.
4. Tecnico executa em campo.
5. Tecnico registra status, GPS por evento, foto e assinatura.
6. Admin acompanha status, mapa e timeline.

## Fora do MVP

- multiempresa/SaaS completo;
- financeiro completo;
- estoque;
- roteirizacao avancada;
- chat interno;
- BI sofisticado;
- permissoes muito granulares;
- app nativo antes da validacao;
- microservicos;
- Kubernetes;
- Kafka;
- CQRS pesado.

## Principios de Implementacao

- Offline precisa nascer desde o comeco, nao ser remendo posterior.
- Toda acao do tecnico deve ser salva localmente primeiro quando estiver no PWA.
- Nenhum botao critico do tecnico deve depender 100% da internet para registrar a acao.
- Sync deve ser idempotente, auditavel e resiliente a falhas.
- Upload de fotos deve comprimir no PWA, usar fila, URL pre-assinada e retry manual.
- A home admin deve funcionar como sala de operacao, nao como CRUD burocratico.
