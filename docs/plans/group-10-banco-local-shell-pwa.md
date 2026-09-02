# Plano Grupo 10 - Banco local e shell PWA

> Escopo: tarefas 10.1-10.9 do OpenSpec `migrar-fieldops-para-crewops-mvp`.
> Fontes: `specs/offline-sync/spec.md`, `docs/OFFLINE_SYNC_STRATEGY.md`, `docs/GPS_POLICY.md`, `docs/API_CONTRACT.md` e `design.md` secoes 6, 7 e 11.
> Pre-condicao: Grupo 9 aprovado. O protocolo remoto definitivo e do Grupo 11; este grupo cria o armazenamento local e a experiencia local-first sem fingir que a API de sync ja existe.

## Resultado esperado

O PWA tecnico e instalavel, guarda um shell seguro e possui IndexedDB versionado por usuario para a projecao local de OS, cliente, endereco, outbox, evidencias pendentes e estado de sincronizacao. Acoes de campo persistem de modo atomico e a interface comunica estado real mesmo sem rede.

## Guardrails

- Usar Dexie/IndexedDB; nao armazenar OS, evidencias ou tokens em `localStorage`.
- O banco local e particionado por `companyId:userId`; logout, troca de usuario ou revogacao remove o banco/itens desse sujeito antes de aceitar outra sessao.
- Service worker cacheia somente shell, fontes e ativos versionados seguros. Nunca cachear respostas autenticadas, cookies, tokens, HTML personalizado ou URLs pre-assinadas.
- Offline nao e sinônimo de sincronizado: outbox so remove item com ACK seguro do Grupo 11.
- O PWA nao promete GPS em segundo plano, e a solicitacao de armazenamento persistente e melhor esforco, nao garantia de durabilidade.

## Modelo Dexie proposto

| Tabela | Chave e indices minimos | Conteudo |
| --- | --- | --- |
| `workOrders` | `id`, `[scope+status]`, `[scope+updatedAt]` | card/detalhe projetado da OS atribuida |
| `customers` | `id`, `scope` | contexto minimo da OS |
| `serviceAddresses` | `id`, `scope` | endereco e snapshot visual |
| `outbox` | `localId`, `[scope+syncStatus]`, `[workOrderId+sequence]`, `idempotencyKey` | evento pendente e dependencias |
| `pendingEvidences` | `localId`, `[scope+status]`, `workOrderId` | metadados e Blob local, preparado para Grupo 13 |
| `syncState` | `scope` | cursor, ultimo sucesso, erro e versao |
| `localMeta` | `scope` | schema version, quota observada e identidade atual |

`scope` deve ser uma string derivada de empresa e usuario, nunca um valor informado pelo browser sem conferir a sessao.

## Implementacao por tarefa

### 10.1 Shell e instalabilidade

1. Adicionar manifest, icones, `theme_color`, `display: standalone` e metadados adequados ao App Router.
2. Configurar service worker com Workbox ou mecanismo equivalente, precache de build e runtime cache restrito a ativos publicos seguros.
3. Testar instalacao e atualizacao do worker, exibindo aviso de nova versao sem apagar outbox existente.

### 10.2-10.3 Dexie e migracoes

1. Adicionar Dexie e criar `apps/web/src/lib/local-db/` com schema, tipos compartilhados e factory por escopo autenticado.
2. Versionar evolucoes com `db.version(n).stores(...).upgrade(...)`; cada upgrade preserva outbox e evidencias pendentes, transformando registros quando necessario.
3. Separar a limpeza deliberada de usuario da migracao de schema. Falha de migracao deve manter um diagnostico e nao apagar dados silenciosamente.

### 10.4 Download e projecao incremental

1. Criar adaptador `field-data-client` que consome o endpoint de download/cursor previsto no contrato, com interface mockavel ate o Grupo 11.
2. Aplicar cada pagina em uma transacao Dexie: upsert de OS, cliente/endereco e cursor somente apos todos os registros persistirem.
3. Limitar a projecao a OS autorizadas/atribuidas; itens removidos por reatribuicao/cancelamento devem ser marcados ou removidos sem descartar outbox relacionada.

### 10.5 Acao local atomica

1. Criar fabrica de eventos locais com UUID, `idempotencyKey`, sequencia por OS, `occurredAt`, `createdOffline`, dependencia e estado inicial `pendente`.
2. Em uma transacao Dexie, gravar evento na outbox e aplicar a projecao otimista da OS. Se qualquer gravacao falhar, a tela conserva o estado anterior e informa erro.
3. A interface usa os mesmos tipos de evento/status do Grupo 8; o protocolo de envio e classificacao remota fica para Grupo 11.

### 10.6-10.7 Estados e gatilhos

1. Mapear os estados de produto `local`, `pendente`, `sincronizando`, `sincronizado`, `falhou`, `conflito` aos estados internos sem esconder erro permanente.
2. Criar `SyncCoordinator` que reage a abertura, `visibilitychange`, `online` e retry manual. Ele serializa execucoes por escopo e respeita backoff limitado.
3. Antes do Grupo 11, o coordinator pode apenas preparar/reconciliar download; nao simular ACK nem remover outbox.

### 10.8 Cota e persistencia

1. Consultar `navigator.storage.estimate()` quando disponivel e registrar percentual/limiar no estado local.
2. Solicitar `navigator.storage.persist()` apos explicar o beneficio ao tecnico; tratar indisponibilidade/negacao sem bloquear operacao.
3. Antes de capturar Blob futuro, reservar/validar espaco e preservar pendencias existentes; esta integracao e finalizada no Grupo 13.

### 10.9 Testes

- Unitarios: migracoes Dexie, particionamento por escopo, transacao de evento otimista e mapeamento de estados.
- Browser/E2E: reload offline, service worker, upgrade de schema com outbox, logout/troca de usuario e os dois cenarios de cota suportados por mocks.
- Manual em dispositivo: instalacao, modo aviao, retorno de rede e mensagem de armazenamento sem prometer rastreamento continuo.

## Arquivos previstos

- `apps/web/public/manifest.webmanifest`, icones e configuracao do service worker.
- `apps/web/src/lib/local-db/**`, `src/lib/sync/**`, hooks de estado local e componentes de indicador/retry.
- Testes Vitest com fake IndexedDB e Playwright para cenarios de navegador.

## Criterio de conclusao

Marcar 10.1-10.9 somente quando o shell instalar, reload offline preservar dados, upgrade nao perder pendencias, logout/troca apagar o escopo correto e nenhuma acao local depender de rede para ser registrada. A remocao segura da outbox permanece bloqueada ate a confirmacao do Grupo 11.
