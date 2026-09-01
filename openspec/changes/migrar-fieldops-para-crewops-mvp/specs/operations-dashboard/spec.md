## ADDED Requirements

### Requirement: Recencia operacional explicita

O painel SHALL classificar a ultima sincronizacao e a ultima localizacao por faixas de recencia configuradas para a operacao.

#### Scenario: Posicao antiga

- **WHEN** a ultima localizacao ultrapassar o limite de recencia
- **THEN** o marcador deve ser apresentado como desatualizado
- **AND** o horario exato da captura deve permanecer visivel

### Requirement: Indicadores rastreaveis

Cada indicador da sala de operacao SHALL permitir chegar aos registros que formam seu total.

#### Scenario: Gestor abre OS atrasadas

- **WHEN** o gestor selecionar o indicador de OS atrasadas
- **THEN** o painel deve exibir a lista filtrada pela mesma definicao usada no total

### Requirement: Falha de sincronizacao acionavel

O painel SHALL destacar tecnicos e OS com fila pendente ou sem sincronizacao alem do limite operacional.

#### Scenario: Tecnico sem sincronizar

- **WHEN** um tecnico permanecer sem sincronizar alem do limite
- **THEN** o gestor deve ver tecnico, ultima sincronizacao, ultima posicao conhecida e OS atual
- **AND** a interface deve distinguir falta de sync de ausencia de trabalho atribuido

### Requirement: Consistencia apos reconexao

O painel SHALL reconciliar seu estado completo depois de perder e recuperar atualizacoes em primeiro plano.

#### Scenario: Reconexao do painel

- **WHEN** o WebSocket reconectar apos interrupcao
- **THEN** a tela deve buscar ou receber o estado necessario para corrigir eventos possivelmente perdidos
- **AND** nao deve depender somente das mensagens recebidas durante a sessao
