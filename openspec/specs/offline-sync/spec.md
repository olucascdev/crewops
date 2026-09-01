# Spec: Offline e Sincronizacao Local-First

## Requirements

### Requirement: PWA local-first para tecnico

O PWA do tecnico SHALL registrar acoes criticas localmente antes de depender da internet.

#### Scenario: Tecnico sem sinal

- **WHEN** o tecnico executar uma acao sem conexao
- **THEN** o PWA deve salvar a acao no IndexedDB/Dexie
- **AND** deve mostrar estado pendente de sincronizacao
- **AND** nao deve perder a acao ao recarregar o app

### Requirement: Dados locais essenciais

O PWA SHALL manter dados essenciais em IndexedDB/Dexie para operacao em campo.

#### Scenario: Cache operacional

- **WHEN** o tecnico sincronizar suas tarefas
- **THEN** o PWA deve armazenar OS baixadas, dados do cliente/endereco, acoes pendentes, fotos pendentes, assinatura pendente e localizacoes pendentes

### Requirement: Eventos locais

Toda acao operacional do tecnico SHALL virar evento local antes do envio ao backend.

#### Scenario: Tipos de eventos locais

- **WHEN** o tecnico fizer check-in, alterar status, anexar foto, coletar assinatura, adicionar nota ou capturar localizacao
- **THEN** o PWA deve criar eventos como `technician_checked_in`, `work_order_status_changed`, `photo_added`, `signature_collected`, `note_added` ou `location_captured`
- **AND** cada evento deve ter `idempotency_key`

### Requirement: Sync idempotente

A API SHALL aceitar sincronizacao idempotente para evitar duplicidade.

#### Scenario: Reenvio apos falha

- **WHEN** o PWA reenviar um evento com a mesma `idempotency_key`
- **THEN** a API deve retornar o resultado ja processado ou ignorar duplicidade de forma segura
- **AND** nao deve criar dois eventos operacionais iguais

### Requirement: Estado de sincronizacao visivel

O PWA SHALL mostrar ao tecnico quando ha itens pendentes, enviados ou com erro.

#### Scenario: Falha de sync

- **WHEN** uma sincronizacao falhar
- **THEN** o PWA deve manter o item como pendente ou falho
- **AND** deve permitir retry automatico e manual conforme o tipo de falha
