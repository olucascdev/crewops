# Plano Grupo 14 - Realtime, filas e efeitos assincronos

> Escopo: tarefas 14.1-14.7. Fontes: `specs/platform-architecture/spec.md`, `docs/API_CONTRACT.md` e `design.md` secoes 10 e 12.
> Pre-condicao: operacoes de banco sao corretas sem Redis/WebSocket; realtime e acelerador, nao fonte de verdade.

## Implementacao

1. Configurar BullMQ/Redis com filas nomeadas, politicas por job, retries limitados, backoff, dead letter e metricas de tentativa.
2. Implementar outbox pos-commit no banco: a transacao de dominio registra a mensagem; worker publica somente depois de commit. Nunca responder que um efeito foi enfileirado sem persistencia segura.
3. Criar gateway WebSocket autenticado e canais por empresa, filial e recurso; revalidar sessao/escopo no handshake e em inscricoes.
4. Padronizar invalidacoes leves com `id`, `type`, `version/cursor` e escopo. Nao transportar evidencia, PII ou estado completo pelo socket.
5. No painel, reconectar com backoff e reconciliar por API/cursor depois de lacuna; preservar filtros e evitar duplicacao ou salto de layout.
6. Se Redis/socket falhar, operacoes confirmadas no PostgreSQL continuam validas, health fica degradado e UI usa polling/refetch controlado.

## Testes e gate

- Duplicata/perda de mensagem, reconexao, canal cruzado, Redis indisponivel e job esgotado.
- Provar que uma falha antes do commit nao publica mensagem e que uma mensagem perdida e recuperada pela reconciliacao.
- So concluir quando as operacoes criticas nao dependerem de WebSocket e jobs mortos forem observaveis/acionaveis.
