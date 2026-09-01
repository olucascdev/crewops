# Spec: Evidencias e Upload Resiliente

## Requirements

### Requirement: Upload preparado para internet ruim

CrewOps SHALL tratar fotos, assinaturas e anexos como evidencias com fila de upload.

#### Scenario: Foto capturada sem conexao boa

- **WHEN** o tecnico anexar uma foto em campo
- **THEN** o PWA deve comprimir a imagem antes de enviar quando tecnicamente possivel
- **AND** deve salvar a evidencia localmente se o upload nao puder concluir
- **AND** deve marcar o item como `pending_upload`, `uploaded` ou `failed`

### Requirement: URL pre-assinada

A API SHALL gerar URLs pre-assinadas para envio de evidencias ao S3/R2.

#### Scenario: Upload online

- **WHEN** o PWA tiver uma evidencia pronta para envio
- **THEN** deve solicitar uma URL pre-assinada para a API
- **AND** deve enviar o arquivo diretamente ao S3/R2
- **AND** deve confirmar o upload para vincular o arquivo a OS e timeline

### Requirement: Finalizacao nao bloqueada por upload lento

CrewOps SHALL permitir finalizar a OS quando a evidencia obrigatoria ja foi capturada localmente, mesmo que o upload ainda esteja pendente.

#### Scenario: Internet ruim no encerramento

- **WHEN** o tecnico finalizar uma OS com foto/assinatura capturada localmente
- **AND** o upload ainda estiver pendente
- **THEN** a OS deve registrar a finalizacao como evento pendente de sincronizacao ou sincronizado parcialmente
- **AND** o painel deve sinalizar evidencia pendente ate a conclusao do upload

### Requirement: Retry seguro

Uploads SHALL ter retry manual e automatico sem duplicar evidencia.

#### Scenario: Reenvio da mesma foto

- **WHEN** o PWA tentar reenviar uma evidencia apos falha
- **THEN** deve preservar o identificador local/idempotente
- **AND** a API deve impedir registros duplicados para o mesmo arquivo/evento
