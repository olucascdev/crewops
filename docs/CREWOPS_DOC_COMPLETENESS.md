# Checklist de Completude da Documentação — Grupo 1

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Grupo 1
> Data de registro: **2026-09-01**
> Propósito: **validação de completude** (arquivos, seções obrigatórias, placeholders com dono/prazo, R-IDs definidos, links `.md` e referências de origem legado) via **validador executável** (`scripts/validate_docs.sh`). **Não** é suíte de CI/testes — infraestrutura de CI/teste pertence ao **Grupo 4**. Este arquivo documenta o que foi verificado e como.
> Status: **PENDENTE de aprovação** (depende das nomeações R-001 a R-005). A verificação de existência/seções/referências abaixo **passou** (exit 0); a aprovação formal **não** foi concedida.

## Como rodar (validador executável)

Existe um **validador executável e autônomo** (POSIX shell, sem npm/CI) em `crewops/scripts/validate_docs.sh`. Ele é o mecanismo objetivo de verificação deste documento — não é apenas prosa/grep manual:

```bash
cd crewops
./scripts/validate_docs.sh            # exit 0 = OK; exit 1 = falha obrigatória
./scripts/validate_docs.sh --no-legacy
./scripts/validate_docs.sh --legacy-root /caminho/do/legado
```

O que ele verifica de forma executável:

- **Documentos:** os 7 documentos obrigatórios do grupo existem (+ `PILOT_RATIFICATIONS.md`).
- **Seções/headings:** seções obrigatórias por documento (substring de heading).
- **Placeholders:** todo placeholder `<...>` tem dono+prazo via **R-ID/D-ID na mesma linha** (o R-ID carrega dono, prazo e impacto em `PILOT_RATIFICATIONS.md`).
- **R-IDs:** todo R-ID referenciado nos docs está **definido** em `PILOT_RATIFICATIONS.md` (nenhum R-ID órfão).
- **R-ID estruturação:** todo R-ID referenciado tem campos obrigatórios preenchidos (dono, prazo, impacto, status) na linha estruturada de `PILOT_RATIFICATIONS.md`.
- **Links/âncoras:** referências relativas `.md` (links markdown + backticked) resolvem para arquivo existente; **âncoras** `#fragment` em links markdown são validadas contra headings reais do arquivo destino (inclui slug GFM e IDs explícitos `{#id}`). **Allowlist (aviso)** para docs de grupos posteriores: `BUSINESS_RULES.md`, `WORK_ORDER_FLOW.md`, `API_CONTRACT.md`, `DATABASE_MAP.md`.
- **Legado (opcional, leitura somente):** caminhos de origem do legado citados em `LEGACY_REFERENCE_MAP.md`/`FIELDOPS_BASELINE.md` existem (modo aviso, não falha).

> **Não** foi criado script `npm run test`: o projeto `crewops/package.json` **não tem** script de teste e a suíte de CI/testes do monorepo pertence ao **Grupo 4**. Este validador é um utilitário de governança **standalone** (POSIX shell), sem pipeline de testes e sem tocar no harness do Grupo 4.

## Documentos obrigatórios do grupo 1

| Doc | Existe | Seções obrigatórias presentes |
| --- | --- | --- |
| `docs/PILOT_GOVERNANCE.md` | OK | Objetivo; Papéis e Responsabilidades; Delegados por papel (nível de função); Regra de decisão final por tema; Decisões já tomadas; Como escalar um bloqueio de gate; Critério de aprovação deste documento; Documentos vinculados |
| `docs/MVP_SCOPE.md` | OK | Objetivo do MVP; Piloto Operacional (empresa, filiais, usuários por perfil, técnicos ativos); Volume Representativo; Fora do Piloto; Criterios de Sucesso; Confirmações pendentes; Documentos vinculados |
| `docs/ACCEPTANCE_PLAN.md` | OK | Severidades de defeito; Método de medição; Fases 0–7 (entrada/critérios/saída por fase); Critérios transversais; Documentos vinculados |
| `docs/GLOSSARY.md` | OK | Registro de aprovação; ticket; work_order; dispatch; event / work_order_event; evidence; technician_location; customer; service_address; Termos adicionais; Divergências explícitas; Termos proibidos; Documentos vinculados |
| `docs/FIELDOPS_BASELINE.md` | OK | 1. Volumes (seed + produção); 2. Tempos; 3. Erros/bugs; 4. Telas; 5. Indicadores; 6. Limitações; Regras de completude; Documentos vinculados |
| `docs/GPS_POLICY.md` | OK | Princípio; O que entrega; O que NÃO entrega; Textos aprovados; Critérios de recência; Se rastreamento contínuo for exigido; Validação; Documentos vinculados |
| `docs/DECISION_LOG.md` | OK | Modelo de registro; Decisões já registradas; Pendências D-101..D-105; Regras do registro; Documentos vinculados |

**Registros de apoio:** `docs/PILOT_RATIFICATIONS.md` (pendências R-001 a R-034).

## Verificação de placeholders → dono + prazo

Regra: **todo placeholder `<...>` de valor/escopo/tempo deve estar vinculado a um R-ID** com dono, prazo e impacto.

- `MVP_SCOPE.md` — empresa, filiais, usuários, técnicos, volume → R-012..R-018 (coluna Dono/Prazo/Status por linha).
- `FIELDOPS_BASELINE.md` — produção (OS, tickets, evidências, técnicos, tempos) → R-020..R-026 (compromisso datado de medição).
- `ACCEPTANCE_PLAN.md` — `<X>`, `<Y>`, `<Z>` → R-030..R-033 (antes dos gates 3–6).
- `GPS_POLICY.md` — threshold de recência `<X>`/`<Y>` → R-034 / D-103 (antes da Fase 5).
- `PILOT_GOVERNANCE.md` — função de delegado definida (nível de papel); nomes/contatos/delegados-pessoa → R-001..R-005.
- `DECISION_LOG.md` — datas de registro e pendências → datas preenchidas (2026-09-01) + donos/prazos explícitos.

Verificado: todo R-ID referenciado está definido em `PILOT_RATIFICATIONS.md`; nenhum placeholder sem dono/prazo.

## Verificação de referências

- **Referências atuais** (`docs/*.md`, `openspec/project.md`, `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md`): **todas resolvem** para arquivo existente.
- **Referências futuras (válidas, declaradas):** os itens abaixo NÃO existem hoje, mas são entregas de grupos posteriores (não são link quebrado):
  - `docs/BUSINESS_RULES.md` — Grupo 2/3.
  - `docs/WORK_ORDER_FLOW.md` — Grupo 3.
  - `docs/API_CONTRACT.md` — Grupo 3.
  - `docs/DATABASE_MAP.md` — Grupo 5.

## Resultado das verificações executadas

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Validador executável de completude | `./scripts/validate_docs.sh` | **PASS** (exit 0 — 0 falhas, 8 avisos) |
| R-ID estruturação (dono/prazo/impacto/status) | `./scripts/validate_docs.sh` | **PASS** (seção [4b]) |
| Âncoras de links markdown | `./scripts/validate_docs.sh` | **PASS** (seção [5]) |
| Whitespace/integridade do diff | `git diff --check` | **PASS** (exit 0) |
| Script de teste do projeto | `npm run test` (não existe) | **NOT APPLICABLE** — sem script `test`; CI/teste é Grupo 4 |

> **Saída do validador (resumo):** exit `0`. Os 8 avisos são **referências futuras declaradas** (docs de grupos posteriores) nas duas formas de citação: `BUSINESS_RULES.md`, `WORK_ORDER_FLOW.md`, `API_CONTRACT.md`, `DATABASE_MAP.md` (bare) e `docs/*.md` (prefixo). Nenhuma falha obrigatória. Os 26 caminhos de origem do legado citados existem (leitura somente).

> **Limitado a:** o validador cobre completude estrutural (existência, seções, placeholders→R-ID, R-ID órfão, links `.md` e origem legado citada). **Não** valida semântica de governança (ex.: se um R-ID deveria estar RESOLVED) nem testes de comportamento — isso é análise de revisão e do Grupo 4/5. A suíte automatizada de link/seção/placeholder no CI é responsabilidade do **Grupo 4**.

## Documentos vinculados

- `docs/PILOT_GOVERNANCE.md`, `docs/MVP_SCOPE.md`, `docs/ACCEPTANCE_PLAN.md`, `docs/GLOSSARY.md`, `docs/FIELDOPS_BASELINE.md`, `docs/GPS_POLICY.md`, `docs/DECISION_LOG.md`, `docs/PILOT_RATIFICATIONS.md` — os sete itens do grupo + registro de pendências.
- `scripts/validate_docs.sh` — validador executável que produz o resultado acima (exit 0).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/tasks.md` — Grupos 2–5 (origem das referências futuras).
