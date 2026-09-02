# Plano Grupo 8 - Tickets, OS e despacho no painel

> Escopo: tarefas 8.1-8.9 do OpenSpec `migrar-fieldops-para-crewops-mvp`.
> Fontes: `specs/ticketing-dispatch/spec.md`, `specs/field-operations/spec.md`, `docs/STATE_MATRICES.md`, `docs/WORK_ORDER_FLOW.md`, `docs/OPERATIONAL_POLICIES.md`, `docs/PERMISSIONS_MATRIX.md` e `packages/db/src/schema.ts`.
> Pre-condicao: Grupos 6 e 7 concluidos e aprovados; estados e permissoes ainda marcados como PENDING exigem ratificacao antes do gate final.

## Resultado esperado

Atendentes registram tickets; usuarios autorizados criam OS avulsa ou derivada de ticket; despachantes atribuem e agendam tecnicos; o painel consulta lista, detalhe e timeline. Cada alteracao relevante grava evento imutavel e atualiza a projecao atual de forma atomica.

## Regras de dominio

- Ticket e solicitacao; OS e unidade de execucao. Uma OS pode ter `ticket_id` nulo, mas uma OS derivada preserva o vinculo de origem.
- Numeros de ticket e OS sao unicos por empresa/ano e gerados em transacao, sem usar `max()+1` concorrente.
- O estado inicial da OS e `scheduled` apenas com agendamento sem tecnico, `dispatched` com tecnico e agendamento, ou `pending` nos demais casos, conforme a matriz aprovada.
- A unica fonte de transicoes e um servico central. Controllers, painel e PWA nunca alteram `work_orders.status` diretamente.
- Uma transicao aceita insere `work_order_events` e atualiza `work_orders` na mesma transacao. Falha em qualquer parte faz rollback completo.
- Eventos confirmados nao sao editados; correcao, rework e ajustes administrativos criam eventos compensatorios com motivo e referencia ao evento corrigido.
- Despacho valida empresa, filial, tecnico ativo e disponibilidade. Reatribuicao sempre preserva tecnico anterior, novo tecnico, autor, horario e justificativa.

## Implementacao por tarefa

### 8.1 Tickets

1. Criar contratos Zod compartilhados para create/update/list/status de ticket, filtros e resposta paginada.
2. Criar modulo `tickets` com repository escopado por empresa, service e controller; aplicar autorizacao por papel e transicao de ticket separada da OS.
3. Implementar gerador concorrente de `TKT-YYYY-NNNN` ou a estrategia equivalente aprovada pelo schema, coberta por teste de concorrencia.

### 8.2 OS de ticket e OS avulsa

1. Criar modulo `work-orders` e contratos de criacao com ticket, cliente e endereco opcionais consistentes entre si.
2. Na criacao a partir de ticket, verificar escopo comum, copiar o contexto permitido e registrar evento inicial. Na OS avulsa, nao inventar ticket.
3. Criar `addressSnapshot` a partir do endereco atual apenas na criacao/atualizacao operacional definida, preservando a referencia original.

### 8.3-8.4 Maquina de estados e transacao

1. Implementar `WorkOrderTransitionService` puro, parametrizado por estado atual, ator, evento, contexto e motivo; derivar as regras exclusivamente de `STATE_MATRICES.md`.
2. Mapear rejeicoes para `INVALID_TRANSITION`, pre-condicoes para `CONFLICT`/`VALIDATION_ERROR` e retornos permitidos para DTOs compartilhados.
3. Implementar `WorkOrderEventService.apply()` com `db.transaction`: valida, insere evento com idempotency key, atualiza status/timestamps/tecnico e grava auditoria.
4. Usar lock/condicao de versao para impedir duas transicoes concorrentes de confirmarem sobre o mesmo estado.

### 8.5 Despacho

1. Criar modulo `dispatch` com comandos explicitos: atribuir, reagendar, desatribuir e reatribuir.
2. Validar tecnico da mesma empresa/filial, ativo; indisponivel deve ser bloqueado ou exigir a confirmacao aprovada, nunca ser ignorado.
3. Gravar `dispatches`, evento operacional e auditoria na mesma transacao; recalcular o status pela maquina de estados em vez de duplicar regras no controller.

### 8.6 Painel operacional basico

1. Criar `/painel/tickets` e `/painel/ordens-servico` com lista, criacao, detalhe, filtros e paginacao estavel.
2. O detalhe de OS mostra snapshot de endereco, origem, despacho atual, transicoes disponiveis e timeline somente leitura.
3. Criar um fluxo de despacho com justificativa obrigatoria em reatribuicao/desatribuicao e feedback de indisponibilidade.

### 8.7-8.8 Transicoes e correcoes

1. Expor `GET /work-orders/:id/allowed-transitions`, calculado no servidor para o usuario atual. Esta lista orienta a interface, mas o POST continua validando tudo.
2. Expor comando administrativo de correcao que cria `correction_applied` ou o evento de rework correspondente; proibir PATCH de eventos existentes.

### 8.9 Testes

- Unitarios: matriz completa de transicoes por ator, derivacao de status de despacho e regras de pre-condicao.
- Integracao: origem ticket preservada, OS avulsa, transacao evento/status, idempotencia, tecnico inativo/fora de escopo, reatribuicao e auditoria.
- Concorrencia: duas transicoes/disparos simultaneos nao produzem timeline ou status divergentes.
- E2E: atendente abre ticket, despachante cria/despacha OS, tecnico aparece como atribuido no dado da API e gestor consulta a timeline.

## Arquivos previstos

- `packages/shared/src/ticket.ts`, `work-order.ts`, `dispatch.ts`, `events.ts` e testes de contrato.
- `apps/api/src/tickets/**`, `work-orders/**`, `dispatch/**`, com migrations somente se a modelagem aprovada nao suportar versionamento/numero concorrente.
- `apps/web/src/app/painel/tickets/**`, `ordens-servico/**` e componentes de timeline/despacho reutilizaveis.

## Criterio de conclusao

Marcar 8.1-8.9 somente quando a matriz de estados estiver ratificada, todas as transicoes invalidas forem negadas server-side, toda mudanca de estado for atomica e auditavel, e o fluxo de painel passar em E2E sem acesso cruzado entre empresa/filial.
