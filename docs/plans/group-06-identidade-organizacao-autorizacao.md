# Plano Grupo 6 — Identidade, organização e autorização

> Escopo: tarefas 6.1–6.8 do OpenSpec `migrar-fieldops-para-crewops-mvp`.
> Fontes de verdade: `specs/identity-access/spec.md`, `specs/organization-branches/spec.md`, `docs/PERMISSIONS_MATRIX.md`, `docs/API_CONTRACT.md`, `docs/REQUIRED_FIELDS.md`, `docs/DATABASE_MAP.md`, `packages/db/src/schema.ts`.
> Legado PHP: consultado apenas como referência funcional (`app/Controllers/BaseController.php`, `app/Controllers/Admin/UserController.php`, `app/Controllers/Admin/TechnicianController.php`, `app/Models/User.php`, `app/Models/WorkOrder.php`). Não copiar arquitetura.

---

## Status de implementação (auditoria em 2026-09-02)

O Grupo 6 foi iniciado, mas **não está concluído nem executável**. As tarefas em
`openspec/.../tasks.md` permanecem corretamente desmarcadas.

### Onde a implementação parou

- Foram criados contratos compartilhados (`auth`, `user`, `organization`,
  `technician`, `roles`), o esqueleto de `auth`, os guards, a infraestrutura de
  banco e o `AuditService`.
- A interrupção aconteceu antes de conectar esses artefatos ao aplicativo:
  `AuthModule`, `OrganizationsModule`, `UsersModule`, `TechniciansModule` e seus
  controllers/services/repositories não existem, e `AppModule` ainda só registra
  as rotas antigas de health/operations.
- Não há implementação em `apps/web` para login, redirecionamento, logout,
  limpeza local ou CRUD de filiais, usuários e técnicos.
- O stub temporário de ownership previsto para 6.8 também não foi criado; existe
  somente o `TechnicianOwnershipGuard`, ainda sem rota e sem testes.

### Bloqueadores encontrados

- `npm run typecheck -w @crewops/api` falha. Os arquivos de `auth` referenciam
  `../../common` e `../../infra`, que apontam fora de `src`; os imports devem ser
  corrigidos antes de qualquer execução.
- `AuthController` usa `@Body(...)`, mas não importa `Body` de `@nestjs/common`.
- `SessionRepository` usa o tipo `schema.Session`, que não é exportado por
  `@crewops/db`.
- O workspace está em CommonJS e `@nestjs/jwt` é ESM, causando erro TS1479. A
  configuração de módulo ou a estratégia de carregamento dessa dependência ainda
  precisa ser decidida e implementada.
- Não há testes do Grupo 6; os testes atuais de API não cobrem login, revogação,
  isolamento organizacional, RBAC ou ownership de OS.

### Próxima retomada

Retomar pela sequência 4–7 deste plano: corrigir a compilação e os imports,
registrar/conectar `AuthModule` e `InfraModule` no `AppModule`, habilitar
`cookie-parser`/CSRF em `main.ts` e só então validar o fluxo de autenticação.
Depois disso, implementar os módulos `organizations`, `users` e `technicians`
antes de iniciar qualquer UI em `apps/web`.

---

## Decisões de canal de sessão (a registrar em `docs/DECISION_LOG.md`)

- **Painel e PWA usam o mesmo mecanismo**: cookie `HttpOnly` + `Secure` + `SameSite=Strict` para access token e refresh token, mais double-submit CSRF cookie para mutações.
- Access token JWT com TTL curto (15 min). Refresh token opaco (256 bits) persistido como hash em `sessions.refresh_token_hash`.
- Cada requisição autenticada valida o JWT **e** consulta `sessions` para garantir que a sessão não foi revogada/expirada.
- `logout` limpa cookies e grava `revoked_at`. Troca de usuário/revogação também invalida sessões ativas.

> Decisões não resolvidas: escopo de unicidade de e-mail (empresa vs global — `REQUIRED_FIELDS.md` D-109); se `gestor_operacional` pode gerenciar filiais/filiais (matriz atual dá `RL`); se PWA usará header `Authorization` no futuro. Este grupo segue cookie para ambos os canais.

---

## 6.1 Implementar módulos `auth`, `organizations` e `users`

### Objetivo e comportamento esperado
- Módulos NestJS isolados em `apps/api/src/auth`, `apps/api/src/organizations`, `apps/api/src/users`.
- DTOs validados com Zod (reutilizando `packages/shared`) e `ZodValidationPipe`.
- Serviços desacoplados de HTTP e testáveis (repository pattern com Drizzle).
- `auth` cuida de credenciais, sessão, tokens e CSRF.
- `organizations` cuida de empresa e filiais.
- `users` cuida de usuários do painel.

### Comportamento atual relevante
- `apps/api/src/modules/app.module.ts` só registra `HealthController` e `OperationsController`.
- `apps/api/src/config.ts` deixa `JWT_SECRET` opcional (comentário: “validado pelo grupo 6”).
- `packages/db/src/schema.ts` já tem `companies`, `branches`, `users`, `sessions`, `technicians`, `audit_logs`.
- `packages/shared/src/index.ts` exporta `userRoles`, `errorCodes`; `packages/shared/src/schemas.ts` exporta `uuidString`, `utcTimestampString`.

### Arquivos envolvidos e a criar
**Existentes**:
- `apps/api/src/modules/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/config.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/index.ts`
- `packages/shared/src/index.ts`, `packages/shared/src/schemas.ts`

**Criar**:
- `apps/api/src/common/pipes/zod-validation.pipe.ts`
- `apps/api/src/common/filters/http-exception.filter.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`
- `apps/api/src/common/guards/authenticated.guard.ts`
- `apps/api/src/common/guards/company.guard.ts`
- `apps/api/src/common/guards/branch.guard.ts`
- `apps/api/src/common/guards/role.guard.ts`
- `apps/api/src/common/utils/password.ts`
- `apps/api/src/common/utils/tokens.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/token.service.ts`
- `apps/api/src/auth/session.repository.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/dto/session.dto.ts`
- `apps/api/src/organizations/organizations.module.ts`
- `apps/api/src/organizations/branches.controller.ts`
- `apps/api/src/organizations/branches.service.ts`
- `apps/api/src/organizations/branches.repository.ts`
- `apps/api/src/organizations/dto/branch.dto.ts`
- `apps/api/src/users/users.module.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.repository.ts`
- `apps/api/src/users/dto/user.dto.ts`
- `apps/api/src/audit/audit.service.ts`
- `packages/shared/src/auth.ts`
- `packages/shared/src/user.ts`

### Trabalho backend / frontend / DB / migração / dependências
**Backend**:
- `loadConfig` em `config.ts`: tornar `JWT_SECRET` obrigatória; falhar com `ConfigError` se vazio.
- Adicionar dependências em `apps/api/package.json`: `@nestjs/jwt`, `bcrypt`, `cookie-parser`, `@types/cookie-parser`, `@types/bcrypt`, `rate-limiter-flexible`.
- `TokenService`: sign/verify JWT access token; gerar refresh token opaco (32 bytes hex); payload `{ sub, companyId, branchId, role, sessionId, type }`.
- `PasswordUtils`: `hash(password)` com bcrypt cost 12; `verify(password, hash)`.
- `SessionRepository`: criar sessão, buscar por refresh token hash, revogar, limpar expiradas.
- `AuthService`: login, refresh, logout, me.
- `AuditService`: inserir em `audit_logs` dentro da transação de domínio.
- `ZodValidationPipe`: usa schema Zod; retorna `VALIDATION_ERROR` 422 com `details`.

**Frontend**:
- Nenhuma UI nesta subtask (prepara API).

**DB / migração**:
- Nenhuma alteração de schema (já modelado no Grupo 5). Re-gerar migrations somente se schema mudar — não deve.

### Validações, autorização, erros, integridade, sessão
- Login: `email` deve existir na empresa, status `active`, senha correta.
- Senha: mínimo 8 caracteres no DTO.
- Erro de login propositalmente genérico: “credenciais inválidas”; não expor se e-mail existe.
- Rate-limit de login: 5 tentativas / 15 min por IP.
- Em caso de sucesso, criar sessão com `company_id`, `branch_id`, `role`, `ip_hash` (sha256 do IP), `user_agent`.

### Riscos e mitigações
- `JWT_SECRET` vazio em dev → `ConfigError` clara.
- Dependência nativa do bcrypt falhando em CI → usar imagem Node compatível ou fallback para `node:crypto` scrypt se necessário.
- DTOs duplicados entre API e shared → manter shared como fonte nominal; API importa e estende quando necessário.

### Testes
- **Unitário**: `password.ts` hash/verify; `token.service` sign/verify; `ZodValidationPipe` com schemas válidos/inválidos.
- **Integração**: login com senha correta/incorreta; sessão criada; refresh; logout revoga.
- Critério: `npm run test:unit -w @crewops/api` e `npm run test:integration -w @crewops/api` verdes.

### Critério de conclusão
- Módulos compilam; DTOs rejeitam payloads inválidos; login/logout/refresh funcionam via API; `JWT_SECRET` obrigatório.

---

## 6.2 Login, renovação/validação e revogação de sessão

### Objetivo e comportamento esperado
- `POST /api/v1/auth/login` → autentica, cria sessão, seta cookies `access_token`, `refresh_token`, `csrf_token`.
- `POST /api/v1/auth/refresh` → lê `refresh_token`, valida hash, emite novo access token.
- `POST /api/v1/auth/logout` → revoga sessão e limpa cookies.
- `GET /api/v1/auth/me` → retorna `{ id, name, email, companyId, branchId, role }`.
- `GET /api/v1/auth/csrf` → retorna token CSRF para o cliente (também presente no cookie).

### Comportamento atual relevante
- `apps/api/src/main.ts` habilita CORS com `credentials: true`.
- `packages/db/src/schema.ts`: `sessions.refresh_token_hash`, `expires_at`, `revoked_at`.
- `docs/API_CONTRACT.md` §6 define cookie seguro + CSRF.

### Arquivos envolvidos e a criar
**Existentes**:
- `apps/api/src/main.ts`
- `apps/api/src/config.ts`
- `packages/db/src/schema.ts`

**Criar**:
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/token.service.ts`
- `apps/api/src/auth/session.repository.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/dto/session.dto.ts`
- `packages/shared/src/auth.ts`

### Trabalho backend / frontend / DB / migração / dependências
**Backend**:
- Instalar `cookie-parser` e registrar em `main.ts`.
- Cookie config:
  - `access_token`: `HttpOnly`, `Secure` em produção, `SameSite=Strict`, maxAge 15 min.
  - `refresh_token`: `HttpOnly`, `Secure`, `SameSite=Strict`, maxAge 7 dias.
  - `csrf_token`: **não** `HttpOnly`, `Secure`, `SameSite=Strict`, maxAge 7 dias.
- Refresh: verificar hash em `sessions`, rejeitar se `revoked_at` ou expirado.
- Logout: `revoked_at = now()` e limpar cookies com maxAge 0.

**Frontend**:
- Cliente fetch com `credentials: 'include'`; ler `csrf_token` do cookie e enviar no header `x-csrf-token` em POST/PUT/PATCH/DELETE.

**DB / migração**:
- Nenhuma alteração de schema.

### Validações, autorização, erros, integridade, sessão
- Login: `VALIDATION_ERROR` 422 para campos malformados; `UNAUTHORIZED` 401 para credenciais inválidas.
- Refresh: `UNAUTHORIZED` se cookie ausente/inválido/sessão revogada.
- Logout: idempotente — sessão já revogada retorna 200.
- Proteger contra reutilização de refresh token: ao usar refresh, atualizar `expires_at` e, opcionalmente, rotacionar hash. Para este grupo, manter hash e estender expiração (mitigação simples).

### Riscos e mitigações
- Token access curto reduz janela pós-revogação.
- CSRF double-submit cookie simples, sem estado servidor.
- Rate limit em login mitiga força bruta.

### Testes
- **Integração**: login seta cookies; refresh emite novo access; logout revoga; chamada com access revogado retorna 401.
- **E2E**: login com usuários seed; redirecionamento (prepara 6.5).

### Critério de conclusão
- Cookies presentes após login; `/auth/me` funciona; refresh e logout corretos; sessão revogada nega acesso.

---

## 6.3 Guards de empresa, filial e perfil

### Objetivo e comportamento esperado
- `AuthenticatedGuard`: verifica JWT e sessão ativa no banco.
- `CompanyGuard`: rejeita acesso a recursos de outra `company_id`; usa `companyId` do usuário.
- `BranchGuard`: rejeita acesso a filial diferente da do usuário, exceto para `admin` e `gestor_operacional` em leitura.
- `RoleGuard`: rejeita se perfil não está na lista permitida.
- Guards combináveis via `@UseGuards` em controllers.
- Interface omitir botão não substitui guard.

### Comportamento atual relevante
- Nenhum guard existe.
- `docs/PERMISSIONS_MATRIX.md` define ações por perfil (ainda `PENDING`, mas MVP adota perfis fixos).
- `packages/shared/src/index.ts`: `userRoles`.

### Arquivos envolvidos e a criar
**Criar**:
- `apps/api/src/common/guards/authenticated.guard.ts`
- `apps/api/src/common/guards/company.guard.ts`
- `apps/api/src/common/guards/branch.guard.ts`
- `apps/api/src/common/guards/role.guard.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`

### Trabalho backend
- `AuthenticatedGuard`: extrai `access_token` do cookie; verifica JWT; busca sessão no banco (`revoked_at IS NULL`, `expires_at > now()`); anexa `req.user`.
- `CompanyGuard`: compara `req.user.companyId` com `req.params.companyId` / `req.body.companyId` / recurso. Se recurso não especifica empresa, assume empresa do usuário.
- `BranchGuard`: se `branchId` presente, `req.user.branchId === branchId` OU `role ∈ ['admin', 'gestor_operacional']` para GET. Escrita só `admin`.
- `RoleGuard`: `@Roles('admin','gestor_operacional')` → `req.user.role` incluído.
- Decorador `@CurrentUser()` injeta `req.user`.

### Validações, autorização, erros
- Acesso cross-company → `FORBIDDEN` 403 (não 404) para não vazar existência.
- Acesso cross-branch → `FORBIDDEN`.
- Perfil incompatível → `FORBIDDEN`.
- Sessão inválida/revogada → `UNAUTHORIZED`.

### Riscos e mitigações
- `AuthenticatedGuard` faz consulta SQL a cada request → índices em `sessions` já existem; cache leve pode ser adicionado depois.
- Matriz ainda pendente → implementar regras mínimas do MVP; ajustar após ratificação.

### Testes
- **Unitário**: cada guard com mocks de `ExecutionContext`.
- **Integração**: usuário da empresa A tenta acessar recurso da empresa B; técnico tenta acessar filial diferente; role incompatível retorna 403.
- Cobrir “interface omite ação”: testar POST direto sem ação na UI.

### Critério de conclusão
- Todas as rotas protegidas aplicam guards; testes de negação passam.

---

## 6.4 CRUD mínimo de filial e associação usuário/técnico no painel

### Objetivo e comportamento esperado
- Painel web permite:
  - listar, criar, editar, desativar filiais (`/admin/filiais`);
  - listar usuários, criar usuário com perfil (`/admin/usuarios`);
  - associar usuário a técnico (`/admin/tecnicos`).
- API expõe:
  - `GET/POST/PATCH/DELETE /api/v1/branches`
  - `GET/POST/PATCH/DELETE /api/v1/users`
  - `GET/POST/PATCH/DELETE /api/v1/technicians`

### Comportamento atual relevante
- `apps/web/src/app/page.tsx` é dashboard estático sem autenticação.
- `packages/db/src/schema.ts`: `branches`, `users`, `technicians`, `userRole` enum.
- Legado `TechnicianController.php`: valida `user_id` único por tenant (`userAlreadyLinked`).

### Arquivos envolvidos e a criar
**Backend**:
- `apps/api/src/organizations/branches.controller.ts`
- `apps/api/src/organizations/branches.service.ts`
- `apps/api/src/organizations/branches.repository.ts`
- `apps/api/src/organizations/dto/branch.dto.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.repository.ts`
- `apps/api/src/users/dto/user.dto.ts`
- `apps/api/src/technicians/technicians.module.ts`
- `apps/api/src/technicians/technicians.controller.ts`
- `apps/api/src/technicians/technicians.service.ts`
- `apps/api/src/technicians/technicians.repository.ts`
- `apps/api/src/technicians/dto/technician.dto.ts`

**Frontend**:
- `apps/web/src/app/admin/filiais/page.tsx`
- `apps/web/src/app/admin/filiais/branch-form.tsx`
- `apps/web/src/app/admin/usuarios/page.tsx`
- `apps/web/src/app/admin/usuarios/user-form.tsx`
- `apps/web/src/app/admin/tecnicos/page.tsx`
- `apps/web/src/app/admin/tecnicos/technician-form.tsx`
- `apps/web/src/lib/api/client.ts`

### Trabalho backend
- `branches`: validar `code` único por `company_id`; soft delete (`deleted_at`).
- `users`: validar e-mail, nome ≥3, role, status; `password_hash` gerado no create (senha temporária dev “crewops-dev-password” ou fornecida). Regra: um `user_id` só pode estar vinculado a um `technician` ativo por empresa.
- `technicians`: CRUD mínimo com `user_id`, `branch_id`, `phone`, `employee_id`, `status`, `availability_status`.

### Trabalho frontend
- Páginas client-side com formulários; chamadas para API com credenciais e CSRF.
- Listas simples com paginação.
- Redirecionar para `/login` se 401.

### Validações, autorização, erros, integridade
- `branch.code` uppercase/trim; `city`/`state` obrigatórios.
- `users.email` validado por Zod; rejeitar duplicado por empresa.
- `technicians.userId` único por empresa (constraint `technicians_company_id_user_id_unique` já existe).
- Ações protegidas por `RoleGuard` (ex.: só `admin` cria filial).

### Riscos e mitigações
- Soft delete de filial com dados históricos → `deleted_at` apenas; FKs `ON DELETE NO ACTION` preservam histórico.
- Associação técnico↔usuário incorreta → validação no service antes do insert.

### Testes
- **Integração**: CRUD filial; usuário; técnico; tentativa de duplicar vínculo usuário/técnico retorna `CONFLICT` 409.
- **E2E**: criar filial pelo painel; criar usuário; associar técnico.

### Critério de conclusão
- Painel permite gerenciar filiais, usuários e vínculo técnico; API respeita isolamento e regras de unicidade.

---

## 6.5 Experiência de login e redirecionamento entre painel e PWA técnico

### Objetivo e comportamento esperado
- Tela de login unificada em `/login`.
- Após login, backend retorna `role` no corpo; frontend redireciona:
  - `tecnico` → `/campo`
  - demais → `/painel`
- Se usuário já autenticado acessar `/login`, redireciona conforme role.

### Comportamento atual relevante
- `apps/web/src/app/page.tsx` é dashboard estático sem login.
- `apps/web/src/app/layout.tsx` renderiza `ClientEnvCheck`.

### Arquivos envolvidos e a criar
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/painel/page.tsx`
- `apps/web/src/app/campo/page.tsx`
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/lib/api/auth.ts`

### Trabalho backend
- `POST /auth/login` retorna `{ user: { id, name, email, role, companyId, branchId }, redirectTo: '/painel' | '/campo' }`.

### Trabalho frontend
- Client component `LoginPage` chama `/auth/login` com `credentials: 'include'`.
- Em sucesso, `router.push(redirectTo)`.
- `useAuth` verifica `/auth/me` no mount; redireciona se deslogado ou role incompatível.

### Validações, autorização, erros
- Login inválido exibe mensagem genérica.
- `campo` só acessível para `tecnico`; outras roles → `/painel`.
- `/painel` acessível para `admin`, `gestor_operacional`, `atendente`, `despachante`.

### Testes
- **E2E**: login como admin vai para `/painel`; login como técnico vai para `/campo`; acesso direto a `/campo` sem técnico retorna redirecionamento.
- **Integração**: `/auth/login` retorna `redirectTo` correto.

### Critério de conclusão
- Fluxo login → redirecionamento funciona nos 5 perfis; telas protegidas bloqueiam roles erradas.

---

## 6.6 Logout e limpeza de dados locais protegidos em troca/revogação de usuário

### Objetivo e comportamento esperado
- Botão logout chama `POST /auth/logout`, limpa cookies, limpa `localStorage` do domínio.
- Se API retornar 401/403, UI limpa estado local e redireciona para `/login`.
- Troca de usuário no mesmo dispositivo limpa dados anteriores antes de aceitar nova sessão.

### Arquivos envolvidos e a criar
- `apps/web/src/components/LogoutButton.tsx`
- `apps/web/src/lib/storage/clearLocalData.ts`
- `apps/web/src/hooks/useAuth.ts`

### Trabalho backend
- `POST /auth/logout` revoga sessão e seta cookies com `maxAge: 0`.

### Trabalho frontend
- `clearLocalData()`: remove `localStorage` keys prefixadas `crewops.*`.
- `LogoutButton`: chama logout, limpa storage, redireciona.
- `useAuth`: em 401/403, executa `clearLocalData()` e `router.push('/login')`.

### Validações, autorização, erros
- Logout sem cookie → 200 (idempotente).
- Não expor dados locais sem sessão válida.

### Testes
- **Unitário**: `clearLocalData` remove keys corretas.
- **E2E**: logout leva para login; `localStorage` limpo.

### Critério de conclusão
- Logout funciona; estado local limpo; sessão revogada não permite acesso.

---

## 6.7 Auditoria de login, revogação, mudança de perfil e tentativas negadas

### Objetivo e comportamento esperado
- Inserir registros em `audit_logs` para:
  - login bem-sucedido;
  - logout/revogação;
  - criação/edição/desativação de usuário;
  - mudança de perfil/role;
  - tentativas negadas relevantes (cross-company, cross-branch, técnico tentando acessar OS de outro técnico).
- Nunca logar senhas, tokens completos, bytes de evidência.

### Comportamento atual relevante
- `packages/db/src/schema.ts`: `audit_logs` com `resource`, `action`, `payload`, `ip_hash`, `user_agent`.
- Legado `UserController.php` grava `AuditLog::record('create', 'users', ...)`.

### Arquivos envolvidos e a criar
- `apps/api/src/audit/audit.service.ts`
- `apps/api/src/audit/audit.module.ts`

### Trabalho backend
- `AuditService.write(dto)` insere na mesma transação do domínio (receber `tx` opcional).
- Campos preenchidos:
  - `companyId`, `actorUserId`, `targetUserId`, `resource`, `action`, `resourceId`, `payload`, `ipHash`, `userAgent`, `occurredAt`.
- `payload` nunca inclui `password`, `token`, `refreshToken`.

### Trabalho frontend
- Nenhum.

### Validações, autorização, erros
- Auditoria é side-effect; falha não quebra resposta, mas deve logar erro interno.

### Testes
- **Integração**: após login, existe audit_log `auth.login`; após logout, `auth.logout`; após tentativa cross-company, `auth.denied`.
- Verificar que payload não contém tokens.

### Critério de conclusão
- Audit logs presentes para os eventos listados; dados sensíveis redigidos.

---

## 6.8 Testar isolamento organizacional, sessão revogada e técnico tentando acessar OS de outro técnico

### Objetivo e comportamento esperado
- Provar que:
  - usuário da empresa A não vê dados da empresa B;
  - sessão revogada nega acesso imediatamente;
  - técnico A não acessa OS atribuída ao técnico B.
- Como módulo `work-orders` (Grupo 8) ainda não existe, usar **endpoint stub temporário** `/api/v1/internal/test/work-orders/:id/ownership` que consulta `work_orders.technician_id` e aplica `TechnicianOwnershipGuard`. Será removido/substituído pelo módulo real.

### Comportamento atual relevante
- `packages/db/src/schema.ts`: `work_orders` com `company_id`, `branch_id`, `technician_id`.
- `docs/PERMISSIONS_MATRIX.md`: técnico só lê OS atribuídas a si.

### Arquivos envolvidos e a criar
- `apps/api/src/common/guards/technician-ownership.guard.ts`
- `apps/api/src/auth/test/technician-ownership-test.controller.ts` (stub)

### Trabalho backend
- `TechnicianOwnershipGuard`:
  - Requer `role === 'tecnico'`.
  - Busca `work_orders` pelo `id` dos parâmetros.
  - Rejeita `FORBIDDEN` se `technician_id !== req.user.technicianId`.
  - Rejeita `NOT_FOUND` se OS não existe na mesma empresa (não vazar existência).
- Stub controller expõe `GET /api/v1/internal/test/work-orders/:id/ownership` retornando `{ owned: true }`.

### Trabalho frontend
- Nenhum.

### Validações, autorização, erros
- Cross-company: `CompanyGuard` primeiro → 403.
- Sessão revogada: `AuthenticatedGuard` → 401.
- Técnico errado: `TechnicianOwnershipGuard` → 403 + audit log.

### Riscos e mitigações
- Stub exposto em produção → proteger com `NODE_ENV !== 'production'` ou documentar remoção no Grupo 8. Decisão: ativar apenas em `development`/`test`.

### Testes
- **Integração**:
  - seed duas empresas/filiais/usuários/técnicos; técnico A acessa OS de A; técnico A acessa OS de B → 403; usuário empresa A acessa recurso empresa B → 403; sessão revogada → 401.
- **E2E futuro**: stub não precisa de E2E agora.

### Critério de conclusão
- Testes de isolamento, revogação e ownership passam; stub documentado como temporário.

---

## Dependências a adicionar

### `apps/api/package.json`
- `@nestjs/jwt`
- `bcrypt`
- `cookie-parser`
- `rate-limiter-flexible`
- `@types/bcrypt`
- `@types/cookie-parser`

### `packages/shared/package.json`
- (já tem `zod`; adicionar schemas novos no código, sem nova dependência)

---

## Alterações em arquivos existentes

1. `apps/api/src/config.ts`: tornar `JWT_SECRET` obrigatório; ajustar teste `test/config.unit.spec.ts`.
2. `apps/api/src/main.ts`: registrar `cookie-parser` e CSRF middleware.
3. `apps/api/src/modules/app.module.ts`: importar `AuthModule`, `OrganizationsModule`, `UsersModule`, `TechniciansModule`, `AuditModule`.
4. `packages/db/src/seed.ts`: substituir `DEV_PASSWORD_HASH` (SHA-256) por `bcrypt.hashSync('crewops-dev-password', 12)`; manter comentário dev-only.
5. `packages/shared/src/index.ts`: re-exportar novos schemas se criados em arquivos separados.
6. `apps/web/src/app/layout.tsx`: envolver com provider de autenticação (cliente leve).

---

## Sequência de implementação

1. **Dependências**: `npm install -w @crewops/api @nestjs/jwt bcrypt cookie-parser rate-limiter-flexible` + types.
2. **Config**: exigir `JWT_SECRET`; atualizar `config.unit.spec.ts`.
3. **Utilitários compartilhados**: `password.ts`, `token.ts`, Zod schemas em `packages/shared`.
4. **Common API**: `ZodValidationPipe`, `HttpExceptionFilter`, decorators, guards (`Authenticated`, `Company`, `Branch`, `Role`).
5. **Audit**: `AuditService`.
6. **Auth module**: `AuthService`, `TokenService`, `SessionRepository`, `AuthController`, CSRF.
7. **Cookie-parser + CSRF middleware** em `main.ts`.
8. **Organizations module**: branches CRUD.
9. **Users module**: users CRUD.
10. **Technicians module**: technicians CRUD + vínculo usuário.
11. **App module**: registrar novos módulos.
12. **Seed**: atualizar hash de senha.
13. **Frontend auth**: `api/client.ts`, `useAuth`, `/login`, `/painel`, `/campo`, `LogoutButton`, limpeza local.
14. **Frontend admin**: `/admin/filiais`, `/admin/usuarios`, `/admin/tecnicos`.
15. **Stub 6.8**: `TechnicianOwnershipGuard` + controller temporário.
16. **Testes unitários/integração/E2E**.
17. **Validação final**.

---

## Comandos de validação

```bash
# Instalação e tipos
npm install
npm run build -w @crewops/shared
npm run build -w @crewops/db

# Lint e typecheck
npm run lint
npm run typecheck

# Banco
npm run db:migrate:check
npm run db:seed -- --reset

# Testes API
npm run test:unit -w @crewops/api
npm run test:integration -w @crewops/api

# Testes web
npm run test:unit -w @crewops/web

# E2E
npm run test:e2e -w @crewops/web

# Build completo
npm run build
```

---

## Decisões não resolvidas (não adivinhar)

- Escopo de unicidade de `users.email` (`REQUIRED_FIELDS.md` D-109): implementar `(company_id, email)` conforme schema atual; aguardar ratificação.
- `gestor_operacional` pode editar filiais? Matriz atual dá `RL`; implementar escrita só para `admin` até decisão.
- PWA usará cookie ou header `Authorization` no futuro? Este grupo usa cookie; se mudar, alterar canal no Grupo 10/14.
- Reset de senha/convite por e-mail fora do escopo do MVP; senha inicial definida no create por admin.
- Rotação de refresh token: não implementada neste grupo; pode ser adicionada no Grupo 16.
