## ADDED Requirements

### Requirement: Maquina de estados explicita

CrewOps SHALL validar transicoes de status da OS de acordo com ator, estado atual e pre-condicoes operacionais.

#### Scenario: Transicao invalida

- **WHEN** um usuario ou evento tentar aplicar uma transicao nao permitida
- **THEN** a API deve rejeitar a mudanca com codigo de erro estavel
- **AND** o status atual e a timeline nao devem ser alterados

#### Scenario: Transicao valida

- **WHEN** uma transicao permitida for confirmada
- **THEN** a criacao do evento e a atualizacao do status atual devem ocorrer atomicamente

### Requirement: Localizacao por evento

CrewOps SHALL capturar localizacao no check-in, mudanca de status, evidencia e solicitacao manual quando o dispositivo permitir.

#### Scenario: GPS indisponivel

- **WHEN** uma acao operacional for registrada sem permissao ou leitura de GPS
- **THEN** a acao deve continuar quando localizacao nao for pre-condicao aprovada
- **AND** o evento deve indicar que nao houve coordenada, sem inventar posicao

#### Scenario: Ultima posicao conhecida

- **WHEN** o gestor visualizar um tecnico no mapa
- **THEN** o sistema deve mostrar horario, origem e precisao da ultima captura
- **AND** nao deve apresentar o ponto como rastreamento continuo em segundo plano

### Requirement: Finalizacao verificavel

CrewOps SHALL avaliar pre-condicoes de finalizacao antes de aceitar o evento de conclusao.

#### Scenario: Evidencia obrigatoria ainda local

- **WHEN** a evidencia obrigatoria tiver sido capturada localmente e o upload estiver pendente
- **THEN** o tecnico deve poder registrar a finalizacao local
- **AND** a OS deve permanecer sinalizada como sincronizacao ou evidencia pendente ate confirmacao do backend

### Requirement: Eventos imutaveis

Eventos operacionais confirmados SHALL ser preservados; correcoes devem ocorrer por novos eventos compensatorios ou administrativos.

#### Scenario: Gestor corrige informacao

- **WHEN** um gestor autorizado corrigir um evento incorreto
- **THEN** o sistema deve preservar o evento original
- **AND** registrar autor, motivo e relacao com a correcao

