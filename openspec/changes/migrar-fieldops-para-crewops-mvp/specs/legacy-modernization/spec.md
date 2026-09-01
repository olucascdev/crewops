## ADDED Requirements

### Requirement: Gate funcional por dominio

Cada fatia de reconstrucao SHALL possuir inventario funcional aprovado antes do inicio da implementacao.

#### Scenario: Dominio pronto para desenvolvimento

- **WHEN** uma fatia entrar na fila de implementacao
- **THEN** devem estar identificados arquivos de origem, regras, atores, entradas, saidas, estados, excecoes, dados e lacunas
- **AND** cada regra essencial deve apontar para criterio de aceite ou teste planejado

### Requirement: Classificacao de comportamento legado

O inventario SHALL classificar cada comportamento como `preservar`, `redesenhar`, `adiar` ou `descartar`.

#### Scenario: Regra ambigua no PHP

- **WHEN** controller, model, SQL e interface apresentarem comportamentos divergentes
- **THEN** a divergencia deve ser registrada
- **AND** a decisao de produto deve ser tomada antes da reimplementacao correspondente

### Requirement: Rastreabilidade da reconstrucao

CrewOps SHALL manter rastreabilidade entre fonte legada, requisito novo, tarefa e teste.

#### Scenario: Regra questionada no piloto

- **WHEN** uma regra do CrewOps for contestada durante homologacao
- **THEN** a equipe deve conseguir localizar a evidencia no legado, a decisao adotada e os testes relacionados

