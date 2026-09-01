# Estrategia Offline e Sync

## Principio

O app do tecnico deve ser local-first. Toda acao importante nasce localmente e depois sincroniza com a API.

Isso evita perda de atendimento em campo quando ha internet ruim, queda de sinal ou upload lento.

## Armazenamento Local no PWA

Usar IndexedDB com Dexie para manter:

- ordens de servico baixadas;
- cliente e endereco de atendimento;
- fila de eventos pendentes;
- fotos pendentes;
- assinaturas pendentes;
- localizacoes pendentes;
- metadados de sync;
- tentativas e erros de envio.

## Eventos Locais

Toda acao vira evento local:

- `work_order_status_changed`;
- `technician_checked_in`;
- `photo_added`;
- `signature_collected`;
- `note_added`;
- `location_captured`.

Cada evento deve carregar:

- `local_id`;
- `idempotency_key`;
- `work_order_id`;
- `technician_id`;
- `event_type`;
- `payload`;
- `lat`;
- `lng`;
- `accuracy`;
- `created_at`;
- `created_offline`;
- `sync_status`.

## API de Sync

A API deve aceitar lotes de eventos pendentes e processar com idempotencia.

Regras:

- mesma `idempotency_key` nao pode duplicar evento;
- evento rejeitado deve retornar motivo claro;
- falha temporaria deve permitir retry;
- falha permanente deve ficar visivel para suporte;
- horario local de criacao e horario de recebimento no servidor devem ser preservados.

## Estados de Sync

Estados recomendados:

- `pending`: criado localmente e ainda nao enviado;
- `syncing`: envio em andamento;
- `synced`: confirmado pela API;
- `failed_retryable`: falhou, mas pode tentar de novo;
- `failed_blocked`: falhou e precisa acao manual.

## GPS no PWA

O PWA deve capturar localizacao:

- com app aberto;
- no check-in;
- ao mudar status;
- ao anexar evidencia;
- ao coletar assinatura;
- em sync periodico enquanto o app esta em uso;
- por comando manual de atualizar localizacao.

O PWA nao deve prometer GPS continuo em segundo plano com tela bloqueada.

## Upload de Evidencias

Fluxo recomendado:

1. Capturar foto/assinatura.
2. Comprimir imagem no PWA quando aplicavel.
3. Salvar arquivo e metadados localmente.
4. Criar evento `photo_added` ou `signature_collected`.
5. Pedir URL pre-assinada para API.
6. Enviar direto para S3/R2.
7. Confirmar upload na API.
8. Marcar evidencia como `uploaded`.

A OS pode ser finalizada se a evidencia obrigatoria foi capturada, mesmo que o upload ainda esteja pendente. O painel deve mostrar essa pendencia.

## Testes Obrigatorios

- evento offline com mesma `idempotency_key` nao duplica;
- tecnico consegue mudar status sem internet;
- fila local sobrevive a reload do PWA;
- upload com falha fica pendente;
- retry de upload nao duplica evidencia;
- OS finalizada com evidencia pendente aparece no painel com alerta;
- tecnico so altera OS atribuida a ele.
