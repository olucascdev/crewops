# Plano Grupo 12 - Localizacao operacional por evento

> Escopo: tarefas 12.1-12.7. Fontes: `specs/field-operations/spec.md`, `docs/GPS_POLICY.md`, `docs/OPERATIONAL_THRESHOLDS.md` e `docs/EVIDENCE_POLICY.md`.
> Pre-condicao: Grupos 10 e 11 concluidos. Nao implementar rastreamento continuo no PWA.

## Resultado

Cada captura de localizacao nasce como dado operacional associado a uma acao, pode ser enviada offline e preserva origem, precisao, `occurred_at` e `received_at`. O mapa usa ultima posicao conhecida, nunca uma promessa de rastreamento em background.

## Implementacao

1. Criar adaptador de geolocalizacao com timeout, `enableHighAccuracy` configuravel, leitura de permissao e resultado discriminado para negado, indisponivel, expirado ou impreciso.
2. Vincular a captura a check-in, transicao relevante, evidencia, finalizacao e ping manual. Quando GPS nao for pre-condicao aprovada, registrar explicitamente ausencia de coordenada sem bloquear a acao.
3. Persistir no Dexie junto ao evento/outbox; validar latitude, longitude, precisao e timestamp antes do envio.
4. No backend, inserir `technician_locations` com PostGIS e atualizar a ultima posicao por evento valido, sem apagar historico. Deduplicar ponto/reenvio pelo evento idempotente.
5. Captura periodica e somente em primeiro plano, opt-in/configuravel e interrompida em `visibilitychange`; nunca anunciar suporte com app fechado ou tela bloqueada.
6. Centralizar classificacao de recencia e textos de UI. Os valores ficam bloqueados por D-103/R-034; ate aprovacao, mostrar horario/origem/precisao sem apresentar thresholds como regra final.

## Testes e gate

- Simular permissao negada, timeout, leitura imprecisa, timestamp antigo, duplicata e sync tardio.
- Validar PostGIS, tenant/tecnico correto e preservacao do historico.
- Revisar UI, FAQ e painel contra os termos proibidos em `GPS_POLICY.md`.
- So concluir com teste em dispositivo representativo e sem texto que sugira GPS continuo.
