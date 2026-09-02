# Matriz de Permissões — 5 Perfis por Recurso e Ação

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.6
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — matriz definida; aprovação PENDENTE.** O MVP adota uma matriz **simples** (recurso × ação) em vez do RBAC granular do legado (`database/migrations/002_create_rbac_tables.sql:4-35`; `docs/CLASSIFICATION.md` 2.1-d). Perfis: `admin`, `gestor_operacional`, `atendente`, `despachante`, `tecnico` (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/identity-access/spec.md`; `docs/MVP_SCOPE.md`). **Nenhuma permissão foi aprovada por assinatura.** Validação por Produto + Operação (R-001/R-002 + R-014) pendente.

> **Princípio:** a validação autoritativa é **server-side**; ocultar controlo na interface não é autorização (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/identity-access/spec.md` — Acão protegida).

---

## 1. Legenda de ações

| Símbolo | Ação |
| --- | --- |
| `C` | create |
| `R` | read |
| `L` | list |
| `U` | update |
| `D` | delete |
| `A` | assign (atribuir técnico) |
| `X` | dispatch (despachar/agendar/reagendar) |
| `V` | validate (validar evidência/finalização) |
| `K` | cancel (cancelar) |
| `O` | reopen (reabrir) |
| `E` | export |

`—` = negado. `(✓)` = só no escopo próprio (ex.: OS atribuída a si / própria).

---

## 2. Matriz recurso × perfil

| Recurso | admin | gestor_operacional | atendente | despachante | tecnico |
| --- | --- | --- | --- | --- | --- |
| `company` | CRLUD | RL | RL | R | — |
| `branch` | CRLUD | RL | RL | R | — |
| `user` | CRLUD | RL | — | — | — |
| `technician` | CRLUD | RL | R | RL | R (próprio) |
| `customer` | CRLUD | RL | CRLU | R | R (própria) |
| `service_address` | CRLUD | RL | CRLU | R | R (própria) |
| `ticket` | CRLUD + A + V + K + O | RLV + K + O | CRLU + A | R | CRL (campo, própria) |
| `work_order` | CRLUD + X + V + K + O | RLV + X + V + K + O | RL | CRLU + X + K | R (atribuída) + U (status) |
| `dispatch` | CRLUD + X | RL + U + X | R | CRLU + X | R (própria) |
| `event` | RL (full) | RL (full) | RL | RL | CRL (própria) |
| `evidence` | CRUD + V | RLV | R | R | CR (própria) + upload |
| `location` | RL | RL | R | R | CR (própria) |
| `dashboard` | R | R | R | R | R (cards próprios) |
| `sync` | R + E | R | — | — | R (própria) |
| `audit` | R + E | R | — | — | — |

---

## 3. Matriz resumida por perfil

### `admin`
- **Tudo** (todas as ações em todos os recursos), incluindo gestão de `company`, `branch`, `user`, `technician`, auditoria, exportação e cancelamento/reabertura/validação.

### `gestor_operacional`
- **Leitura geral** dos recursos.
- **Alterar** OS e dispatch (estado/prioridade/prazo/técnico).
- **Cancelar/reabrir** e **validar** (evidências/finalização).
- **Dashboard** e **leitura de auditoria**.
- Não cria/edita `company`/`branch`/`user`/`technician` (só leitura).

### `atendente`
- **Criar/editar/listar** tickets.
- **Ler** clientes e endereços.
- **Ler** OS (próprias e da filial).
- Não altera OS nem despacha; não valida.

### `despachante`
- **Ler** OS e técnicos.
- **Criar/editar** dispatch (atribuição, agendamento, reagendamento).
- **Dashboard**.
- **Atualizar** status operacionais (estados de execução/preparo).
- **Cancelar** (com motivo).

### `tecnico`
- **Ler** OS atribuídas a si.
- **Alterar status** (check-in/out) dentro das transições autorizadas.
- **Criar** eventos, evidências e localizações (no escopo das OS atribuídas).
- **Ler** cliente/endereço das suas OS.

---

## 4. Regras específicas (fonte)

## Restrição do técnico (spec)
- Técnico só altera OS **atribuídas a ele** e dentro das transições autorizadas; acesso a OS de outro técnico → **negado** + auditoria (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/identity-access/spec.md` — Restrição do técnico; `app/Models/WorkOrder.php:1052`).

## Perfis fixos (spec)
- MVP limitado a `admin`, `gestor_operacional`, `atendente`, `despachante`, `tecnico` (`openspec/changes/migrar-fieldops-para-crewops-mvp/specs/identity-access/spec.md` — Perfis operacionais do MVP).

---

## 5. Ambiguidades a confirmar (PENDING)

| # | Item | Dono | Relação | Status |
| --- | --- | --- | --- | --- |
| 1 | `atendente` pode criar OS vinculada a ticket? | Produto | R-014 | PENDING |
| 2 | `despachante` pode cancelar OS em qualquer estado (ou só antes de execução)? | Operação | R-014 | PENDING |
| 3 | `gestor_operacional` tem acesso à gestão de `technician` (ativo/inativo)? | Operação | R-014 | PENDING |
| 4 | `tecnico` pode criar ticket em campo (fluxo 2.4-i)? | Produto | R-014 | PENDING |
| 5 | Flag de configuração para exportação administrativa (SLA/dashboard)? | Arquitetura | R-014 | PENDING |

---

## 6. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Cobre os 5 perfis × recursos × ações do MVP.
- [ ] Ambiguidades acima anotadas como PENDING.
- [ ] Vinculada a R-014 (usuários por perfil do piloto).
- [ ] Validada virtualmente de forma server-side.

---

## Documentos vinculados

- `docs/MVP_SCOPE.md` — perfis do piloto (R-014).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/identity-access/spec.md` — perfis fixos e restrição do técnico.
- `docs/TRACEABILITY_MATRIX.md` — RBAC legado → matriz simples (tarefa 3.6).
- `docs/OPERATIONAL_POLICIES.md` — autores de reatribuição/cancelamento/reabertura.
