# Estrategia de Migracao: FieldOps PHP para CrewOps

## Direcao Principal

A estrategia correta e nao tentar converter o PHP puro para Next.js/NestJS. Isso tende a carregar a bagunca tecnica antiga para dentro da stack nova.

O FieldOps deve ser usado como fonte de verdade funcional. O CrewOps deve ser reconstruido por dominio, preservando regras importantes e melhorando arquitetura, offline, auditoria e experiencia operacional.

## Fase 1 - Entendimento do Legado

Objetivo: extrair conhecimento antes de codar.

Mapear no PHP atual:

- modulos existentes;
- tabelas principais;
- fluxos de chamados e OS;
- regras de status;
- permissoes;
- queries criticas;
- telas mais importantes;
- regras escondidas em controllers, views e models;
- problemas tecnicos;
- comportamento que precisa continuar existindo no CrewOps.

Arquivos do legado que merecem atencao inicial:

- `app/Controllers/Admin/WorkOrderController.php`;
- `app/Controllers/Admin/TicketController.php`;
- `app/Controllers/Admin/TechnicianController.php`;
- `app/Controllers/Admin/MapOpsController.php`;
- `app/Models/WorkOrder.php`;
- `app/Models/WorkOrderEvidence.php`;
- `database/migrations/007_create_tickets_work_orders.sql`;
- `database/migrations/010_execution_evidence_v023.sql`;
- `database/migrations/011_mobile_sync_compat_v032c.sql`;
- `database/migrations/039_mapops_bi_whitelabel_v088.sql`;
- `database/migrations/040_mapops_live_technician_position_v088r1.sql`;
- `resources/views/admin/work_orders/*`;
- `resources/views/app/work_orders/show.php`;
- `resources/views/app/sync/index.php`.

## Fase 2 - Documentacao Intermediaria

Antes de implementar de verdade, manter documentos em `crewops/docs` e specs em `crewops/openspec/specs`.

Documentos essenciais:

- `LEGACY_REFERENCE_MAP.md`: mapa funcional do PHP legado.
- `BUSINESS_RULES.md`: regras de negocio extraidas.
- `WORK_ORDER_FLOW.md`: fluxo de OS ponta a ponta.
- `DATABASE_MAP.md`: equivalencia entre tabelas antigas e novas.
- `MVP_SCOPE.md`: o que entra e o que fica fora.
- `API_CONTRACT.md`: contrato entre PWA e API.
- `OFFLINE_SYNC_STRATEGY.md`: regras de offline, sync e idempotencia.

## Fase 3 - MVP Operacional Novo

Construir CrewOps com foco em OS e tecnico:

1. Auth, usuarios e perfis simples.
2. Empresa, filiais e tecnicos.
3. Clientes e enderecos.
4. Criacao de OS no painel.
5. Atribuicao de OS para tecnico.
6. Tecnico ve OS no PWA.
7. Tecnico muda status.
8. Timeline da OS.
9. Localizacao por evento.
10. Foto/evidencia.
11. Assinatura.
12. Offline/sync.
13. Mapa admin.
14. Dashboard basico.
15. Relatorios simples.

Primeira fatia vertical recomendada:

```txt
Login -> listar OS do tecnico -> abrir OS -> mudar status -> salvar evento -> aparecer no painel admin
```

## Fase 4 - Offline e Sync de Verdade

Offline nao pode ser remendo.

No PWA, usar IndexedDB + Dexie para:

- OS baixadas;
- dados do cliente/endereco;
- acoes pendentes;
- fotos pendentes;
- assinatura pendente;
- localizacoes pendentes.

Regra de ouro:

```txt
O botao do tecnico nunca deve depender 100% da internet para registrar a acao.
```

Se estiver sem sinal, salva local e mostra pendente de sincronizacao.

## Fase 5 - Migracao de Dados

So migrar dados historicos depois do MVP funcional.

Fluxo recomendado:

```txt
MySQL FieldOps -> staging tables -> transformacao -> PostgreSQL CrewOps
```

Exemplos de staging:

- `legacy_customers`;
- `legacy_orders`;
- `legacy_users`;
- `legacy_evidences`;
- `legacy_tickets`.

Nao jogar dados legados direto no modelo final sem limpeza e transformacao.

## Nao Fazer no MVP

- multiempresa/SaaS completo;
- financeiro completo;
- estoque;
- roteirizacao avancada;
- chat interno;
- BI sofisticado;
- permissoes super complexas;
- app nativo antes de validar;
- microservicos;
- Kubernetes;
- Kafka;
- CQRS pesado.
