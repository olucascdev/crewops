# Classificação dos Comportamentos do Legado (2.11)

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 2.11
> Data de registro: **2026-09-01**
> Status: **PROPOSTA — classificação registrada; sujeita a confirmação no gate (produto/operação/arquitetura)**. Nenhum item aqui é aprovação assinada.
>
> Classes:
> - **`preservar`** — regra essencial ao fluxo operacional do piloto; mantém a semântica no CrewOps.
> - **`redesenhar`** — objetivo válido, mas a implementação legada é inadequada (acoplamento, falta de idempotência, storage local, sem auditoria).
> - **`adiar`** — útil, mas fora do caminho feliz do MVP; não bloqueia as fases 3–5.
> - **`descartar`** — fora de escopo, duplicado, acidental ou substituído por decisão de design.
>
> Justificativa obrigatória: risco operacional, dependência de pendência (D-101 a D-105) e impacto no MVP.

## Resumo por classe

| Classe | Qtd | Observação |
| --- | --- | --- |
| `preservar` | 35 | regras essenciais do fluxo (auth, status, GPS, indicadores, fila offline) |
| `redesenhar` | 33 | objetivos válidos, implementação inadequada (RBAC, eventos, storage, idempotência, PostGIS) |
| `adiar` | 6 | úteis, não bloqueiam MVP (grade semanal, equipes, base do técnico, BI avançado, recent_only) |
| `descartar` | 4 | fora de escopo / substituído (compliance/wallet/ratings, kiosk, webhooks, white label) |
| **Total** | **78** | linha 2.2-d (`operational_type partner_pj/system_user`) é primariamente `redesenhar`; a menção a `descartar` ali é nota de escopo, não classe |

---

## 2.1 Autenticação / Usuários / RBAC

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.1-a | Login por e-mail + `password_verify` + status `active` obrigatório | `preservar` | Essencial. Sem isso não há acesso ao painel/PWA. Sem risco novo. |
| 2.1-b | Separação de guards (`admin` vs `technician`) por sessão/URI | `redesenhar` | O conceito (dois canais) vale; a implementação por `$_SESSION`+`app_guard` é frágil. CrewOps usa sessão no painel (cookie) e token/cookie no PWA (tarefa 6.2/6.5). |
| 2.1-c | Bloqueio cruzado de perfil operacional (admin barra técnico/PJ; app barra `system_user`) | `preservar` | Regra de negócio real; mantém canais separados. |
| 2.1-d | RBAC granular por nome de permissão (role_permissions) | `redesenhar` | Permissões legadas são granulares/muitas; CrewOps quer matriz simples recurso×ação e 5 perfis fixos (tarefa 3.6). |
| 2.1-e | API JWT com `roles`+`permissions` e `expires_in=3600` | `redesenhar` | Estratégia de token adequada ao canal; detalhes (refresh/revogação) conforme 6.2. JWT duplo pode ser simplificado. |
| 2.1-f | Tenant default via `firstTenantForUser` | `redesenhar` | Em CrewOps o isolamento é por `company_id` fixo no piloto (R-012); o fallback por 1º tenant é desnecessário. |
| 2.1-g | Soft delete + `status('active','inactive','blocked')` em users | `preservar` | Modelo de estado de usuário útil; manter com `company_id`. |
| 2.1-h | Auditoria de login/logout no `audit_logs` | `preservar` | Relevância de segurança; mantém auditoria de sessão (tarefa 6.7). |

## 2.2 Empresa / Filiais / Técnico / Disponibilidade

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.2-a | `tenants` = empresa; `tenant_units` = filial (endereço+lat/lng) | `redesenhar` | Objetivo mapeia para `companies`/`branches`; nomes/estrutura mudam (D-*, tarefa 5.2). |
| 2.2-b | `tenant_settings` config por empresa | `redesenhar` | Vira config de company/branch (5.6/5.7). |
| 2.2-c | Técnico = `technician_profiles` vinculado a `users.id` | `preservar` | Modelo técnico↔usuário essencial (tarefa 5.3). |
| 2.2-d | `operational_type('system_user','technician','partner_pj')` | `redesenhar` | CrewOps separa perfis (atendente/despachante/tecnico...). `partner_pj` e `system_user` viram discriminação de pessoa/tipo (maybe `descartar` p/ MVP). |
| 2.2-e | Disponibilidade atual `available/busy/off` + `availability_notes` + `last_seen_at` | `preservar` | Base do "técnico disponível/parado" (tarefa 5.3, 15.2). |
| 2.2-f | Grade semanal `technician_availability_slots` | `adiar` | Útil para agenda, mas não essencial ao fluxo feliz (OS atribuída → executar). Decisão de entrar no MVP é de produto `[PRODUTO]`. |
| 2.2-g | Equipes (`technician_teams`, `technician_team_members`) | `adiar` | Não bloqueia piloto; agrupar técnicos pode vir depois. |
| 2.2-h | `home_radius_km`, `base_lat/lng` (base do técnico) | `adiar` | Sem uso no fluxo feliz; depende do provedor de mapa (D-102). |
| 2.2-i | Compliance/docs, ratings, wallet (`technician_compliance_requirements`, `technician_documents`, `technician_ratings`, `technician_wallet_entries`) | `descartar` (MVP) | Fora do escopo do piloto (financeiro/compliance/avaliação); bloquear até gate (tarefa 17.8). |

## 2.3 Clientes e Sites/Endereços

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.3-a | `clients` separado de `sites` | `preservar` | Base da separação identidade × local físico (tarefa 7.1/7.2). |
| 2.3-b | `sites` com `lat/lng` DECIMAL(10,7) | `redesenhar` | Movia para `geometry(Point,4326)` (PostGIS) com aceite de nulo (tarefa 7.3). |
| 2.3-c | Cliente obriga `name` (≥2) | `preservar` | Validação mínima de identidade; manter (decidir campos exatos com produto) `[PRODUTO]`. |
| 2.3-d | Site obriga `name` + `client_id` | `preservar` | Endereço deve pertencer a um cliente; manter. |
| 2.3-e | Sem duplicidade explícita por documento (busca livre) | `redesenhar` | Objetivo correto, mas legado não impede duplicata. CrewOps adiciona deduplicação/índice e alerta (tarefa 7.6); **decisão de unicidade por documento é de produto** `[PRODUTO]`. |
| 2.3-f | Soft delete + auditoria de cliente/site | `preservar` | Necessário para correção administrativa (tarefa 8.8). |
| 2.3-g | `sites` referenciado por tickets/OS (SET NULL) | `preservar` | Endereço é referência; preservar snapshot para histórico (tarefa 7.4). |

## 2.4 Tickets

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.4-a | Status `open,in_progress,waiting,resolved,closed,cancelled` | `preservar` | Ciclo de vida real; manter (aprovar transições em 3.2). |
| 2.4-b | Prioridade `low,normal,high,critical` | `preservar` | Semântica operacional comum a tickets/OS. |
| 2.4-c | `number` único por tenant `TKT-YYYY-NNNN` | `redesenhar` | Numerador/contador não é idempotente; CrewOps deve gerar número de forma segura/chave. |
| 2.4-d | Ticket exige `title` (≥3) e `priority` | `preservar` | Campo mínimo do chamado. |
| 2.4-e | Vínculo opcional a `client_id/site_id/category_id/opened_by/assigned_to` | `preservar` | Mantém rastreabilidade da solicitação. |
| 2.4-f | `due_at` SLA; `resolved_at/closed_at` no estado final | `redesenhar` | Atraso definido como `due_at < NOW()`; CrewOps padroniza regra de atraso e tempos (tarefa 3.8/R-034). |
| 2.4-g | Documentos/anexos `ticket_documents` | `preservar` | Entrada de material antes da execução (se relacionar a evidência, ver 2.7). |
| 2.4-h | Conversão ticket→OS **não automática** (OS avulsa permitida) | `preservar` | É a regra real do negócio; manter (tarefa 8.2). |
| 2.4-i | Técnico abre ticket em campo (via app) | `preservar` | Fluxo de campo real; manter com isolamento de filial. |

## 2.5 Ordens de Serviço

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.5-a | Status `pending,scheduled,dispatched,in_progress,waiting_evidence,in_validation,waiting_parts,completed,cancelled,rework` | `preservar` | Estados observados; aprovar matriz de transições em 3.3. |
| 2.5-b | Prioridade `low,normal,high,critical` | `preservar` | Mesma semântica; usar nas filas. |
| 2.5-c | Criação: `title` obrigatório; status inicial por técnico+agendamento | `preservar` | Regra de abertura usada no painel. |
| 2.5-d | Despacho atribui técnico/prazo + registra evento | `redesenhar` | Eventos legados em `work_order_dispatch_events` viram `work_order_events` com idempotência/ator (tarefa 8.4/8.5, D-002). |
| 2.5-e | `quickAction` (mover/reatribuir/priorizar) grava timeline granular | `redesenhar` | Objetivo mantido; unificar em evento de despacho transacional (8.4/8.8). |
| 2.5-f | Retrabalho `upsertRework` + `work_order_rework_events` | `redesenhar` | Modelo legado mistura flag+eventos; CrewOps mantém rework via eventos (8.8) e política dedicada (3.5). |
| 2.5-g | `work_order_timeline` múltiplas ações | `redesenhar` | Vira `work_order_events` imutáveis (verdade operacional, D-002). |
| 2.5-h | Formulário de execução (checklist, extra_fields, photo/signature_mode, require_gps) | `redesenhar` | Config por OS mantida, mas validação de preenchimento no app deve ser transacional e auditável (3.4/8.4). |
| 2.5-i | Webhooks `work_order.dispatch.updated` / `status.changed` | `descartar` (MVP) | Integrações/webhooks fora do piloto; bloquear até gate. |
| 2.5-j | Kiosk (`isKiosk/refresh`) | `descartar` (MVP) | Modo kiosk fora do escopo do piloto; bloquear. |

## 2.6 App do técnico

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.6-a | Lista de OS atribuídas (exclui `cancelled`, prioriza `in_progress`) | `preservar` | Regra de lista do técnico; essencial (tarefa 9.1/9.2). |
| 2.6-b | Cards `open_total/in_progress/scheduled_today/overdue` | `preservar` | Visão de volume do técnico. |
| 2.6-c | Check-in/out exigem GPS | `preservar` | Regra de GPS por evento (D-003); essencial. |
| 2.6-d | Checklist exige ≥1 item + campos extras obrigatórios | `preservar` | Validação de execução; manter. |
| 2.6-e | Evidência textual exige texto ou arquivo; até 4 arquivos | `redesenhar` | Limite de 4 é **só cliente** (`slice(0,4)`); servidor não impõe contagem → padronizar política server-side (tarefa 13.1). |
| 2.6-f | Assinatura simples por `signer_name` | `preservar` | Assinatura simples (nome) é suficiente para o MVP; desenho/digital pode adiar `[PRODUTO]`. |
| 2.6-g | Cliente captura assinatura desenhada mas servidor ignora | `redesenhar` | Divergência; decidir suporte a desenho (tarefa 13.2/13.3) — manter só nome ou implementar imagem. |
| 2.6-h | Compressão de imagem no cliente (max 1600px, q 0.82) | `preservar` | Reduz banda para offline/upload; manter (13.2). |
| 2.6-i | Fila offline local (IndexedDB) armazena ações | `redesenhar` | Vira outbox Dexie com estados explícitos (10.2/11.7). |

## 2.7 Evidências

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.7-a | Tipos `attachment/signature/note` vinculados à OS | `preservar` | Semântica de prova do serviço; manter. |
| 2.7-b | **Nota** gravada como evidência (`note` mistura evento+GPS) | `redesenhar` | Separa: nota/evento vira `work_order_event`; evidência só arquivo/assinatura (D-002/tarefa 13.3). |
| 2.7-c | Armazenamento em **disco local** (`public/uploads/...`) | `redesenhar` | Substitui por object storage (D-101) + URL pré-assinada (tarefa 13.4). |
| 2.7-d | Limite 10MB + extensões `jpg/jpeg/png/pdf/webp` | `redesenhar` | Aplicado **só no multipart**; base64 não tem checagem de tamanho → definir política completa (tamanho/contagem/formato/hash) server-side em 13.1. |
| 2.7-e | Upload base64 offline | `redesenhar` | Redesenha para upload direto pré-assinado (13.4/13.5). |
| 2.7-f | Sem hash/integridade, sem estado de upload | `redesenhar` | Adicionar hash + estados `pending_upload/uploaded/failed` (13.6/13.7). |
| 2.7-g | Segurança de upload: MIME confia no cliente, sem content sniffing, `mkdir(0777)` world-writable, pasta pública em `public/uploads`, sem `is_uploaded_file`/equivalente no path base64 | `redesenhar` | Validação server-side (magic bytes) + permissões seguras + storage privado + autorização por tenant/work-order + delivery não-público (13.1/13.3/13.4/13.5); **não preservar** comportamento inseguro. |

## 2.8 Localização e mapa

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.8-a | Mapa com pontos de OS/Tickets por `sites.lat/lng` | `redesenhar` | Usar `service_address.geometry` PostGIS; provedor de mapa pendente (D-102). |
| 2.8-b | Última posição conhecida (`last_*`) | `redesenhar` | Guardar **pontos** em `technician_locations` + última posição (12.3/12.4) — sem apagar histórico. |
| 2.8-c | Recência <5min/<60min/fresh/stale/old | `preservar` | Classes de recência úteis; **thresholds** `[OPERAÇÃO]` (R-034/D-103). |
| 2.8-d | `pingLocation` a cada 2min; `setInterval` 3min no plano de fundo de 1º plano | `redesenhar` | Criar regra de captura em 1º plano configurável, sem background contínuo (D-003/12.5). |
| 2.8-e | `recent_only` 4h | `adiar` | Filtro de mapa útil, não bloqueia fluxo feliz. |
| 2.8-f | White label `039` (marca/headline/público) | `descartar` (MVP) | White label fora do escopo do piloto; bloquear. |

## 2.9 Sincronização

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.9-a | Download incremental por `since`/`last_marker` | `preservar` | Conceito de delta mantido (10.4/11.1). |
| 2.9-b | Payload `cards + activities + sync` | `redesenhar` | DTO versionado com cursor/dependência (11.1). |
| 2.9-c | Fila local + envio em lote | `preservar` | Modelo local-first mantido (D-001). |
| 2.9-d | **Sem idempotência** (reenvio reaplica) | `redesenhar` | Adicionar `idempotency_key`/`sync_receipts` + resultados por item `applied/already_done/rejected/conflict/retry_later` (11.2/11.3). |
| 2.9-e | Sem conflito explícito (aplica sobre estado) | `redesenhar` | Conflito explícito para OS cancelada/concluída/reatribuída offline (11.6). |
| 2.9-f | Ordem por horário do dispositivo | `redesenhar` | Processar por dependência, não confiar no relógio (11.4). |
| 2.9-g | Remover da fila só após ACK? (legado marca `sent` sem garantia) | `redesenhar` | Remover da outbox só após ACK seguro + backoff (11.7). |

## 2.10 Indicadores / Dashboard

| # | Comportamento | Classificação | Justificativa |
| --- | --- | --- | --- |
| 2.10-a | `open_total/in_progress/completed_today/overdue` | `preservar` | Definições operacionais essenciais (15.1). |
| 2.10-b | `rework_total`, `redistributed_today`, `returns_today` | `preservar` | Indicadores de qualidade (15.1/17.1). |
| 2.10-c | `queueSummary` por colunas | `preservar` | Filas operacionais (15.7). |
| 2.10-d | `unassigned_total`, `awaiting_execution_total` | `preservar` | Indicadores de fila sem técnico / aguardando. |
| 2.10-e | BI avançado (`biSummary`, rankings, aging, status series, rework causes) | `adiar` | Relatórios essenciais (17.1) entram; BI avançado/executivo bloqueado até gate (17.8). |
| 2.10-f | **Técnico parado** — não existe indicador único | `redesenhar` (definir) | CrewOps define "técnico parado" (15.2/3.8) com base em `last_sync` reportado + disponibilidade `[OPERAÇÃO]` (R-034). |
| 2.10-g | `seen_24h` / `boardSummary` como proxy de atividade | `adiar` | Uso futuro; dependerá de `last_sync` do dispositivo. |

---

## Regras de negócio a preservar como requisito (resumo)

- Fluxo ticket → OS avulsa/vinculada; ciclo de status do ticket e da OS.
- GPS obrigatório em check-in/check-out; evidências por tipo.
- Fila offline + sync incremental; disponibilidade do técnico.
- Indicadores de atraso, rework, sem técnico, concluídos hoje.

> A confirmação das classes é gate de **produto/operação/arquitetura** (R-001/R-002/R-003). Decisões que derivam destas classes vão para `docs/DECISION_LOG.md` (D-IDs) e pendências numéricas para `docs/PILOT_RATIFICATIONS.md` (R-IDs).

---

## Documentos vinculados

- `docs/BUSINESS_RULES.md` — regras extraídas (2.1–2.10).
- `docs/LEGACY_INVENTORY.md` — inventário detalhado.
- `docs/TRACEABILITY_MATRIX.md` — matriz 2.12 fonte→regra→spec→tarefa→teste.
- `docs/DECISION_LOG.md` — decisões associadas.
- `docs/PILOT_RATIFICATIONS.md` — pendências de valores (R-IDs).
