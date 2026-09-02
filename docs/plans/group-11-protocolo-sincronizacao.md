# Plano Grupo 11 - Protocolo de sincronizacao

> Escopo: tarefas 11.1-11.10. Fontes: `specs/offline-sync/spec.md`, `docs/OFFLINE_SYNC_STRATEGY.md`, `docs/API_CONTRACT.md` e `design.md` secoes 4, 6 e 7.
> Pre-condicao: Grupos 8-10 concluidos. O PWA deve ter outbox local e a API deve aplicar eventos por transacao.

## Resultado

O PWA envia lotes versionados e recebe um resultado por evento: `applied`, `already_done`, `rejected`, `conflict` ou `retry_later`. Nenhum reenvio duplica uma alteracao, e a outbox so remove itens depois de ACK duravel.

## Implementacao

1. Criar contratos compartilhados para lote, evento, dependencias, cursor, erro acionavel e resultado individual; congelar `version` no payload.
2. Criar modulo `sync` com `POST /sync` e `GET /sync/data`. O download usa cursor de `received_at` mais chave estavel e retorna somente a projecao autorizada do tecnico.
3. Para cada item, usar transacao unica: localizar/criar `sync_receipt`, validar ownership/estado, aplicar evento de dominio, atualizar projecao e persistir o resultado. Chave repetida com payload igual retorna o resultado anterior; payload diferente retorna erro idempotente.
4. Ordenar por dependencia e sequencia local, sem confiar apenas em `occurred_at`. Item bloqueado por dependencia permanece pendente/retry conforme sua causa.
5. Definir politicas explicitas por tipo: nota e aditiva; status/check-in obedecem maquina de estados; localizacao aceita atraso com metadados; evidencia e assinatura dependem de confirmacao valida.
6. Classificar como `conflict`, sem sobrescrever, eventos para OS cancelada, concluida ou reatribuida durante offline.
7. Integrar `SyncCoordinator` do Grupo 10: ACK remove somente o item confirmado; retry transitorio usa backoff limitado; rejeicao/conflito conserva payload e orienta o tecnico.
8. Criar tela/ferramenta administrativa de diagnostico por lote, evento, OS, tecnico e dispositivo, com RBAC e redacao de PII/tokens.

## Testes e gate

- Unitarios para classificacao, ordenacao e idempotencia.
- Integracao para lote parcial, reenvio identico/diferente, queda antes do ACK, concorrencia e ownership cruzado.
- E2E para PWA com retry, conflito visivel e reconciliacao por cursor.
- So marcar 11.1-11.10 quando recibo e alteracao de dominio forem comprovadamente atomicos e nenhum item confirmado puder ser duplicado.
