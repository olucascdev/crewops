# Spec: Painel Operacional

## Requirements

### Requirement: Home como sala de operacao

O painel admin SHALL priorizar leitura rapida da operacao em campo, nao CRUD generico.

#### Scenario: Gestor abre o painel

- **WHEN** o gestor acessar a home
- **THEN** deve ver rapidamente OS abertas, OS atrasadas, tecnicos em campo, tecnicos parados, OS em execucao, tecnicos sem sincronizar e atendimentos finalizados hoje

### Requirement: Mapa por ultima posicao conhecida

O painel SHALL mostrar tecnicos e OS com base na ultima localizacao conhecida e eventos recentes.

#### Scenario: Tecnico sem sync recente

- **WHEN** um tecnico ficar muito tempo sem sincronizar
- **THEN** o painel deve destacar a ultima posicao conhecida
- **AND** deve mostrar o horario do ultimo evento/sync
- **AND** nao deve induzir o gestor a acreditar que a posicao e rastreamento continuo em tempo real

### Requirement: Eventos em tempo quase real

O painel SHALL usar WebSocket para atualizacoes operacionais enquanto o usuario estiver conectado.

#### Scenario: Status mudou em campo

- **WHEN** a API receber um evento novo de OS
- **THEN** deve publicar atualizacao para usuarios autorizados no painel
- **AND** a tela deve atualizar indicadores, timeline ou mapa conforme o evento

### Requirement: Foco do MVP

O dashboard do MVP SHALL focar OS, tecnicos, status, sync, mapa e finalizacoes.

#### Scenario: Ideia fora do MVP

- **WHEN** uma demanda envolver BI sofisticado, financeiro completo, estoque ou roteirizacao avancada
- **THEN** deve ser registrada como evolucao futura
- **AND** nao deve bloquear a entrega operacional inicial
