# Gate Funcional do MVP (3.10)

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.10
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — gate documentado; execução PENDENTE.** O gate garante que **nenhuma fatia de implementação inicia com regra essencial sem decisão ou critério de aceite**. Base: `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §1 (gate de conhecimento) e `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/legacy-modernization/spec.md` (gate funcional por domínio). **Nenhum gate está aprovado.**

> **Regra:** a entrada de um grupo de implementação (4–17) pode começar somente quando as dependências essenciais do Grupo 3 estiverem **decididas** (D-ID/R-ID registrado) ou com **critério de aceite** em `docs/ACCEPTANCE_PLAN.md`. A ausência de aprovação de Produto/Operação (R-001/R-002) mantém o gate aberto.

---

## 1. Checklist do gate (3.10)

| # | Item | Evidência | Status |
| --- | --- | --- | --- |
| 3.10-1 | Todo item 3.1–3.9 existe em `docs/` | `WORK_ORDER_FLOW`, `STATE_MATRICES`, `EVIDENCE_POLICY`, `OPERATIONAL_POLICIES`, `PERMISSIONS_MATRIX`, `REQUIRED_FIELDS`, `OPERATIONAL_THRESHOLDS`, `API_CONTRACT`, `FUNCTIONAL_GATE` | PRONTO (PENDING) |
| 3.10-2 | Toda regra essencial aponta para D-ID (`DECISION_LOG`), R-ID (`PILOT_RATIFICATIONS`) ou critério de aceite (`ACCEPTANCE_PLAN`) | referências cruzadas nos docs do grupo | PRONTO (PENDING) |
| 3.10-3 | Toda transição de status de ticket/OS tem autor + motivo | `docs/STATE_MATRICES.md` (3.2/3.3) | PRONTO (PENDING) |
| 3.10-4 | Toda pendência de produto/operação tem dono e prazo | `docs/PILOT_RATIFICATIONS.md` + `docs/DECISION_LOG.md` | PRONTO (PENDING) |
| 3.10-5 | Matriz de permissões cobre os 5 perfis × recursos × ações do MVP | `docs/PERMISSIONS_MATRIX.md` (3.6) | PRONTO (PENDING) |
| 3.10-6 | `API_CONTRACT.md` define erros estáveis, paginação, UTC e versionamento | `docs/API_CONTRACT.md` (3.9) | PRONTO (PENDING) |
| 3.10-7 | Nenhuma tarefa dos grupos 4–17 inicia sem decisão essencial registrada | ver mapeamento §2 | PRONTO (PENDING) |
| 3.10-8 | `scripts/validate_docs.sh` passa (exit 0) | executar após inclusão dos docs | EXECUTAR |

> **Status global: PENDING.** A execução formal (G-16) ocorre quando Produto/Operação aprovarem as matrizes e o gate for validado pelos donos nomeados (R-001/R-002/R-003).

---

## 2. Mapeamento dos grupos 4–17 → dependências do Grupo 3

| Grupo | Dependência essencial do Grupo 3 | Bloqueio se ausente |
| --- | --- | --- |
| 4 (fundação) | perfis (3.6) + contrato (3.9) para config | Não há thresholds; mas config/perfis definem ambiente |
| 5 (contratos/modelo) | matrizes de estado (3.2/3.3), campos obrigatórios (3.7), evidência (3.4) | **Bloqueante** — schema/enums sem regras |
| 6 (identidade/autorização) | permissões (3.6), perfis (3.6), regras de sessão | **Bloqueante** — RBAC/perfis sem matriz |
| 7 (clientes/endereços) | campos cliente/endereço (3.7), unicidade (D-109) | Campos obrigatórios sem definição |
| 8 (tickets/OS/despacho) | matrizes ticket/OS (3.2/3.3), políticas (3.5) | **Bloqueante** — máquina de estados sem matriz |
| 9 (fatia vertical) | matrizes (3.2/3.3), permissões (3.6), fluxo (3.1) | **Bloqueante** — fluxo/estado sem decisão |
| 10 (banco local/PWA) | evidência (3.4), fluxo (3.1) | Estados de evidência/upload sem definição |
| 11 (protocolo sync) | políticas offline (3.5), contrato (3.9) | **Bloqueante** — conflito sem política |
| 12 (localização) | thresholds (3.8), política GPS (D-003) | Recência sem valores |
| 13 (evidências) | evidência (3.4), contrato (3.9), campos (3.7) | **Bloqueante** — política de evidência sem decisão |
| 14 (realtime/filas) | contrato (3.9), fluxo (3.1) | Contrato sem definição |
| 15 (sala de operação/mapa) | thresholds (3.8), permissões (3.6), matrizes (3.2/3.3) | **Bloqueante** — indicadores/recência sem valores |
| 16 (segurança/auditoria) | permissões (3.6), contrato (3.9) | Autorização sem matriz |
| 17 (relatórios) | thresholds (3.8), matrizes (3.2/3.3), fluxo (3.1) | Definição de atraso/estado sem decisão |

> **Decisões essenciais ainda PENDING que bloqueiam grupos acima:** D-101 (storage), D-102 (mapa), D-103 (thresholds), D-104 (recorte histórico), D-107 (assinatura), D-109 (unicidade cliente), R-001/R-002/R-003 (nomeações), R-014 (perfis). Ver `docs/DECISION_LOG.md` e `docs/PILOT_RATIFICATIONS.md`.

---

## 3. Como registrar a execução do gate

- Quando Produto/Operação/Arquitetura aprovarem as matrizes e o gate for validado, **atualizar** `docs/TRACEABILITY_MATRIX.md` (seção Gate de aprovação) e preencher a seção "Registro de aprovação" abaixo com data + pessoa nomeada (R-001/R-002/R-003).
- **Nenhum gate pode ser marcado como aprovado sem data + papel nomeado.**

---

## 4. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação + Arquitetura |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002/R-003) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

---

## Documentos vinculados

- `docs/TRACEABILITY_MATRIX.md` — gate de aprovação (G-01…G-16).
- `docs/DECISION_LOG.md` — decisões essenciais.
- `docs/PILOT_RATIFICATIONS.md` — pendências de valores/nomeação.
- `docs/ACCEPTANCE_PLAN.md` — critérios de aceite por fase.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/legacy-modernization/spec.md` — gate funcional por domínio.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — §1 (gate de conhecimento).
