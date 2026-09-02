# Política de Evidências Obrigatórias por Tipo de OS

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.4
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — política definida; aprovação PENDENTE.** Define quais evidências são obrigatórias por tipo de OS e quando a validação administrativa é necessária. Base: `docs/BUSINESS_RULES.md` §2.5/§2.6/§2.7 e `docs/CLASSIFICATION.md` 2.5-h/2.6-f/2.7-*. **Nenhum valor foi aprovado por assinatura.** Validação por Produto + Operação (R-001/R-002) pendente.

> **Fonte primária:** formulário de execução por OS (`database/migrations/009_dispatch_forms_v022.sql:4-13` → `require_photos`, `require_signature`, `require_gps`; `database/migrations/011_mobile_sync_compat_v032c.sql:3-20` → `checklist_items`, `extra_fields`, `photo_mode`, `signature_mode`). No legado, `applyTechnicianAction` **não** valida preenchimento obrigatório no checkout (`app/Models/WorkOrder.php:1090-1107`).

---

## 1. Tipos de evidência

| Tipo | Definição | Representação no CrewOps | Exemplo |
| --- | --- | --- | --- |
| `photo` | Imagem capturada em campo | `evidence_type='photo'` (blob/objeto) | foto da instalação |
| `signature` | Assinatura do responsável | `evidence_type='signature'` + `signer_name`/`signer_role` | assinatura de recebimento |
| `note` | Nota textual de execução | `work_order_event` (evento), **não** evidência | observação do técnico |
| `attachment` | Anexo (arquivo) genérico | `evidence_type='attachment'` | PDF, laudo |
| `gps` | Ponto de localização por evento | `technician_locations` + coordenada no evento | posição do check-in |

> **Nota (D-106/D-002):** no legado a `note` é gravada como evidência (`evidence_type='note'`) misturando evento operacional e prova. No CrewOps, **nota vira `work_order_event`**; evidência restringe-se a arquivo/assinatura/foto.

---

## 2. Regras transversais

- **GPS obrigatório em check-in e checkout** para todo tipo de OS (preserva legado — `app/Models/WorkOrder.php:1071-1088,1090-1107`; `docs/CLASSIFICATION.md` 2.6-c).
- **GPS por evento** (D-003): captura em check-in, mudança de status relevante, evidência, finalização e ping manual —**sem rastreamento contínuo** (`docs/GPS_POLICY.md`).
- **Config por OS** (`require_photos`, `require_signature`, `require_gps`) pode **sobrepor** o default por tipo.
- **Checklist** exige ≥1 item + campos extras obrigatórios quando a OS tiver formulário configurado (`app/Models/WorkOrder.php:1109-1134`).
- **Finalização com upload pendente:** permitida localmente se a evidência foi capturada; painel sinaliza `pending_upload` até confirmação do backend.

---

## 3. Evidências por tipo de OS (proposta)

> Tipos de OS: `corrective` (corretiva), `preventive` (preventiva), `installation` (instalação), `survey` (pesquisa/levantamento) — `app/Controllers/Admin/WorkOrderController.php:164`; `docs/GLOSSARY.md` (`work_order`).

| Tipo de OS | Foto | Assinatura | GPS | Nota/observação |
| --- | --- | --- | --- | --- |
| `corrective` | **1+ obrigatória** | obrigatória quando cliente presente | obrigatório (check-in/out) | 1+ nota do serviço |
| `preventive` | **1+ obrigatória** | opcional | obrigatório (check-in/out) | checklist conforme formulário |
| `installation` | **obrigatória** | **obrigatória** | obrigatório (check-in/out) | lista de materiais quando houver |
| `survey` | **1+ obrigatória** | opcional | obrigatório (check-in/out) | preenchimento de campos de levantamento |

> **Regra:** os defaults acima são **proposta**. A configuração individual da OS (formulário de execução) sobrepõe o default quando definida (`require_photos`/`require_signature`/`require_gps`). Valores exatos devem ser confirmados por Produto (R-014) e validados contra `docs/REQUIRED_FIELDS.md` (3.7).

---

## 4. Quando a validação administrativa é necessária

- A OS entra em `waiting_evidence`/`in_validation` quando a execução é finalizada e falta evidência ou validação (ver `docs/STATE_MATRICES.md` 3.3).
- **admin/gestor** aprova (→ `completed`) ou abre **retrabalho** (→ `rework`) em `in_validation`.
- **Se evidência obrigatória não estiver confirmada como `uploaded`, a OS não avança para `completed`** — salvo quando capturada localmente e ainda pendente de upload (ver seção 5).
- A validação administrativa é **obrigatória** para OS com evidência obrigatória de captura/assinatura, a fim de garantir qualidade de prova.

---

## 5. Estados de upload da evidência

| Estado | Significado | Como ocorre |
| --- | --- | --- |
| `pending_upload` | Capturada localmente, ainda não confirmada no backend | Gravada na outbox/pendingEvidence do PWA |
| `uploaded` | Objeto confirmado no storage + vinculado à evidência | Upload direto (URL pré-assinada) + confirmação idempotente |
| `failed` | Upload rejeitado/permanentemente falho | Erro de formato/tamanho ou falha definitiva; exige correção |

> **Fonte:** `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/evidence-uploads/spec.md` (ciclo verificável), `docs/GLOSSARY.md` (`evidence`), `docs/CLASSIFICATION.md` 2.7-f.

---

## 6. Divergências / pendências

| # | Pendência | Dono | Relação | Status |
| --- | --- | --- | --- | --- |
| 1 | Assinatura: desenho (cliente) vs nome simples (servidor) — decidir suporte do MVP | Produto | D-107; `docs/CLASSIFICATION.md` 2.6-f/2.6-g | PENDING |
| 2 | Formato/tamanho/dimensão/qualidade/EXIF/hash exatos | Arquitetura | `docs/CLASSIFICATION.md` 2.7-d; tarefa 13.1 | PENDING |
| 3 | Storage (S3 vs R2) e URL pré-assinada | Arquitetura | D-101; tarefas 13.4/13.5 | PENDING |
| 4 | Limite de contagem de arquivos por evidência (server-side) | Arquitetura | `docs/CLASSIFICATION.md` 2.6-e | PENDING |
| 5 | Evidências/OS + tamanho médio/pico (dimensionamento) | Operação + Dados | R-018/R-023 | PENDING |

---

## 7. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Produto + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-001/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Tabela tipo × evidência aprovada por Produto (R-014).
- [ ] Regra de validação administrativa confirmada por Operação (R-002).
- [ ] Estados `pending_upload`/`uploaded`/`failed` validados contra `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/evidence-uploads/spec.md`.
- [ ] Resolvida divergência de assinatura (D-107).

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — §2.5 (formulário), §2.6 (ações), §2.7 (evidências).
- `docs/CLASSIFICATION.md` — 2.5-h/2.6-*/2.7-*.
- `docs/STATE_MATRICES.md` — estados `waiting_evidence`/`in_validation`/`completed`/`rework`.
- `docs/REQUIRED_FIELDS.md` — campos obrigatórios de evidência/OS (3.7).
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/evidence-uploads/spec.md` — ciclo de upload.
- `docs/GPS_POLICY.md` — recência e política de GPS (D-003).
