## ADDED Requirements

### Requirement: Processamento assincrono controlado

CrewOps SHALL executar tarefas demoradas ou sujeitas a retry fora da requisicao interativa, mantendo estado observavel do processamento.

#### Scenario: Job temporariamente indisponivel

- **WHEN** um job de upload, notificacao ou processamento falhar por causa transitoria
- **THEN** o sistema deve tentar novamente conforme politica limitada
- **AND** deve registrar tentativa, erro e estado final sem bloquear a acao original do tecnico

### Requirement: Atualizacao em primeiro plano

CrewOps SHALL usar canal em tempo quase real somente como acelerador de interface, nunca como unica fonte de consistencia.

#### Scenario: WebSocket desconectado

- **WHEN** o painel perder o canal WebSocket
- **THEN** operacoes confirmadas pela API devem continuar validas
- **AND** a interface deve conseguir reconciliar o estado por consulta posterior

### Requirement: Saude dos componentes

API, banco, Redis, filas e armazenamento de objetos SHALL expor sinais suficientes para diagnosticar indisponibilidade operacional.

#### Scenario: Redis indisponivel

- **WHEN** a API estiver acessivel mas Redis estiver indisponivel
- **THEN** o estado de saude deve indicar degradacao
- **AND** a API nao deve confirmar como enfileirada uma tarefa que nao foi persistida com seguranca

