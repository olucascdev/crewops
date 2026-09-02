# Política Comercial de GPS no PWA

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.6
> Data de registro: **2026-09-01**
> Status: **PENDENTE de aprovação** (Comercial, Produto e Jurídico, quando aplicável). Textos abaixo são **propostas**; não estão aprovados por assinatura. A aprovação formal fica registrada em `docs/PILOT_RATIFICATIONS.md` e `docs/DECISION_LOG.md` (D-103 / R-034 para os thresholds).

## Princípio

O CrewOps (PWA) entrega **localização por evento** e **última posição conhecida**. Ele **não** entrega rastreamento contínuo em segundo plano nem com tela bloqueada, porque o comportamento de background do PWA não é confiável entre navegadores móveis.

Esta política é consistente com `openspec/project.md`, `docs/ARCHITECTURE.md` ("Why Not Continuous PWA GPS") e `docs/OFFLINE_SYNC_STRATEGY.md`.

## O que o CrewOps entrega

| Capacidade | Como funciona |
| --- | --- |
| Captura no check-in | Localização registrada quando o técnico inicia o atendimento |
| Captura ao mudar status | Ponto registrado em transição de status relevante (início, conclusão) |
| Captura ao anexar evidência | Ponto associado à foto/assinatura/anexo |
| Captura ao coletar assinatura | Ponto associado ao signatário |
| Captura por ping manual | Botão "atualizar localização" |
| Captura periódica em primeiro plano | Enquanto o app estiver aberto e em uso, respeitando permissão e bateria |
| Mapa com última posição conhecida | Painel mostra o ponto com **recência, origem e precisão** |

## O que o CrewOps NÃO entrega

- Rastreamento contínuo em segundo plano (app fechado/minimizado).
- GPS confiável com tela bloqueada.
- Rastreamento em tempo real contínuo (stream permanente).

## Textos aprovados (propostas)

### Contrato / proposta comercial

> "O acompanhamento de campo é feito por eventos: o sistema registra a localização do técnico em momentos operacionais (início, conclusão, upload de evidência, assinatura e atualização manual) e exibe no mapa a **última posição conhecida**, com o horário de captura. Não há rastreamento contínuo em segundo plano a partir do navegador móvel."

### FAQ de suporte

> **"Vocês rastreiam o técnico em tempo real?"**
> Não. O registro é por evento e a última posição conhecida é mostrada com horário e origem. Com o app fechado ou em segundo plano, não há captura contínua.

### Textos de interface

| Contexto | Texto |
| --- | --- |
| Mapa (posição antiga) | "Última posição há X minutos" |
| Mapa (posição muito antiga) | "Sem posição atualizada há X minutos" |
| Indicador de captura | "Localização por evento" |
| Botão técnico | "Atualizar localização" |

> **Regra:** nenhum destes textos deve conter "rastreamento em tempo real", "GPS contínuo", "rastreamento em segundo plano" ou termos que sugiram monitoramento permanente.

## Critérios de recência (PENDING — R-034 / D-103)

> Valores numéricos devem ser fechados com **Operação** (+ **Produto** para o texto de UI). Registrados como **R-034** em `docs/PILOT_RATIFICATIONS.md` e **D-103** em `docs/DECISION_LOG.md`. **Gate da Fase 5**, data-alvo proposta **2026-11-30**. Prazo de decisão: antes da Fase 5 (sala de operação).

| Faixa | Critério (placeholder) | Rótulo | Dono | Prazo | Status |
| --- | --- | --- | --- | --- | --- |
| Recente | `< X` min desde a última captura | Posição recente | Operação (+ Produto) | Gate Fase 5 — 2026-11-30 | PENDING [R-034](PILOT_RATIFICATIONS.md) |
| Atenção | `X ≤ t < Y` min | Atenção | Operação (+ Produto) | Gate Fase 5 — 2026-11-30 | PENDING [R-034](PILOT_RATIFICATIONS.md) |
| Desatualizada | `≥ Y` min | Sem posição atualizada | Operação (+ Produto) | Gate Fase 5 — 2026-11-30 | PENDING [R-034](PILOT_RATIFICATIONS.md) |

O painel **sempre** mostra o horário exato da captura, independentemente da faixa. Nenhum marcador deve sugerir rastreamento ativo quando a captura é antiga.

## Se rastreamento contínuo for exigido

- Será uma **iniciativa separada** (app nativo/Expo ou capacidade mobile dedicada), fora do escopo do piloto PWA.
- Reutiliza a API e o modelo de eventos quando adequado (`docs/ARCHITECTURE.md`).
- Exige nova decisão de escopo, custo e plano em `docs/DECISION_LOG.md`.

## Validação

- Consistência com `openspec/project.md` e `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` (Decisão 9): **OK (proposta)**.
- Termos proibidos em textos de UI/suporte: revisar em review (Fase 5).
- Vínculo ao `docs/ACCEPTANCE_PLAN.md` como critério de comunicação de cada fase.
- Thresholds numéricos **não autoritativos** até R-034/D-103 resolvidos.

## Documentos vinculados

- `docs/OFFLINE_SYNC_STRATEGY.md` — quando o PWA captura posição.
- `docs/GLOSSARY.md` — termos `technician_location` e `event`.
- `docs/PILOT_RATIFICATIONS.md` — R-034 (thresholds) e R-011 (aprovação de termos).
- `docs/DECISION_LOG.md` — D-103 (thresholds de recência).
- `docs/ARCHITECTURE.md` — por que não GPS contínuo.
