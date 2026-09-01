## Purpose

Representar uma empresa piloto com multiplas filiais e manter todo dado operacional associado ao contexto organizacional correto desde o inicio.

## ADDED Requirements

### Requirement: Empresa piloto e filiais

CrewOps SHALL suportar uma empresa ativa com uma ou mais filiais no MVP.

#### Scenario: Cadastro de filial

- **WHEN** um administrador criar uma filial
- **THEN** o sistema deve registrar nome, codigo, status, fuso horario e endereco operacional
- **AND** o codigo deve ser unico dentro da empresa

### Requirement: Escopo organizacional

CrewOps SHALL associar usuarios, tecnicos, clientes, enderecos, tickets, OS e eventos a empresa e, quando aplicavel, a uma filial.

#### Scenario: Consulta por filial

- **WHEN** um gestor filtrar a operacao por filial
- **THEN** indicadores, lista, mapa e timeline devem usar o mesmo escopo
- **AND** dados fora do escopo autorizado nao devem ser retornados

### Requirement: Contexto explicito na auditoria

Eventos e registros de auditoria SHALL preservar o contexto organizacional que existia no momento da acao.

#### Scenario: Tecnico muda de filial

- **WHEN** um tecnico for movido para outra filial depois de executar uma OS
- **THEN** o historico anterior deve continuar associado a filial original da execucao

