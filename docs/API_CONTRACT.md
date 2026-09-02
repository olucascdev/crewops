# Contrato da API — CrewOps (v1)

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 3.9
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — contrato publicado; aprovação PENDENTE.** Consolida recursos, erros estáveis, paginação, datas UTC e estratégia de versionamento do MVP. Base: `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §2/§7/§8/§10/§12, `docs/OFFLINE_SYNC_STRATEGY.md`, `docs/ARCHITECTURE.md`. **Nenhum contrato é aprovação assinada.** Validação por Arquitetura (R-003) + Operação (R-002) pendente.

> **Regra:** a validação autoritativa de regras de negócio é **server-side**; este contrato define transporte e erros estáveis. O DTO versionado em `packages/shared` (tarefa 5.1/11.1) materializa estes contratos.

---

## 1. Versionamento

- **Base URL:** `/api/v1`.
- **Major na URL:** mudanças **breaking** sobem a versão (`/api/v2`).
- **Mudanças aditivas** (novo campo opcional, novo recurso, novo código de erro) **mantêm** a versão atual.
- **Nunca** remover/renomear campo nem mudar semântica de erro sem nova versão major.

---

## 2. Recursos

| Recurso | Métodos | Observação |
| --- | --- | --- |
| `/auth` | POST `/login`, POST `/refresh`, POST `/logout` | Sessão revogável |
| `/companies` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | piloto única (R-012) |
| `/branches` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | `code` único por empresa |
| `/users` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | perfil simples |
| `/technicians` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | vínculo com usuário/filial |
| `/customers` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | identidade separada do endereço |
| `/service-addresses` | GET, POST, GET/:id, PATCH/:id, DELETE/:id | `geometry` PostGIS, nulo aceito |
| `/tickets` | GET, POST, GET/:id, PATCH/:id, POST/:id/status, DELETE/:id | estado + transição |
| `/work-orders` | GET, POST, GET/:id, PATCH/:id, POST/:id/status, DELETE/:id | máquina de estados central |
| `/dispatches` | GET, POST, GET/:id, PATCH/:id | atribuição/agendamento/reatribuição |
| `/sync` | POST `/sync`, GET `/sync/data` | lote idempotente + download incremental |
| `/events` | GET `/events`, POST `/events` | `work_order_events` (imutáveis) |
| `/evidences` | GET, POST (pre-assign), POST `:id/confirm` | upload direto + confirmação em 2 etapas |
| `/locations` | GET, POST `/locations` | `technician_locations` por evento |
| `/dashboard` | GET `/dashboard` | indicadores/queue/snapshot |
| `/health` | GET | processo/banco/Redis/filas (saudável vs degradado) |

---

## 3. Paginação

### Listas (painel e admin)
- Parâmetros: `limit` (default `<pag_default>`, máx `<pag_max>`) e `offset` **ou** `cursor`.
- Resposta:
  ```json
  {
    "data": [ ... ],
    "meta": { "hasMore": true, "nextCursor": "eyJ...", "total": 123 }
  }
  ```
- Listas ordenadas por chave estável (ex.: `created_at DESC, id DESC`) para evitar saltos de página.

### Sync (download incremental)
- Cursor baseado em `received_at` (horário de recebimento no backend) + `idempotency_key` (chave estável).
- Payload: `{ cards, activities, sync: { prepared_at, cursor, since, version } }`.

---

## 4. Datas e zonas horárias

- **ISO 8601 UTC:** `YYYY-MM-DDTHH:mm:ssZ`.
- Banco: colunas de data operacional em `timestamptz` (UTC).
- O dispositivo pode enviar `occurred_at` local, mas o backend armazena em UTC via `received_at`; `occurred_at` é preservada como origem quando confiável.
- Nenhuma data é apresentada sem fuso no payload.

---

## 5. Erros estáveis

Envelope único:
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "title is required", "details": { "field": "title" } }
}
```

### Códigos

| Código | Significado | Uso |
| --- | --- | --- |
| `UNAUTHORIZED` | Sessão/token ausente ou inválido | 401 |
| `FORBIDDEN` | Autenticado mas sem permissão | 403 |
| `NOT_FOUND` | Recurso inexistente ou fora do escopo | 404 |
| `CONFLICT` | Estado atual impede a ação (ex.: OS cancelada) | 409 |
| `INVALID_TRANSITION` | Transição de status não permitida | 409 |
| `VALIDATION_ERROR` | DTO/campos inválidos | 422 |
| `IDEMPOTENT_REPLAY` | Chave idempotente reutilizada com payload diferente | 422 |
| `UPLOAD_PENDING` | Evidência ainda pendente de upload | 409 |
| `RATE_LIMITED` | Limite/requisição excedido | 429 |
| `INTERNAL_ERROR` | Erro interno | 500 |

> Erros por item de lote (sync) seguem o protocolo `applied | already_done | rejected | conflict | retry_later` (`openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` §7), não o envelope acima, pois são resultados **por item**, não por requisição.

---

## 6. Autenticação e autorização

- **Painel:** cookie seguro (`HttpOnly`, `Secure`, `SameSite`) + CSRF; sessão revogável.
- **PWA técnico:** token e/ou cookie (conforme canal), revogável; dados locais limpos no logout/troca/revogação.
- Autorização **por empresa, filial, perfil e recurso** — `docs/PERMISSIONS_MATRIX.md` (3.6). Técnico só acessa OS atribuídas.

---

## 7. Idempotência

- Header `Idempotency-Key` para ações de escrita idempotentes (criar, confirmar evidência, evento).
- Ou campo `idempotency_key` no corpo em lote (`/sync`).
- Reenvio com a mesma chave retorna o mesmo resultado (`already_done`), sem duplicar evento/evidência.
- Escopo da chave: empresa + dispositivo + tipo, para evitar colisão.

---

## 8. WebSocket (invalidação)

- Mensagens **leves** de invalidação (não transportam payload pesado), com:
  ```json
  { "id": "...", "type": "work_order.updated", "cursor": "eyJ..." }
  ```
- Ao reconectar, o cliente **reconcilia** por API usando `cursor` (não depende somente das mensagens recebidas).
- Canais autorizados por `company_id`/`branch_id`/`resource`.

---

## 9. Registro de aprovação

| Campo | Valor |
| --- | --- |
| Estado | **PENDING** |
| Aprovadores (papéis) | Arquitetura + Operação |
| Aprovadores (pessoas) | **PENDENTE** (depende de R-003/R-002) |
| Data | — |
| Registro da decisão | a registrar em `docs/DECISION_LOG.md` quando aprovado |

### Checklist de confirmação

- [ ] Recursos, erros estáveis, paginação, datas UTC e versionamento definidos.
- [ ] Contrato materializado por DTOs em `packages/shared` (tarefa 5.1/11.1).
- [ ] Idempotência definida (header/campo) e recibo em mesma transação.
- [ ] WebSocket como invalidação + reconciliação (não fonte primária de consistência).

---

## Documentos vinculados

- `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` — §2 (módulos), §7 (sync), §8 (evidência), §10 (realtime), §12 (observabilidade).
- `docs/OFFLINE_SYNC_STRATEGY.md` — protocolo de sync idempotente.
- `docs/PERMISSIONS_MATRIX.md` — autorização por perfil (3.6).
- `docs/ARCHITECTURE.md` — limite de PWA e canais.
- `openspec/changes/migrar-fieldops-para-crewops-mvp/specs/offline-sync/spec.md` — resultado por item.
