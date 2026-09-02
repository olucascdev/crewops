# Governança do Piloto CrewOps

> Change: `crewops/openspec/changes/migrar-fieldops-para-crewops-mvp/` — Tarefa 1.1
> Data de registro: **2026-09-01**
> Status: **PENDENTE de aprovação** (nomeações registradas em `docs/PILOT_RATIFICATIONS.md` — R-001 a R-005).
> Este documento é uma **proposta de governança**. Os **papéis** abaixo são reais (funções/cargos); os **nomes, contatos e delegados-pessoa** são **PENDENTES** e **não existem no workspace**. A **função de delegado** e sua alçada estão definidas (nível de papel). Nenhum nome, e-mail, Slack ou assinatura aqui é real. A nomeação de cada papel está registrada como pendência datada (R-001 a R-005) com dono, prazo e impacto; **nenhuma aprovação foi concedida**.

## Objetivo

Estabelecer quem decide cada tema crítico do piloto, quem substitui a pessoa na ausência e como um bloqueio é escalado, para que nenhuma decisão essencial dependa de improviso.

## Papéis e Responsabilidades

> Coluna "Nome (placeholder)" indica que a nomeação de **pessoa física**, contato e **delegado-pessoa** está **PENDENTE** e apontada para um R-ID em `docs/PILOT_RATIFICATIONS.md` (R-001 a R-005). O papel **já é o dono por função**; falta a pessoa imputável. O **delegado em ausência (função)** já está definido em nível de papel na seção "Delegados por papel (nível de função)" — é um cargo/função permanente, **não** um nome de pessoa. Definir a função de delegado **não** resolve R-001 a R-005; esses R-IDs seguem PENDING até a nomeação da **pessoa** (responsável, contato e delegado-pessoa).

| Papel | Nome (placeholder) | Função | Contato | Decisões sob alçada | Delegado em ausência (função) | Delegado em ausência (pessoa) | Nomeação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Product Owner / Produto** | **PENDENTE** | Dono do escopo, do "porquê" e da experiência do piloto | **PENDENTE** | Escopo do MVP; o que é bug crítico vs melhoria; textos de vendas/UI; priorização de backlog; critérios de sucesso de produto | Product Owner Adjunto | **PENDENTE** | [R-001](PILOT_RATIFICATIONS.md) |
| **Liderança de Operação** | **PENDENTE** | Representa despachantes, gestores e técnicos que usam o sistema | **PENDENTE** | Recorte de empresa/filiais/volumes; thresholds operacionais; fluxos reais; erro aceitável em campo; comportamento do mapa e da agenda | Gestor de Operações de turno | **PENDENTE** | [R-002](PILOT_RATIFICATIONS.md) |
| **Arquiteto técnico** | **PENDENTE** | Dona da stack, dos contratos e dos limites do PWA | **PENDENTE** | Escolha S3/R2; provedor de mapa/geocodificação; modelo de dados; limites de offline; quando app nativo é necessário | Arquiteto de Soluções Pleno (adjunto técnico) | **PENDENTE** | [R-003](PILOT_RATIFICATIONS.md) |
| **Dados / Migração** | **PENDENTE** | Dono da extração, transformação, reconciliação e carga | **PENDENTE** | Recorte histórico; qualidade e limpeza dos dados; mapeamento legado→CrewOps; regras de staging/reconciliação | Engenheiro de Dados Sênior | **PENDENTE** | [R-004](PILOT_RATIFICATIONS.md) |
| **Decisão de corte e rollback** | **PENDENTE** | Autoriza o desligamento progressivo do FieldOps e o rollback | **PENDENTE** | Janela de corte; gatilhos de rollback; aceite operacional; runbook de contingência | Coordenador de Contingência/Operações | **PENDENTE** | [R-005](PILOT_RATIFICATIONS.md) |

## Delegados por papel (nível de função)

> O delegado abaixo é **um papel/função permanente**, não uma pessoa. Ele passa a **existir como função** mesmo antes de a pessoa ser nomeada, para que o escalonamento tenha destinatário funcional (alçada e autoridade de escalonamento definidas). A **pessoa** que ocupa essa função ainda está **PENDENTE** e registrada no R-ID correspondente (R-001 a R-005). Definir a função **não** aprova nada; cria a estrutura de cobertura e de escalonamento.

| Papel | Delegado (função) | Alçada enquanto cobre | Autoridade de escalonamento | Dono da nomeação (função) | Prazo (âncora) | Registro de nomeação |
| --- | --- | --- | --- | --- | --- | --- |
| **Produto** | Product Owner Adjunto | Decidir escopo, priorização de backlog, textos de vendas/UI e classificação bug crítico vs melhoria. **NÃO** pode alterar baseline/critérios de sucesso do piloto nem abrir nova fase sem pauta registrada. | Se não resolver em 48h úteis: sobe para o decisor final de Produto + Arquitetura (pauta de gate em `DECISION_LOG.md`). | Liderança de Produto | Gate Fase 0 — 2026-09-30 | [R-001](PILOT_RATIFICATIONS.md) |
| **Operação** | Gestor de Operações de turno | Validar thresholds operacionais, fluxos reais, erro aceitável em campo e comportamento de mapa/agenda. **NÃO** pode fechar o recorte definitivo de empresa/filiais/volumes sem confirmar com o decisor de Operação. | Se não resolver em 48h úteis: sobe para o decisor final de Operação + Produto (pauta de gate em `DECISION_LOG.md`). | Liderança de Operação | Gate Fase 0 — 2026-09-30 | [R-002](PILOT_RATIFICATIONS.md) |
| **Arquitetura** | Arquiteto de Soluções Pleno (adjunto técnico) | Decidir alternativas técnicas dentro das opções aprovadas e rever limites de PWA/offline. **NÃO** pode fechar contrato de fornecedor (S3/R2, mapa/geocodificação) nem introduzir dependência nova sem revisão do decisor. | Se não resolver em 48h úteis: sobe para o decisor final de Arquitetura + Produto (pauta de gate em `DECISION_LOG.md`). | Liderança Técnica | Gate Fase 0 — 2026-09-30 | [R-003](PILOT_RATIFICATIONS.md) |
| **Dados / Migração** | Engenheiro de Dados Sênior | Definir consultas, regras de reconciliation/staging e mapeamento legado→CrewOps. **NÃO** pode escolher o recorte histórico da migração sem confirmar utilidade com Operação (D-104). | Se não resolver em 48h úteis: sobe para o decisor final de Dados + Arquitetura (pauta de gate em `DECISION_LOG.md`). | Liderança de Dados | Gate Fase 0 — 2026-09-30 | [R-004](PILOT_RATIFICATIONS.md) |
| **Corte / Rollback** | Coordenador de Contingência/Operações | Executar/ensaiar o rollback conforme runbook e registrar aceite operacional. **NÃO** pode autorizar o corte de produção nem o desligamento do FieldOps sem pauta de gate registrada (Fase 7). | Se não resolver em 48h úteis: sobe para o decisor final de Corte + Produto + Operação (pauta de gate em `DECISION_LOG.md`). | Liderança de Operação (papel Corte) | Gate Fase 0 — 2026-09-30 | [R-005](PILOT_RATIFICATIONS.md) |

## Regra de decisão final por tema

| Tema | Decisor final | Consulta obrigatória |
| --- | --- | --- |
| Escopo / critérios de sucesso | Produto | Operação + Arquitetura |
| Recorte operacional e thresholds | Operação | Produto + Dados |
| Stack, contratos e limites do PWA | Arquitetura | Produto |
| Dados e migração | Dados | Arquitetura + Operação |
| Corte e rollback | Corte | Produto + Operação + Arquitetura + Dados |

Em caso de divergência, a última palavra é do **decisor final do tema**, registrado na tabela acima. Não há "dupla liderança" para um mesmo tema nesta governança. Enquanto a pessoa do decisor não for nomeada (R-001 a R-005), **nenhuma decisão de gate é efetiva** — a decisão fica registrada como pendência.

## Decisões já tomadas (registradas em design.md / project.md)

> Datas de registro: **2026-09-01** (data em que estas decisões foram registradas neste documento/log). Referem-se a decisões já descritas em `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md`.

| Decisão | Fonte | Status |
| --- | --- | --- |
| PWA do técnico é local-first (ação nasce local, sync depois) | `openspec/project.md`, `docs/OFFLINE_SYNC_STRATEGY.md` | Registrada em design (proposta) — confirmar com Produto |
| Eventos operacionais são a verdade auditável; `work_orders.status` é projeção atual | `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` (Decisão 4) | Registrada em design |
| GPS é por evento + última posição conhecida; sem rastreamento contínuo no PWA | `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` (Decisão 9), `docs/ARCHITECTURE.md` | Registrada em design e arquitetura |
| Evidências via upload direto com URL pré-assinada e confirmação em duas etapas | `openspec/changes/migrar-fieldops-para-crewops-mvp/design.md` (Decisão 8) | Registrada em design (fornecedor S3/R2 pendente — ver `DECISION_LOG.md` D-101) |

## Como escalar um bloqueio de gate

1. Abrir a dúvida com o **decisor do tema** (tabela de papel). O destinatário funcional é o `Papel`; o contato da pessoa está **PENDENTE** (R-001 a R-005).
2. Se não resolvida em **48h úteis**, acionar o **delegado do papel** pela **função** definida na seção "Delegados por papel (nível de função)" (a alçada e a autoridade de escalonamento já estão definidas). A **pessoa** que ocupa a função ainda está **PENDENTE** (R-001 a R-005).
3. Se persistir, subir para o **decisor final + Produto** como pauta de gate; a decisão é registrada em `DECISION_LOG.md` antes de a fase avançar.
4. Nenhuma fase avança com decisão essencial em aberto **sem** dono e prazo registrados.

> **Impacto da pendência de nomeação:** a **função** de delegado, sua alçada e o caminho de escalonamento já estão definidos — o processo tem destinatário funcional. Ainda assim, enquanto R-001 a R-005 estiverem PENDING, **não há pessoa imputável** para o contato do papel nem para ocupar a função de delegado; a cobertura e a autorização assinada continuam sem imputado até a nomeação. O bloqueio de gate segue sem destinatário **nomeado**.

## Critério de aprovação deste documento

- **Delegado (função)** por papel definido na seção "Delegados por papel (nível de função)": **SIM** — as cinco funções, alçadas, autoridades de escalonamento, dono da nomeação e prazo já estão registrados e vinculados a R-001 a R-005 (status PENDING hoje).
- **Nome, contato e delegado-pessoa** dos cinco papéis preenchidos → **registrado como R-001 a R-005 (PENDING)**, data-alvo **2026-09-30** (Gate Fase 0). Nenhuma pessoa está nomeada.
- Aprovação explícita registrada (nesta seção de "Status" ou em `DECISION_LOG.md`) por pelo menos **dois papéis críticos**: Produto + (Operação ou Arquitetura) → **PENDENTE**, aguardando nomeação (R-001/R-002/R-003).
- Nenhum segredo, token ou dado pessoal de produção no arquivo.

> **Status atual:** **função de delegado definida**; **nomeação/contato/delegado-pessoa PENDENTES** (R-001 a R-005). Aprovação **NÃO** concedida. Registro datado: **2026-09-01**.

## Documentos vinculados

- `docs/ACCEPTANCE_PLAN.md` — quem aprova cada gate de fase.
- `docs/MVP_SCOPE.md` — recorte aprovado do piloto.
- `docs/DECISION_LOG.md` — decisões e pendências com dono e prazo.
- `docs/PILOT_RATIFICATIONS.md` — nomeações e aprovações pendentes (R-001 a R-034).
