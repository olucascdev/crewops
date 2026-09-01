# Spec: Operacao de Campo e Timeline

## Requirements

### Requirement: Separar chamado de ordem de servico

CrewOps SHALL separar solicitacao do cliente de execucao em campo.

#### Scenario: Ticket vira OS

- **WHEN** um atendimento precisar de execucao externa
- **THEN** o sistema deve representar a solicitacao como `ticket`
- **AND** a execucao como `work_order`
- **AND** a atribuicao/agendamento como `dispatch` ou registro equivalente de despacho

### Requirement: Timeline por eventos

CrewOps SHALL registrar a verdade operacional em eventos de ordem de servico.

#### Scenario: Tecnico muda status

- **WHEN** um tecnico alterar o status da OS
- **THEN** o sistema deve criar um evento `work_order_status_changed`
- **AND** deve registrar `work_order_id`, `technician_id`, `event_type`, `payload`, horario, origem e localizacao quando disponivel
- **AND** deve atualizar o status atual da OS como resumo operacional

### Requirement: Eventos auditaveis

Eventos de OS SHALL permitir auditoria, relatorios, mapa, prova de atendimento e debugging de sincronizacao.

#### Scenario: Consulta da OS

- **WHEN** um gestor abrir uma OS
- **THEN** deve visualizar a timeline com status, notas, fotos, assinatura, localizacoes e horarios relevantes
- **AND** deve ser possivel identificar eventos criados offline e sincronizados depois

### Requirement: Perfis simples no MVP

CrewOps SHALL iniciar com perfis simples de operacao.

#### Scenario: Controle de acesso inicial

- **WHEN** um usuario acessar o sistema
- **THEN** seu perfil deve ser um entre admin, gestor_operacional, atendente, despachante ou tecnico
- **AND** permissoes mais granulares devem ficar fora do MVP salvo necessidade comprovada
