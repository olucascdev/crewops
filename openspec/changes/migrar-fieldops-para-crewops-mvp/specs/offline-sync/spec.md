## ADDED Requirements

### Requirement: Confirmacao individual por evento

A sincronizacao SHALL retornar resultado individual para cada item enviado pelo PWA.

#### Scenario: Lote parcialmente valido

- **WHEN** um lote contiver eventos validos, duplicados e invalidos
- **THEN** a API deve confirmar separadamente cada item como aplicado, ja processado, rejeitado ou conflitante
- **AND** o PWA deve remover da fila somente itens confirmados com seguranca

### Requirement: Ordem e dependencia local

O PWA SHALL preservar dependencias entre eventos relacionados da mesma OS.

#### Scenario: Foto depende de evento local

- **WHEN** uma foto estiver vinculada a uma acao ainda nao reconhecida pelo backend
- **THEN** a sincronizacao deve resolver primeiro a referencia necessaria
- **AND** nao deve descartar a foto por identificador remoto ainda inexistente

### Requirement: Conflito explicito

CrewOps SHALL detectar conflitos que nao podem ser resolvidos automaticamente sem perder intencao operacional.

#### Scenario: OS reatribuida enquanto tecnico estava offline

- **WHEN** o tecnico enviar uma mudanca feita offline para uma OS reatribuida pela central
- **THEN** a API deve classificar o conflito sem sobrescrever silenciosamente o estado atual
- **AND** o tecnico e a operacao devem receber orientacao de resolucao

### Requirement: Protecao contra pressao de armazenamento

O PWA SHALL avisar quando armazenamento local ou cota do navegador colocar dados pendentes em risco.

#### Scenario: Espaco insuficiente para nova foto

- **WHEN** o dispositivo nao conseguir persistir uma evidencia com seguranca
- **THEN** o PWA deve informar a falha antes de considerar a captura concluida
- **AND** deve preservar os itens pendentes existentes

