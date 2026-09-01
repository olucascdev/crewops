## ADDED Requirements

### Requirement: Ciclo de upload verificavel

Cada evidencia SHALL possuir identificador idempotente e estado verificavel entre captura local, armazenamento de objetos e vinculo na OS.

#### Scenario: Upload concluido sem confirmacao

- **WHEN** o arquivo chegar ao S3/R2 mas o PWA perder conexao antes de confirmar
- **THEN** uma nova confirmacao com o mesmo identificador deve reutilizar o objeto existente
- **AND** nao deve criar evidencia duplicada

### Requirement: URL limitada

URLs pre-assinadas SHALL ser temporarias, limitadas ao objeto e operacao esperados e emitidas somente para usuario autorizado.

#### Scenario: URL expirada

- **WHEN** o PWA tentar usar uma URL expirada
- **THEN** deve solicitar nova autorizacao
- **AND** deve manter a evidencia local pendente sem perder seus metadados

### Requirement: Validacao da evidencia

CrewOps SHALL validar tipo, tamanho, integridade e vinculo operacional antes de marcar uma evidencia como disponivel.

#### Scenario: Arquivo fora da politica

- **WHEN** um arquivo exceder os limites ou tiver tipo nao aceito
- **THEN** o sistema deve rejeitar a confirmacao com motivo acionavel
- **AND** o painel nao deve apresenta-lo como evidencia valida

### Requirement: Objetos orfaos controlados

Objetos enviados mas nunca confirmados SHALL ser identificaveis e elegiveis para limpeza segura apos periodo definido.

#### Scenario: Upload abandonado

- **WHEN** um objeto pre-assinado permanecer sem confirmacao alem do periodo de retencao
- **THEN** um processo controlado deve poder remove-lo
- **AND** objetos vinculados a evidencias confirmadas nao devem ser afetados

