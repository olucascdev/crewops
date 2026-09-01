## Purpose

Definir autenticacao, sessao e autorizacao operacional simples para proteger o painel e o PWA sem introduzir um modelo de permissoes excessivamente complexo no MVP.

## ADDED Requirements

### Requirement: Autenticacao separada por experiencia

CrewOps SHALL autenticar usuarios do painel e tecnicos do PWA com sessao revogavel e identidade unica.

#### Scenario: Usuario entra no produto

- **WHEN** um usuario fornecer credenciais validas
- **THEN** o sistema deve criar uma sessao associada ao usuario, empresa, filial e perfil
- **AND** deve direcionar `tecnico` para a experiencia de campo e os demais perfis para o painel autorizado

#### Scenario: Sessao revogada

- **WHEN** um administrador revogar uma sessao ou desativar o usuario
- **THEN** novas chamadas autenticadas dessa sessao devem ser recusadas
- **AND** dados locais protegidos devem exigir nova autenticacao antes de serem exibidos

### Requirement: Perfis operacionais do MVP

CrewOps SHALL limitar o MVP aos perfis `admin`, `gestor_operacional`, `atendente`, `despachante` e `tecnico`.

#### Scenario: Acao protegida

- **WHEN** um usuario tentar executar uma acao operacional
- **THEN** a API deve validar o perfil no servidor
- **AND** ocultar um controle na interface nao deve ser considerado autorizacao suficiente

### Requirement: Restricao do tecnico

CrewOps SHALL permitir que o tecnico altere somente ordens atribuidas a ele e dentro das transicoes autorizadas.

#### Scenario: Tecnico acessa OS de outro tecnico

- **WHEN** um tecnico tentar consultar ou alterar uma OS que nao esta atribuida a ele
- **THEN** a API deve negar a operacao
- **AND** deve registrar a tentativa conforme a politica de auditoria

