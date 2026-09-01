## Purpose

Separar a identidade do cliente dos locais onde o atendimento acontece, permitindo historico, geocodificacao e multiplos enderecos sem duplicar clientes.

## ADDED Requirements

### Requirement: Cliente separado do endereco

CrewOps SHALL representar `customer` e `service_address` como conceitos independentes.

#### Scenario: Cliente com varios locais

- **WHEN** um cliente possuir mais de um ponto de atendimento
- **THEN** cada local deve existir como endereco separado vinculado ao mesmo cliente
- **AND** cada ticket e OS deve apontar para o endereco usado naquele atendimento

### Requirement: Dados operacionais do endereco

O endereco de atendimento SHALL armazenar dados postais, instrucoes de acesso e coordenadas quando disponiveis.

#### Scenario: OS aberta para endereco sem coordenadas

- **WHEN** uma OS for criada para um endereco ainda nao geocodificado
- **THEN** a criacao deve continuar permitida
- **AND** o mapa deve indicar que a localizacao do endereco esta indisponivel sem inventar coordenadas

### Requirement: Historico preservado

CrewOps SHALL preservar nos atendimentos concluidos a referencia e o contexto do endereco utilizados na execucao.

#### Scenario: Endereco do cliente alterado

- **WHEN** o cadastro atual do endereco mudar depois da finalizacao de uma OS
- **THEN** a prova de atendimento deve continuar apresentando os dados relevantes registrados na execucao

