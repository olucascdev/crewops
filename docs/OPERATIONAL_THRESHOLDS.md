# Thresholds Operacionais

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.8
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — thresholds definidos; valores numéricos PENDING.** Define os thresholds de OS atrasada, técnico parado, sync antigo e localização desatualizada. **Nenhum valor é considerado aprovado; valores reais exigem decisão de Operação** (`docs/PILOT_RATIFICATIONS.md` R-034) e, para recência/localização, confirmação de Produto para o texto de UI. Base: `docs/BUSINESS_RULES.md` §2.10, `docs/CLASSIFICATION.md` 2.10-*/2.8-c, `docs/GPS_POLICY.md`.

> **Fonte no legado:** recência `fresh ≤15min`, `stale 15–120min`, `old ≥120min` (`app/Models/User.php:199-211`, `:210`); atraso `overdue = status NOT IN ('completed','cancelled') AND due_at < NOW()` (`app/Models/WorkOrder.php:201`); "técnico parado" **não** tem indicador único no legado (`app/Models/TechnicianAvailability.php:43-64`).

---

## 1. Indicadores

| Indicador | Regra de cálculo (proposta) | Dono | Status |
| --- | --- | --- | --- |
| **OS atrasada** | `status NOT IN ('completed','cancelled') AND due_at < now()` | Operação | **REGISTERED** (observada no legado) |
| **Técnico parado** | `availability_status = 'available' AND last_sync > <X> min AND sem OS in_progress` | Operação | **PENDING** (R-034/D-103) |
| **Sync antigo** | último sync bem-sucedido há mais de `<Y>` min | Operação | **PENDING** (R-034) |
| **Localização desatualizada** | `fresh ≤ <X>`; `atenção <X>–<Y>`; `desatualizada ≥ <Y>` | Operação + Produto (UI) | **PENDING** (R-034/D-103) |

### Regra de cálculo explicada

- **OS atrasada:** idêntica ao legado; considera `due_at` (`app/Models/WorkOrder.php:201,224`). Padronizar a divergência sutil `kpis` (sem `due_at IS NOT NULL`) vs `queueSummary` (exige) — `docs/BUSINESS_RULES.md` §2.10/§5.
- **Técnico parado:** **não** existe no legado; proposta combina `availability_status='available'` + último sync além de `<X>` min + ausência de OS `in_progress`. Pede definição de Operação (`docs/CLASSIFICATION.md` 2.10-f).
- **Sync antigo:** baseado no último sync reportado pelo dispositivo; valor `<Y>` é placeholder (R-034).
- **Localização desatualizada:** usa as classes de recência do legado (`fresh/stale/old`), com valores `<X>`/`<Y>` a confirmar (D-103/R-034).

---

## 2. Valores propostos (baseados no legado)

| Classe | Faixa (proposta) | Observação |
| --- | --- | --- |
| `fresh` | `≤ 15 min` | apoiado em `app/Models/User.php:210` |
| `stale` | `15 – 120 min` | apoiado em `app/Models/User.php:210` |
| `old` | `≥ 120 min` | apoiado em `app/Models/User.php:210` |

> **Nenhum valor acima é aprovado.** São transposição do cálculo legado para o MVP. Os valores finais para "técnico parado", "sync antigo" e "localização desatualizada" dependem de **Operação** (R-034/D-103) e do texto de UI de **Produto**. `<X>`/`<Y>` permanecem placeholders até então.

---

## 3. Pendências

| # | Item | Dono | Relação | Status |
| --- | --- | --- | --- | --- |
| 1 | `<X>` para técnico parado (min sem sync) | Operação | R-034/D-103 | PENDING |
| 2 | `<Y>` para sync antigo (min) | Operação | R-034 | PENDING |
| 3 | Faixas de recência/localização (`<X>`/`<Y>`) | Operação + Produto | R-034/D-103 | PENDING |
| 4 | Padronizar regra de atraso (`due_at IS NOT NULL`) | Operação | R-034 | PENDING |

---

## 4. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Thresholds documentados com donos e placeholders vinculados (R-034/D-103).
- [ ] Regras de cálculo definidas (atraso, técnico parado, sync, recência).
- [ ] Nenhum valor publicado como aprovado até Operação confirmar.

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — §2.10 (indicadores), §2.8 (recência).
- `docs/CLASSIFICATION.md` — 2.10-f (técnico parado), 2.8-c (recência).
- `docs/GPS_POLICY.md` — recência e comunicação de localização (D-003).
- `docs/PILOT_RATIFICATIONS.md` — R-034 (thresholds de recência).
- `docs/DECISION_LOG.md` — D-103 (thresholds de recência).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/operations-dashboard/spec.md` — recência operacional explícita.
