# Mapa de Referencia do Legado PHP

Este documento aponta onde procurar conhecimento funcional no FieldOps atual. Ele nao define que a implementacao nova deve copiar a estrutura antiga.

## Modulos Encontrados

Pelo nome dos controllers, models, migrations e views, o legado possui:

- autenticacao e usuarios;
- RBAC/perfis;
- auditoria;
- tenants/SaaS;
- clientes;
- sites/enderecos;
- chamados/tickets;
- ordens de servico;
- despacho e formularios de execucao;
- evidencias;
- app do tecnico;
- sync mobile;
- mapa operacional;
- notificacoes e push;
- financeiro;
- contratos/SLA;
- BI;
- integracoes e webhooks;
- kiosk/live ops;
- central de ajuda.

## Areas Prioritarias Para Extrair Regras

### Ordem de Servico

Arquivos:

- `app/Controllers/Admin/WorkOrderController.php`;
- `app/Models/WorkOrder.php`;
- `app/Models/WorkOrderEvidence.php`;
- `resources/views/admin/work_orders/index.php`;
- `resources/views/admin/work_orders/board.php`;
- `resources/views/admin/work_orders/agenda.php`;
- `resources/views/admin/work_orders/form.php`;
- `resources/views/admin/work_orders/show.php`;
- `resources/views/app/work_orders/show.php`.

Extrair:

- criacao;
- atribuicao;
- status permitidos;
- transicoes bloqueadas;
- regras do tecnico;
- campos obrigatorios;
- evidencias obrigatorias;
- finalizacao;
- reabertura;
- SLA/atraso;
- auditoria.

### Chamados/Tickets

Arquivos:

- `app/Controllers/Admin/TicketController.php`;
- `app/Models/Ticket.php`;
- `resources/views/admin/tickets/*`;
- `resources/views/app/tickets/*`.

Extrair:

- diferenca entre ticket e OS;
- quando ticket gera OS;
- prioridades;
- status;
- vinculo com cliente/endereco.

### Tecnicos

Arquivos:

- `app/Controllers/Admin/TechnicianController.php`;
- `app/Models/TechnicianProfile.php`;
- `app/Models/TechnicianAvailability.php`;
- `app/Models/TechnicianTeam.php`;
- `resources/views/admin/technicians/*`.

Extrair:

- disponibilidade;
- equipes;
- compliance;
- documentos;
- regras de visibilidade;
- relacao tecnico/usuario.

### Mapa e Localizacao

Arquivos:

- `app/Controllers/Admin/MapOpsController.php`;
- `resources/views/admin/map/index.php`;
- `database/migrations/039_mapops_bi_whitelabel_v088.sql`;
- `database/migrations/040_mapops_live_technician_position_v088r1.sql`.

Extrair:

- como o legado mostra mapa;
- quais pontos usa;
- diferenca entre ultima posicao e tempo real;
- regras de stale/offline;
- filtros por filial/status.

### Sync Mobile

Arquivos:

- `database/migrations/011_mobile_sync_compat_v032c.sql`;
- `resources/views/app/sync/index.php`;
- controllers do app em `app/Controllers/App`.

Extrair:

- entidades sincronizadas;
- conflitos conhecidos;
- estados pendentes;
- mensagens para tecnico;
- erros frequentes.

## Tabelas Legadas Relevantes

Comecar pelas migrations:

- `007_create_tickets_work_orders.sql`;
- `009_dispatch_forms_v022.sql`;
- `010_execution_evidence_v023.sql`;
- `011_mobile_sync_compat_v032c.sql`;
- `036_ops_visibility_upgrade_v085.sql`;
- `037_field_intake_documents_v086.sql`;
- `038_quality_rework_dispatch_board_v087.sql`;
- `039_mapops_bi_whitelabel_v088.sql`;
- `040_mapops_live_technician_position_v088r1.sql`;
- `041_pwa_push_web_v089.sql`.

## Como Usar Este Mapa

Para cada modulo novo do CrewOps:

1. Ler controller, model, view e migration equivalentes no PHP.
2. Anotar regra funcional em PT-BR.
3. Separar regra essencial de comportamento acidental do legado.
4. Criar ou atualizar spec OpenSpec.
5. Implementar no NestJS/Next.js com teste.
