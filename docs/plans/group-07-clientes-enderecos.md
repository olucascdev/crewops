# Plano Grupo 7 - Clientes e enderecos de atendimento

> Escopo: tarefas 7.1-7.6 do OpenSpec `migrar-fieldops-para-crewops-mvp`.
> Fontes: `specs/customer-service-addresses/spec.md`, `docs/REQUIRED_FIELDS.md`, `docs/API_CONTRACT.md`, `docs/DATABASE_MAP.md` e `packages/db/src/schema.ts`.
> Pre-condicao: Grupo 6 compilando, com sessao, isolamento por empresa e RBAC aplicados. Nao iniciar implementacao antes desse gate.

## Resultado esperado

O painel administra clientes de uma empresa e seus varios enderecos de atendimento. A API e a UI tratam cliente e endereco como entidades distintas, preservam isolamento organizacional e aceitam endereco sem coordenadas. A OS futura referencia o endereco e guarda um snapshot operacional no momento definido pelo Grupo 8.

## Contratos e regras imutaveis

- `customer` e `service_address` sao recursos separados; um cliente pode ter varios enderecos.
- Toda leitura e escrita e filtrada por `company_id`; `branch_id` restringe o contexto quando aplicavel.
- Cliente exige `name` com 2-180 caracteres; documento e e-mail seguem a decisao pendente D-109. Ate ratificacao, respeitar a constraint atual `(company_id, document)` e permitir `document` nulo.
- Endereco exige `customer_id`, `label`, `street`, `city` e `state`; CEP e coordenadas sao opcionais.
- Latitude/longitude, quando presentes, devem ser gravadas junto com `geometry(Point,4326)` em uma unica operacao. Nunca criar coordenada artificial.
- Exclusao e soft delete; buscas e relacionamentos operacionais ignoram registros com `deleted_at` sem apagar historico.
- Respostas seguem `/api/v1`, envelope de erro estavel e paginacao ordenada por chave estavel (`created_at DESC, id DESC`).

## Implementacao por tarefa

### 7.1 API de customers e service-addresses

1. Criar `packages/shared/src/customer.ts` e `service-address.ts` com schemas Zod para create, update, lista e filtros. Re-exportar em `packages/shared/src/index.ts`.
2. Criar `apps/api/src/customers` e `apps/api/src/service-addresses` com module, controller, service, repository e DTOs que reutilizem os schemas compartilhados.
3. Expor `GET/POST/PATCH/DELETE /customers` e `/service-addresses`; `GET /customers/:id/service-addresses` deve ser a consulta principal para a tela do cliente.
4. Aplicar `AuthenticatedGuard`, `CompanyGuard`, `BranchGuard` e `RoleGuard` em todas as rotas. Repositories recebem sempre o escopo da sessao, nunca `companyId` confiado do corpo.
5. Converter violacoes de unicidade e FKs em `CONFLICT` ou `VALIDATION_ERROR`, sem vazar dados de outra empresa.

### 7.2 Painel de cliente e multiplos enderecos

1. Criar rotas protegidas no painel: `/painel/clientes`, `/painel/clientes/novo` e `/painel/clientes/[id]`.
2. Construir cliente de API com cookies/CSRF e tratamento central de `401/403` herdado do Grupo 6.
3. Na lista, oferecer busca, paginacao e filtros de status/filial; no detalhe, mostrar dados do cliente e a lista de enderecos sem duplicar o cadastro do cliente.
4. Formularios devem usar os schemas compartilhados para feedback local, mas manter a API como validacao autoritativa.

### 7.3 PostGIS e endereco sem GPS

1. Implementar um adaptador de conversao seguro entre latitude/longitude e `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`.
2. Validar faixas geograficas e exigir ambos os valores quando um for informado; valores ausentes mantem `geometry`, latitude e longitude nulos.
3. Criar consulta espacial somente quando houver necessidade concreta: leitura por bounding box para Grupo 15. Nao introduzir geocoding externo neste grupo.
4. Testar que um endereco sem GPS pode ser criado, lido e vinculado em preparacao para OS.

### 7.4 Snapshot historico

1. Definir no contrato o payload normalizado `addressSnapshot` com `label`, endereco postal, coordenadas opcionais e instrucoes de acesso.
2. Implementar no service uma funcao pura `snapshotServiceAddress(address)`; ela sera chamada pela criacao de OS no Grupo 8, nao pelo PATCH do endereco.
3. Garantir que alterar ou desativar o endereco nao modifique `work_orders.address_snapshot` existente.

### 7.5 Busca e indices

1. Usar inicialmente os indices existentes para documento, filial/status e chaves de empresa.
2. Implementar busca case-insensitive e normalizada por nome, documento, codigo externo se o campo existir no schema aprovado, e termos postais do endereco.
3. Medir o plano de consulta com massa de piloto antes de criar indice adicional. Se necessario, criar migration reversivel para `lower(name)`/trigrama, documentando o motivo e a consulta atendida.

### 7.6 Testes

- Unitarios: schemas, normalizacao de busca e conversao de ponto/snapshot.
- Integracao: CRUD, pagina ordenada, documento duplicado, soft delete, tenant A contra tenant B, endereco sem coordenada e geometria valida.
- Regressao historica: criar snapshot, alterar endereco e provar que a OS concluida conserva o contexto original.
- E2E: criar cliente, adicionar dois enderecos, editar um deles e consultar o detalhe no painel.

## Arquivos previstos

- `packages/shared/src/customer.ts`, `packages/shared/src/service-address.ts` e testes correspondentes.
- `apps/api/src/customers/**`, `apps/api/src/service-addresses/**` e testes unitarios/integracao.
- `apps/web/src/app/painel/clientes/**`, `apps/web/src/lib/api/**` e testes de UI/E2E.
- Migration Drizzle apenas se a decisao de busca exigir novo indice; nao alterar schema por conveniencia.

## Criterio de conclusao

As tarefas 7.1-7.6 so podem ser marcadas apos build/typecheck verdes, migrations verificadas, testes de isolamento e de PostGIS executados e um fluxo de painel comprovando varios enderecos sem coordenada. D-109 e a obrigatoriedade de CEP/coordenadas continuam explicitamente pendentes, sem suposicoes no codigo.
