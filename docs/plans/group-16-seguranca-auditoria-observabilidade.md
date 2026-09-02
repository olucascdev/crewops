# Plano Grupo 16 - Seguranca, auditoria e observabilidade

> Escopo: tarefas 16.1-16.9. Fontes: `design.md` secoes 11-12, `docs/API_CONTRACT.md`, `docs/PERMISSIONS_MATRIX.md` e `specs/platform-architecture/spec.md`.

## Implementacao

1. Produzir threat model com ativos, fronteiras, abuso e mitigacoes para autenticacao, sync, IDs, WebSocket, PostGIS e URL pre-assinada; cada risco recebe dono e teste.
2. Aplicar schemas a todos os DTOs e limites de pagina, lote, payload, arquivo e frequencia por identidade/IP; rejeitar antes de processar custos altos.
3. Garantir que storage/evidencias sejam privados e somente URL temporaria autorizada permita acesso.
4. Emitir logs estruturados com request, lote, evento, OS, dispositivo e job; propagar correlacao por chamadas e filas.
5. Redigir tokens, bytes, assinaturas e PII desnecessaria antes de logar. Cobrir redacao com testes.
6. Expor metricas de API, banco, sync, outbox reportada, upload, fila, socket e operacao; definir SLI/alertas para falhas e idade crescente.
7. Criar consultas de auditoria para status, despacho, permissao, correcao e finalizacao, com acesso restrito e retencao definida.

## Testes e gate

- Testar autorizacao horizontal/vertical, URL abusada, replay, lote excessivo e socket cruzado.
- Exercitar alertas com dependencias degradadas e confirmar que nenhum segredo chega a log/metricas.
- So concluir com threat model revisado, alertas acionaveis e auditoria consultavel para todos os eventos criticos.
