## Purpose

Controlar a transferencia dos dados necessarios do FieldOps para o CrewOps com staging, reconciliacao, ensaios e rollback verificavel antes do desligamento do legado.

## ADDED Requirements

### Requirement: Importacao por staging

Dados do FieldOps SHALL entrar primeiro em estruturas de staging identificadas por execucao de importacao.

#### Scenario: Carga inicial

- **WHEN** uma carga do legado for executada
- **THEN** cada registro deve manter identificador de origem, lote, horario e resultado de validacao
- **AND** registros invalidos nao devem ser inseridos silenciosamente no modelo operacional final

### Requirement: Transformacao repetivel

A migracao SHALL ser idempotente e repetivel em homologacao.

#### Scenario: Mesmo lote reprocessado

- **WHEN** o mesmo lote for executado novamente
- **THEN** o processo nao deve duplicar clientes, usuarios, tickets, OS ou evidencias
- **AND** deve produzir relatorio das insercoes, atualizacoes, rejeicoes e divergencias

### Requirement: Reconciliacao obrigatoria

CrewOps SHALL comparar totais e amostras relevantes entre origem, staging e destino antes do corte.

#### Scenario: Divergencia acima do limite

- **WHEN** uma reconciliacao encontrar divergencia acima do limite aprovado
- **THEN** o corte deve ser bloqueado
- **AND** a divergencia deve ser classificada e resolvida ou formalmente aceita

### Requirement: Corte reversivel

O corte SHALL possuir criterios de entrada, periodo de estabilizacao e procedimento de rollback testado.

#### Scenario: Falha critica apos o corte

- **WHEN** uma falha critica afetar o fluxo operacional dentro da janela de estabilizacao
- **THEN** a equipe deve conseguir retornar a operacao ao plano de contingencia definido
- **AND** deve preservar os eventos criados no CrewOps para reconciliacao posterior

