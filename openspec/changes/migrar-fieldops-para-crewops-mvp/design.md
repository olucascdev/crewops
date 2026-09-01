## Context

Ver `proposal.md` para motivacao e escopo. O repositorio possui um FieldOps PHP funcional e um monorepo CrewOps inicial. O legado concentra regras em controllers, models, views, migrations e SQL; por isso, a unidade de migracao sera a fatia funcional, nao o arquivo PHP.

As restricoes que moldam o desenho sao:

- internet de campo e intermitente;
- PWA nao garante GPS continuo em segundo plano ou com tela bloqueada;
- fotos e assinaturas podem ser grandes e demoradas;
- timeline, auditoria e idempotencia precisam nascer com o produto;
- o MVP atende uma empresa piloto com varias filiais;
- uma unica API modular e suficiente;
- o FieldOps precisa continuar disponivel durante construcao, piloto e estabilizacao.

## Goals / Non-Goals

**Goals:**

- entregar o fluxo de OS ponta a ponta em fatias verticais testaveis;
- preservar regras essenciais do legado com rastreabilidade;
- manter acoes do tecnico registraveis sem rede;
- separar estado atual da OS de seu historico operacional;
- permitir evolucao futura para app nativo sem descartar contratos de evento;
- tornar corte e rollback mensuraveis e ensaiaveis.

**Non-Goals:**

- reproduzir toda tela, tabela ou comportamento acidental do PHP;
- criar microservicos ou uma plataforma SaaS completa no MVP;
- usar WebSocket como fonte primaria de consistencia;
- fazer event sourcing completo ou CQRS pesado;
- migrar todo historico antes de validar o produto;
- prometer rastreamento GPS continuo pelo PWA.

## Decisions

### 1. Reconstrucao por fatias com gate de conhecimento

Cada fatia segue este fluxo:

```txt
localizar fontes no PHP
  -> extrair comportamento e dados
  -> classificar preservar/redesenhar/adiar/descartar
  -> aprovar requisito e criterio de aceite
  -> implementar API + banco + interface + teste
  -> homologar contra cenarios do legado
```

O inventario minimo de uma fatia inclui atores, pre-condicoes, entradas, saidas, estados, excecoes, permissoes, SQL relevante, relatorios afetados e exemplos reais.

Alternativa considerada: converter models/controllers PHP para TypeScript. Rejeitada porque transportaria acoplamento, nomes e comportamentos acidentais sem garantir equivalencia funcional.

### 2. Monorepo TypeScript e monolito modular

Responsabilidades:

- `apps/web`: Next.js App Router, painel e PWA do tecnico;
- `apps/api`: NestJS com modulos de dominio e adaptadores de infraestrutura;
- `packages/db`: schema Drizzle, migrations e consultas compartilhadas da API;
- `packages/shared`: contratos serializaveis, enums, schemas e codigos de erro;
- PostgreSQL/PostGIS: fonte de verdade persistente;
- Redis/BullMQ: filas, retries, tarefas agendadas, locks curtos e fan-out;
- S3/R2: bytes de evidencias;
- WebSocket: notificacao de mudancas para clientes conectados.

Os modulos iniciais da API serao `auth`, `organizations`, `users`, `technicians`, `customers`, `tickets`, `work-orders`, `dispatch`, `field-events`, `locations`, `evidence`, `sync`, `realtime`, `reports` e `audit`.

Alternativa considerada: microservicos por dominio. Rejeitada por elevar custo de consistencia, deploy e observabilidade antes de existir volume medido.

### 3. Modelo de dados operacional

Entidades principais:

| Entidade | Responsabilidade |
| --- | --- |
| `companies` | empresa piloto e configuracoes globais |
| `branches` | filial, fuso e contexto operacional |
| `users` / `roles` | identidade e perfil simples |
| `technicians` | vinculo de campo, disponibilidade e usuario |
| `customers` | identidade do cliente |
| `service_addresses` | local de atendimento e geometria |
| `tickets` | solicitacao/problema |
| `work_orders` | unidade de execucao e estado atual |
| `dispatches` | atribuicao e agendamento vigentes/historicos |
| `work_order_events` | verdade operacional imutavel |
| `technician_locations` | pontos capturados e contexto do evento |
| `evidences` | metadados, estado e referencia ao objeto |
| `audit_logs` | acoes administrativas e de seguranca |
| `sync_receipts` | idempotencia e resultado processado |

Chaves de negocio e restricoes devem impedir duplicidade por empresa. Todas as tabelas operacionais terao identificadores gerados no cliente ou compativeis com criacao offline quando necessario, timestamps em UTC e contexto de empresa/filial.

PostGIS sera usado para pontos e consultas geograficas reais. Latitude/longitude numericas podem ser mantidas no payload/evento para interoperabilidade, mas consultas espaciais usam coluna `geometry(Point, 4326)` ou `geography(Point, 4326)` definida durante o desenho do schema.

### 4. Eventos como verdade operacional, status como projecao atual

`work_order_events` armazena pelo menos:

```txt
id
company_id
branch_id
work_order_id
technician_id
actor_user_id
event_type
payload
idempotency_key
occurred_at
received_at
created_offline
device_id
lat / lng / accuracy
```

O status atual permanece em `work_orders.status` para listagens e indicadores. Na mesma transacao que aceita um evento de transicao, a API insere o evento e atualiza o resumo atual. Eventos confirmados nao sao editados; correcao gera evento compensatorio.

Isto nao e event sourcing completo: cadastros e consultas usam tabelas relacionais normais, e apenas o historico operacional critico e orientado a eventos.

Alternativa considerada: atualizar apenas `work_orders.status` e registrar log generico. Rejeitada porque nao atende offline, prova de atendimento, auditoria e debugging de sincronizacao.

### 5. Maquina de estados centralizada

A lista final de estados sera fechada apos extracao das regras do PHP. A base de trabalho observada no legado inclui `pending`, `scheduled`, `dispatched`, `in_progress`, `waiting_evidence`, `in_validation`, `waiting_parts`, `completed`, `cancelled` e `rework`.

A API possui uma politica unica que recebe estado atual, evento pretendido, ator e contexto. Interface e PWA consomem as transicoes permitidas, mas a validacao autoritativa ocorre no servidor.

As pre-condicoes de finalizacao distinguem:

- evidencia nao capturada: bloqueio funcional quando obrigatoria;
- evidencia capturada localmente e ainda nao enviada: permite acao local, sinaliza pendencia;
- evento de conclusao recebido antes do upload: aceita conforme contrato e mantem alerta;
- upload definitivamente rejeitado: exige correcao antes da validacao final administrativa, se aplicavel.

### 6. PWA local-first com outbox Dexie

O banco local sera versionado e tera stores conceituais para:

- `workOrders`, `customers`, `serviceAddresses` e dados de referencia;
- `outboxEvents` com estado, tentativa, erro e dependencia;
- `pendingEvidence` com Blob, miniatura e metadados;
- `syncState` com cursor, ultima execucao e identidade do dispositivo.

Fluxo de uma acao:

```txt
toque do tecnico
  -> validar dados disponiveis localmente
  -> capturar localizacao quando aplicavel
  -> gravar evento na outbox em uma transacao local
  -> atualizar a projecao local da tela
  -> tentar sincronizar
  -> receber resultado individual
  -> confirmar, manter para retry ou abrir conflito
```

O Service Worker cuida do shell e ativos estaticos. Nao se assume que Background Sync estara sempre disponivel; sincronizacao tambem ocorre ao abrir o app, recuperar conectividade, voltar ao primeiro plano e por comando manual.

Alternativa considerada: gravar diretamente na API e adicionar cache depois. Rejeitada porque o comportamento do botao mudaria de acordo com a rede e offline viraria uma reescrita.

### 7. Protocolo de sincronizacao idempotente

Cada evento recebe UUID e `idempotency_key` no dispositivo. A API processa um lote, mas responde por item:

```txt
applied       -> evento novo confirmado
already_done  -> chave ja processada; retorna o mesmo resultado
rejected      -> erro permanente e acionavel
conflict      -> exige resolucao ou decisao explicita
retry_later   -> falha transitoria; item permanece na outbox
```

O recibo idempotente e a alteracao de dominio pertencem a mesma transacao. A ordem logica usa `occurred_at`, sequencia local e dependencias, mas `received_at` preserva quando o backend recebeu o item.

Conflitos nao sao resolvidos por "ultimo envio vence" de forma generica. Regras por evento definem quando aceitar, rejeitar ou encaminhar para operacao. Exemplo: nota pode ser aditiva; conclusao de OS cancelada ou reatribuida exige conflito explicito.

### 8. Evidencias com upload direto e confirmacao em duas etapas

Fluxo:

```txt
capturar -> comprimir -> persistir Blob local -> criar registro pendente
-> pedir URL pre-assinada -> enviar direto ao S3/R2
-> confirmar hash/tamanho/chave -> vincular evidencia -> publicar evento
```

A chave do objeto deriva de empresa, OS e identificador idempotente, sem confiar em nome enviado pelo usuario. URLs possuem prazo curto e restricoes de tipo/tamanho. Confirmacao repetida devolve o mesmo resultado. Job remove apenas objetos nao confirmados apos janela de retencao.

Compressao ocorre antes da fila, respeitando orientacao EXIF e limites aprovados. O PWA mostra progresso, erro e retry manual. Finalizar a OS nao espera a transferencia terminar quando a evidencia ja esta salva localmente, mas o painel mostra a pendencia ate confirmacao.

Alternativa considerada: multipart para a API NestJS. Rejeitada para fotos de campo porque aumenta consumo da API e torna retries mais caros.

### 9. Localizacao por evento e ultima posicao conhecida

O PWA solicita coordenada em momentos operacionais: check-in, inicio, mudanca de status relevante, evidencia, finalizacao e ping manual. Captura periodica pode ocorrer apenas enquanto o app estiver aberto e em uso, respeitando permissao, bateria e configuracao.

Cada ponto registra origem, precisao, horario do dispositivo e horario de recebimento. O painel sempre exibe recencia. Nenhum texto ou indicador deve sugerir GPS continuo quando a ultima captura e antiga.

Se rastreamento continuo com tela bloqueada virar requisito obrigatorio, sera criada iniciativa separada para app nativo/Expo, reutilizando API e modelo de eventos quando adequado.

### 10. Realtime como invalidacao e notificacao

Depois do commit no PostgreSQL, a API publica um evento interno/outbox para distribuicao. BullMQ processa efeitos assincronos; Redis distribui mensagens entre instancias; WebSocket avisa clientes autorizados.

Mensagens carregam identificador e versao/cursor suficientes para a interface buscar estado canonico. Ao reconectar, o painel executa reconciliacao. Assim, perda de uma mensagem nao causa perda de dado.

Alternativa considerada: atualizar o dashboard apenas por WebSocket. Rejeitada porque conexoes sao transitorias.

### 11. Seguranca e privacidade

- autorizacao e aplicada na API por empresa, filial, perfil e recurso;
- tecnico acessa somente OS atribuidas conforme regra aprovada;
- tokens/sessoes sao revogaveis e segredos ficam fora do repositorio;
- URLs pre-assinadas tem menor privilegio e expiracao curta;
- evidencias nao sao publicas por padrao;
- logs evitam bytes, assinatura, tokens e dados sensiveis desnecessarios;
- dados locais do PWA sao limpos no logout, troca de usuario ou revogacao conforme politica;
- eventos administrativos e tentativas negadas relevantes geram auditoria.

### 12. Observabilidade operacional

Metricas minimas:

- eventos aplicados, duplicados, rejeitados e conflitantes;
- tamanho e idade da outbox por tecnico/dispositivo quando reportado;
- tempo desde ultimo sync e ultima localizacao;
- uploads pendentes, falhos, tempo e volume;
- jobs prontos, ativos, repetidos e mortos;
- latencia/erro da API e conexoes WebSocket;
- OS abertas, atrasadas, em execucao e concluidas.

Logs usam IDs de correlacao para requisicao, lote, evento, OS, dispositivo e job. Alertas devem ser acionaveis e distinguir indisponibilidade de Redis, S3/R2, banco e cliente offline.

### 13. Estrategia de testes

- unitarios: maquina de estados, permissoes, classificacao de conflito e mapeamentos;
- integracao: transacao evento/status/recibo, PostGIS, filas, URL pre-assinada e queries do dashboard;
- contrato: DTOs PWA/API e resultados por item;
- PWA: Dexie, reload, falta de rede, retomada, cota e dependencias da outbox;
- end-to-end: criar, despachar, executar offline, reconectar, subir evidencia e refletir no painel;
- migracao: idempotencia, contagens, amostras, dados invalidos e reprocessamento;
- resiliencia: Redis/S3 indisponivel, WebSocket interrompido e upload confirmado sem ACK.

## Risks / Trade-offs

- [Extracao incompleta do PHP] -> exigir gate funcional, amostras reais e homologacao por dominio.
- [Modelo de estados definido cedo demais] -> fechar transicoes somente apos matriz do legado e decisao de produto.
- [IndexedDB pode ser removido pelo navegador] -> solicitar armazenamento persistente quando suportado, monitorar cota e comunicar pendencias; nao afirmar durabilidade absoluta.
- [Fotos pressionam memoria e armazenamento] -> compressao antes da fila, limites, miniaturas e feedback de cota.
- [Evento fora de ordem] -> sequencia local, dependencia, politica por tipo e conflito explicito.
- [Status atual divergir da timeline] -> atualizacao atomica e job/consulta de reconciliacao.
- [WebSocket gera falsa sensacao de consistencia] -> reconciliacao por API e cursor apos reconexao.
- [PWA nao rastreia em segundo plano de forma confiavel] -> produto assume localizacao por evento; app nativo e iniciativa separada.
- [Migracao suja o banco novo] -> staging isolado, validacao e bloqueio de registros invalidos.
- [Convivencia cria dupla escrita] -> evitar dupla escrita generica; definir sistema autoritativo por fase e janela curta de corte.
- [Escopo cresce com modulos existentes no legado] -> backlog futuro separado e gate de MVP.

## Migration Plan

### Etapa 0 - Preparacao

- congelar terminologia, donos de decisao e criterios do piloto;
- garantir ambientes Docker, CI, segredos e observabilidade basica;
- registrar baseline do FieldOps e plano de backup.

### Etapa 1 - Descoberta funcional

- mapear auth, organizacao, clientes, tickets, OS, despacho, app tecnico, evidencias, mapa e sync;
- criar matriz legado -> requisito -> teste;
- fechar estados, perfis e campos obrigatorios do MVP.

### Etapa 2 - Fundacao vertical

- implementar identidade, contexto organizacional e dados mestres minimos;
- criar schema/eventos/idempotencia;
- entregar login -> lista do tecnico -> detalhe -> mudar status -> painel.

### Etapa 3 - Execucao local-first

- introduzir Dexie/outbox desde a primeira acao de campo;
- concluir check-in, notas, localizacao, conflitos e indicadores de sync;
- validar cenarios offline em dispositivos do piloto.

### Etapa 4 - Evidencias e finalizacao

- implementar captura/compressao/fila, S3/R2 e assinatura;
- fechar pre-condicoes e timeline completa;
- validar recuperacao de falhas e objetos orfaos.

### Etapa 5 - Sala de operacao

- consolidar dashboard, mapa, alertas, WebSocket e relatorios essenciais;
- reconciliar apos reconexao e medir recencia.

### Etapa 6 - Migracao e piloto

- definir recorte de dados e construir staging;
- executar cargas repetiveis e reconciliacao;
- rodar piloto controlado, corrigir severidades criticas e treinar usuarios.

### Etapa 7 - Corte e estabilizacao

- executar backup, carga delta e smoke tests;
- tornar o FieldOps somente leitura quando os gates forem satisfeitos;
- monitorar janela de estabilizacao e manter rollback pronto;
- desligar escrita no legado apenas apos aceite operacional e reconciliacao final.

### Rollback

Antes do corte, o plano deve registrar responsavel, janela, comandos/runbook, backups e limite de decisao. Em falha critica, a operacao retorna ao sistema autoritativo anterior ou ao procedimento de contingencia aprovado. Eventos criados no CrewOps durante a janela sao exportados e reconciliados; nao sao descartados silenciosamente.

## Open Questions

- Escolha entre S3 e R2 depende de custo, residencia, egress e operacao do ambiente alvo; o contrato de armazenamento sera neutro.
- Provedor de mapa/geocodificacao sera escolhido antes da fatia do mapa sem alterar o modelo PostGIS.
- Periodo exato para classificar sync/localizacao como recente, atencao ou desatualizado sera configurado com a operacao piloto.
- Recorte historico da primeira carga sera definido por utilidade operacional e qualidade dos dados, nao por copia total automatica.
