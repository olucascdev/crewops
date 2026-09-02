# Escopo MVP CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.2
> Data de registro: **2026-09-01**
> Status: **PENDENTE de confirmação**. Empresa, filiais, usuários, técnicos e volume abaixo são **placeholders**. Valores reais **não existem no workspace**. Cada placeholder tem dono, prazo e impacto registrados em `docs/PILOT_RATIFICATIONS.md` (R-012 a R-018). Nenhum CNPJ, e-mail ou endereço real aparece aqui. Nomes úteis são fictícios quando indicado.

## Objetivo do MVP

Validar a operação de campo ponta a ponta para um provedor: criar OS, despachar técnico, executar no PWA, registrar evidências e acompanhar no painel.

## Entrega Principal

```txt
Gestor cria OS
Despachante atribui para técnico
Técnico recebe no PWA
Técnico executa em campo
Registra status, GPS por evento, foto e assinatura
Admin acompanha status, mapa e timeline
```

## Usuarios

Perfis iniciais:

- `admin`;
- `gestor_operacional`;
- `atendente`;
- `despachante`;
- `tecnico`.

## Modulos do MVP

- autenticacao;
- usuarios e perfis;
- empresa e filiais;
- tecnicos;
- clientes;
- enderecos de atendimento;
- tickets;
- ordens de servico;
- despacho/agendamento;
- eventos de OS;
- localizacao por evento;
- evidencias;
- assinatura;
- sync offline;
- dashboard operacional;
- mapa de ultima posicao conhecida;
- relatorios simples.

## Piloto Operacional

> **PROVISIONAL.** Empresa, filiais, usuarios e tecnicos abaixo sao recorte a ser confirmado por **Operacao + Dados**. Nomes uteis sao ficticios quando indicado. Nenhum CNPJ, e-mail ou endereco real aparece aqui.

### Empresa piloto

| Campo | Valor (placeholder) | Dono | Prazo | Impacto se não confirmado | Status |
| --- | --- | --- | --- | --- | --- |
| Nome (ficticio) | `<Nome do provedor piloto>` — 1 (uma) empresa | Operação (+ Produto) | Gate Fase 0 — 2026-09-30 | Sem recorte para dimensionar/extrair o piloto | PENDING [R-012](PILOT_RATIFICATIONS.md) |
| Critério de escolha | provedor regional, operação de campo em 1 base central e 2–4 cidades próximas, para exercitar despacho, mapa, evidência e sync | Operação | Gate Fase 0 — 2026-09-30 | Critério sem validação operacional | PENDING [R-012](PILOT_RATIFICATIONS.md) |

### Filiais / cidades participantes

> **PROVISIONAL.** Codigos abaixo sao uma sugestao baseada no seed demo do repo (`database/migrations` + `fieldops.sql`); nao representam filiais reais confirmadas de producao. Confirmacao depende de R-013 (Operacao).

| Codigo | Nome | Cidade/UF | Fuso (UTC) | Confirmado | Dono | Prazo | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<BR-A>` | Filial A | `<cidade>` | `-03` | Nao | Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-013](PILOT_RATIFICATIONS.md) |
| `<BR-B>` | Filial B | `<cidade>` | `-03` | Nao | Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-013](PILOT_RATIFICATIONS.md) |
| `<BR-C>` | Filial C | `<cidade>` | `-03` | Nao | Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-013](PILOT_RATIFICATIONS.md) |
| `<BR-D>` | Filial D (`<opcional>`) | `<cidade>` | `-03` | Nao | Operação | Gate Fase 0 — 2026-09-30 | PENDING [R-013](PILOT_RATIFICATIONS.md) |

### Usuarios por perfil

> **PROVISIONAL.** Quantidades reais dependem de cadastro do FieldOps (R-014 — Operacao + Dados).

| Perfil | Quantidade estimada | Dono | Prazo | Impacto se não confirmado | Status |
| --- | --- | --- | --- | --- | --- |
| `admin` | `<N>` | Operação + Dados | Gate Fase 0 — 2026-09-30 | Matriz de permissões sem base | PENDING [R-014](PILOT_RATIFICATIONS.md) |
| `gestor_operacional` | `<N>` | Operação + Dados | Gate Fase 0 — 2026-09-30 | Indicadores sem dono operacional validado | PENDING [R-014](PILOT_RATIFICATIONS.md) |
| `atendente` | `<N>` | Operação + Dados | Gate Fase 0 — 2026-09-30 | Entrada de tickets sem dimensionamento | PENDING [R-014](PILOT_RATIFICATIONS.md) |
| `despachante` | `<N>` | Operação + Dados | Gate Fase 0 — 2026-09-30 | Carga de despacho sem dimensionamento | PENDING [R-014](PILOT_RATIFICATIONS.md) |
| `tecnico` | `<N>` | Operação + Dados | Gate Fase 0 — 2026-09-30 | Perfil crítico do piloto sem frota validada | PENDING [R-014](PILOT_RATIFICATIONS.md) |

### Tecnicos ativos no piloto

| Campo | Valor (placeholder) | Dono | Prazo | Impacto se não confirmado | Status |
| --- | --- | --- | --- | --- | --- |
| Quantidade | `<N>` — todos mapeados para `tecnico`, com dispositivo móvel testado (Chrome/Edge com sandbox e permissão de GPS e câmera) | Operação | Gate Fase 0 — 2026-09-30 | Matriz de dispositivos e cenário offline sem base | PENDING [R-015](PILOT_RATIFICATIONS.md) |
| Distribuição | `<N>` por filial/cidade, priorizando a área com sinal ruim para validar offline | Operação | Gate Fase 0 — 2026-09-30 | Cobertura offline sem distribuição validada | PENDING [R-015](PILOT_RATIFICATIONS.md) |

## Volume Representativo

> **PROVISIONAL.** Numeros exigem consulta real ao banco FieldOps (`work_orders`, `tickets`, `work_order_evidences`, `technician_profiles`) ou estimativa aprovada por Operacao. Nao devem ser usados como metrica de producao ate confirmacao. Cada valor tem dono/prazo (R-016 a R-018).

| Metrica | Valor estimado | Fonte | Confirmado | Dono | Prazo | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OS/dia | `<X>` | Operacao | Nao | Operação + Dados | Antes da Fase 0 (sizing) — 2026-10-15 | PENDING [R-016](PILOT_RATIFICATIONS.md) |
| OS/semana | `<X*7>` | Operacao | Nao | Operação + Dados | Antes da Fase 0 (sizing) — 2026-10-15 | PENDING [R-016](PILOT_RATIFICATIONS.md) |
| Pico por hora | `<X>` | Operacao | Nao | Operação + Dados | Antes da Fase 0 (sizing) — 2026-10-15 | PENDING [R-016](PILOT_RATIFICATIONS.md) |
| Tickets/dia | `<X>` | Operacao | Nao | Operação | Antes da Fase 0 (sizing) — 2026-10-15 | PENDING [R-017](PILOT_RATIFICATIONS.md) |
| Taxa de conversao ticket→OS | `<%>` | Operacao | Nao | Operação | Antes da Fase 0 (sizing) — 2026-10-15 | PENDING [R-017](PILOT_RATIFICATIONS.md) |
| Evidencias/OS (fotos + assinatura) | `<N>` | Operacao | Nao | Operação + Dados | Antes da Fase 4 — 2026-10-31 | PENDING [R-018](PILOT_RATIFICATIONS.md) |
| Tamanho medio de evidencia | `<MB>` | Operacao | Nao | Operação + Dados | Antes da Fase 4 — 2026-10-31 | PENDING [R-018](PILOT_RATIFICATIONS.md) |
| Pico de tamanho de evidencia | `<MB>` | Operacao | Nao | Operação + Dados | Antes da Fase 4 — 2026-10-31 | PENDING [R-018](PILOT_RATIFICATIONS.md) |

### O que torna o volume representativo

- Cobre a maior parte dos cenários operacionais da operação (atendimento corretivo, preventivo, instalação e pesquisa/levantamento).
- Inclui ao menos uma **área de sinal ruim** para exercitar offline, fila e retry.
- Inclui ao menos uma **OS com retrabalho** e uma **OS cancelada/reatribuída** para validar conflitos e eventos de despacho.

## Fora do Piloto

- Multiempresa/SaaS completo; financeiro; estoque; roteirização avançada; chat interno; BI sofisticado; permissões super complexas; app nativo; microserviços; Kubernetes; Kafka; CQRS pesado.
- Migração de todo o histórico legado sem recorte aprovado (ver `docs/DECISION_LOG.md` D-104).

## Criterios de Sucesso

- Técnico consegue trabalhar com internet instável.
- Gestor entende a operação em poucos segundos.
- OS tem timeline confiável.
- Evidências não se perdem.
- Sync não duplica eventos.
- GPS é comunicado como localização por evento, não rastreamento contínuo.

## Confirmações pendentes do escopo (resumo)

| R-ID | Item | Dono | Data-alvo (proposta) | Impacto | Status |
| --- | --- | --- | --- | --- | --- |
| R-012 | Empresa piloto | Operação (+ Produto) | 2026-09-30 | Sem recorte para dimensionar o piloto | PENDING |
| R-013 | Filiais/cidades | Operação | 2026-09-30 | Contexto de filial/fuso/mapa/agenda não dimensionável | PENDING |
| R-014 | Usuários por perfil | Operação + Dados | 2026-09-30 | Matriz de permissões/RBAC não verificável | PENDING |
| R-015 | Técnicos ativos | Operação | 2026-09-30 | Matriz de dispositivos/offline/load não validável | PENDING |
| R-016 | OS/dia, OS/semana, pico | Operação + Dados | 2026-10-15 | Sizing de API/sync/upload sem base | PENDING |
| R-017 | Tickets/dia + conversão | Operação | 2026-10-15 | Fila e carga de despacho sem base | PENDING |
| R-018 | Evidências/OS + tamanho | Operação + Dados | 2026-10-31 | Upload/storage/retention sem base | PENDING |

> **Regra:** os placeholders acima **não** podem ser tratados como métrica de produção. Antes do gate correspondente, cada R-ID deve estar **RESOLVED** (valor real + dono da medida + data de comprovação registrados em `docs/PILOT_RATIFICATIONS.md`).

## Documentos vinculados

- `docs/PILOT_GOVERNANCE.md` — donos por tema.
- `docs/PILOT_RATIFICATIONS.md` — pendências de confirmação (R-012 a R-018).
- `docs/DECISION_LOG.md` — recorte histórico (D-104) e prazos por fase.
- `docs/ACCEPTANCE_PLAN.md` — gates por fase que dependem deste escopo.
