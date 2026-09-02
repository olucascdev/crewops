# Plano Grupo 13 - Evidencias, fotos e assinatura

> Escopo: tarefas 13.1-13.10. Fontes: `specs/evidence-uploads/spec.md`, `docs/EVIDENCE_POLICY.md`, `docs/OFFLINE_SYNC_STRATEGY.md` e `docs/API_CONTRACT.md`.
> Gates: resolver D-101 (S3/R2), limites de arquivo e D-107 (assinatura) antes da validacao final.

## Resultado

Fotos, assinaturas e anexos sao capturados localmente, validados, enviados diretamente ao storage privado e confirmados de modo idempotente. A OS pode sinalizar evidencia pendente, mas a prova nunca e tratada como valida antes da confirmacao.

## Implementacao

1. Registrar politica aprovada de tipos MIME, tamanho, dimensoes, qualidade, EXIF, hash, contagem, retencao e privacidade; nao inventar valores enquanto R-018/R-023 estiverem pendentes.
2. Implementar captura, correcao de orientacao e compressao antes de salvar Blob no Dexie; falha/cota insuficiente nao pode marcar captura como concluida.
3. Criar registro local idempotente de foto, assinatura e nota. Nota e `work_order_event`, nao evidencia; arquivos carregam hash, tamanho, tipo, OS e evento.
4. Criar adaptador neutro de object storage e endpoints autorizados para emitir URL limitada e confirmar objeto. Chave deriva de empresa, OS e identificador idempotente.
5. Fazer upload direto com progresso, expiracao, nova URL e retry; URL expirada preserva Blob/metadados locais.
6. Na confirmacao, validar hash, tamanho, MIME, chave e vinculo antes de gravar evidencia/timeline; reenvio retorna o mesmo resultado.
7. Propagar `pending_upload`, `uploaded` e `failed` no PWA, API e painel. Finalizacao local mantem alerta ate a confirmacao remota.
8. Criar job BullMQ para verificar objetos e limpar somente orfaos apos janela definida; objetos confirmados sao protegidos.

## Testes e gate

- Arquivo grande, tipo/hash invalido, cota insuficiente, URL expirada, upload sem ACK, retry e objeto orfao.
- Integracao do storage usando adaptador fake e testes de autorizacao de URL.
- E2E de finalizacao com evidencia local pendente e alerta no painel.
- Concluir somente com politica aprovada e sem bytes, assinatura ou URL sensivel em logs.
