# Plano Grupo 9 - Primeira fatia vertical executavel

> Escopo: tarefas 9.1-9.6 do OpenSpec `migrar-fieldops-para-crewops-mvp`.
> Fontes: `docs/WORK_ORDER_FLOW.md`, `docs/ACCEPTANCE_PLAN.md`, `specs/identity-access/spec.md`, `specs/field-operations/spec.md`, `specs/ticketing-dispatch/spec.md` e `docs/PERMISSIONS_MATRIX.md`.
> Pre-condicao: Grupos 6, 7 e 8 finalizados, com build, schema e testes de integracao verdes. Este grupo integra capacidades existentes; nao deve duplicar regras de dominio.

## Fatia a demonstrar

`login -> OS atribuidas -> detalhe -> mudar status -> timeline -> painel`

O gestor, despachante e tecnico usam identidades reais de uma massa de teste isolada. A mudanca iniciada pelo tecnico e confirmada pela API atualiza a timeline e fica visivel no painel por consulta canonica, sem depender de WebSocket ou de sincronizacao offline, que pertencem aos grupos posteriores.

## Delimitacao consciente

- Esta e uma fatia online e autenticada. Dexie, outbox, sync por lote, GPS e evidencias nao entram como dependencia de sucesso aqui.
- O tecnico ve somente OS atribuidas a seu vinculo `technicians.user_id`, dentro da empresa e filial autorizadas.
- A acao de status chama a maquina de estados do Grupo 8; nenhum endpoint exclusivo da fatia pode contornar guards, transacoes ou auditoria.
- A atualizacao do painel e feita por refetch/invalidação local apos resposta confirmada. WebSocket entra no Grupo 14.

## Implementacao por tarefa

### 9.1 Fluxo com dados reais

1. Completar a tela `/login` e o redirecionamento de perfil do Grupo 6: tecnico para `/campo`, demais perfis para `/painel`.
2. Criar `/campo/ordens-servico` e `/campo/ordens-servico/[id]`, sempre alimentadas por `GET /work-orders` e `GET /work-orders/:id` autenticados.
3. Reusar as telas de lista, detalhe e timeline do painel do Grupo 8; consolidar um cliente de API com CSRF, cookies e envelope de erro estavel.

### 9.2 Isolamento tecnico

1. No repository de OS, aplicar o filtro de `company_id` para toda consulta e `technician_id` para a rota de campo, em vez de filtrar somente no browser.
2. Proteger detalhe, transicoes e lista com guard/escopo de ownership. ID de OS de outro tecnico deve retornar a resposta definida no contrato sem vazar dados.
3. Cobrir tambem a troca de filial e a sessao revogada, usando seeds de pelo menos duas empresas e dois tecnicos.

### 9.3 Evento e reflexo no painel

1. A tela de campo solicita as transicoes permitidas, apresenta somente as aplicaveis e confirma a acao com motivo quando a matriz exigir.
2. Ao aceitar a resposta, atualizar o estado da tela pela representacao retornada ou refetch do detalhe; a timeline deve conter o evento confirmado e os timestamps UTC.
3. O painel consulta a mesma projecao de `work_orders` e a mesma timeline. Confirmar que o status nao depende de cache do tecnico.

### 9.4 E2E

1. Criar fixtures deterministicas: empresa, filial, gestor, despachante, tecnico, cliente/endereco e OS `dispatched` para o tecnico.
2. Cobrir login como gestor e despachante, acesso ao painel, login como tecnico, lista, detalhe, transicao permitida e verificacao subsequente no painel.
3. Cobrir casos negativos: tecnico sem atribuicao, OS de outro tecnico, transicao invalida e sessao revogada.
4. Executar em banco isolado e limpar fixtures; o teste nao deve depender de dados de desenvolvimento.

### 9.5 Homologacao funcional

1. Montar roteiro comparavel ao caminho feliz de `WORK_ORDER_FLOW.md` para os tres perfis.
2. Registrar cada divergencia entre CrewOps e FieldOps como preservar/redesenhar/adiar/descartar, com dono e aceite em `DECISION_LOG.md` ou documento de homologacao.
3. Nao considerar a homologacao aprovada enquanto a matriz de estados e permissoes tiver pendencias de produto/operacao.

### 9.6 Gate de fundacao

Executar e anexar evidencia dos comandos abaixo antes de marcar o grupo:

```bash
npm run lint
npm run typecheck
npm run test:unit -w @crewops/api
npm run test:integration -w @crewops/api
npm run test:unit -w @crewops/web
npm run test:e2e -w @crewops/web
npm run db:migrate:check
npm run build
```

O gate so passa se migrations, isolamento organizacional, sessao revogada e E2E da fatia estiverem verdes e nao houver defeito critico aberto.

## Criterio de conclusao

As tarefas 9.1-9.6 so podem ser marcadas com uma demonstracao repetivel do fluxo completo e evidencia automatizada. Qualquer falha de autorizacao horizontal, transicao sem evento, ou divergencia status/timeline bloqueia o Grupo 10.
