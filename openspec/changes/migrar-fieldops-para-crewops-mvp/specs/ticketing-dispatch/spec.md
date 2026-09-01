## Purpose

Definir a passagem controlada entre solicitacao do cliente, execucao em campo e atribuicao do tecnico, mantendo responsabilidades e historicos separados.

## ADDED Requirements

### Requirement: Ticket nao e ordem de servico

CrewOps SHALL manter `ticket` como solicitacao e `work_order` como unidade de execucao em campo.

#### Scenario: Ticket exige visita

- **WHEN** um atendente identificar que um ticket exige atividade externa
- **THEN** o sistema deve permitir criar uma OS vinculada ao ticket
- **AND** o ticket deve continuar consultavel como origem da solicitacao

#### Scenario: OS sem ticket

- **WHEN** uma atividade preventiva ou interna nao nascer de solicitacao de cliente
- **THEN** um usuario autorizado deve poder criar a OS sem ticket

### Requirement: Despacho auditavel

CrewOps SHALL registrar atribuicao, reagendamento, desatribuicao e reatribuicao como eventos de despacho auditaveis.

#### Scenario: Reatribuicao de tecnico

- **WHEN** um despachante trocar o tecnico de uma OS
- **THEN** o sistema deve registrar tecnico anterior, tecnico novo, autor, horario e justificativa
- **AND** o novo tecnico deve receber a OS na proxima sincronizacao ou atualizacao online

### Requirement: Atribuicao valida

CrewOps SHALL impedir atribuicao para tecnico inativo ou fora do contexto organizacional autorizado.

#### Scenario: Tecnico indisponivel

- **WHEN** o despachante selecionar um tecnico marcado como indisponivel
- **THEN** o sistema deve exibir o impedimento ou exigir confirmacao autorizada conforme regra aprovada
- **AND** nunca deve atribuir silenciosamente ignorando a indisponibilidade

