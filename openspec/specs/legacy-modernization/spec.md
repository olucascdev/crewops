# Spec: Modernizacao do Legado FieldOps

## Requirements

### Requirement: Migrar conhecimento, nao codigo

CrewOps SHALL usar o FieldOps PHP como referencia funcional e nao como base para conversao direta de arquivos.

#### Scenario: Analise de funcionalidade legada

- **WHEN** uma funcionalidade existente no PHP for reconstruida
- **THEN** a equipe deve extrair regras de negocio, entidades, fluxos, permissoes, validacoes e relatorios relevantes
- **AND** deve documentar o comportamento esperado antes de reimplementar
- **AND** nao deve copiar a estrutura controller/view/model antiga sem avaliar o dominio novo

### Requirement: Documentacao intermediaria

CrewOps SHALL manter documentos de apoio para impedir perda de regra de negocio durante a reconstrucao.

#### Scenario: Antes de implementar OS

- **WHEN** o dominio de ordem de servico for priorizado
- **THEN** devem existir notas sobre criacao, atribuicao, status, tecnico, cliente, evidencias, finalizacao, relatorios e auditoria
- **AND** as divergencias entre legado e modelo novo devem ficar explicitas

### Requirement: Reimplementacao por fatia vertical

CrewOps SHALL evoluir por fluxos completos de usuario, nao por camadas isoladas.

#### Scenario: Primeira fatia operacional

- **WHEN** o MVP iniciar
- **THEN** a primeira fatia deve cobrir login, listagem de OS do tecnico, abertura de OS, mudanca de status, persistencia de evento e reflexo no painel admin
- **AND** essa fatia deve ter testes basicos de regra e contrato

### Requirement: Migracao de dados posterior ao MVP

CrewOps SHALL adiar a migracao completa de dados historicos ate existir MVP funcional validado.

#### Scenario: Importacao do legado

- **WHEN** dados do MySQL/PHP forem migrados
- **THEN** eles devem passar por tabelas de staging como `legacy_customers`, `legacy_orders` e `legacy_users`
- **AND** devem ser transformados para o modelo novo antes de entrar nas tabelas finais
