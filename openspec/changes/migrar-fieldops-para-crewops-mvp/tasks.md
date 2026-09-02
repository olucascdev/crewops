## 1. Governanca, baseline e criterios do piloto

- [x] 1.1 Registrar em `docs/` os responsaveis por produto, operacao, arquitetura, dados e decisao de corte.
- [x] 1.2 Definir empresa, filiais, usuarios, tecnicos e volume representativo do piloto em `docs/MVP_SCOPE.md`.
- [x] 1.3 Registrar criterios mensuraveis de sucesso, severidades de defeito e gates de entrada/saida de cada fase em `docs/ACCEPTANCE_PLAN.md`.
- [x] 1.4 Criar glossario aprovado para `ticket`, `work_order`, `dispatch`, `event`, `evidence`, `technician_location`, `customer` e `service_address`.
- [x] 1.5 Levantar baseline do FieldOps: volume, tempos, erros conhecidos, telas usadas e indicadores operacionais atuais.
- [x] 1.6 Documentar a politica comercial de GPS por evento e ultima posicao conhecida, proibindo promessa de rastreamento continuo no PWA.
- [x] 1.7 Criar registro de decisoes e pendencias com dono e prazo para S3/R2, mapa, thresholds de recencia e recorte historico.

## 2. Inventario funcional do legado PHP

- [x] 2.1 Mapear autenticacao, sessao, usuarios e RBAC em `app/Controllers/*Auth*`, middlewares, models e migrations para `docs/BUSINESS_RULES.md`.
- [x] 2.2 Mapear empresa/tenant, filiais, tecnicos e disponibilidade em controllers, models, views e SQL do legado.
- [x] 2.3 Mapear clientes e sites/enderecos, incluindo campos obrigatorios, geolocalizacao, exclusao e duplicidade.
- [x] 2.4 Mapear tickets do cadastro ao encerramento, incluindo status, prioridade, SLA, anexos e conversao em OS.
- [x] 2.5 Mapear OS em `WorkOrderController.php`, `WorkOrder.php`, views e migrations, cobrindo criacao, status, despacho, retrabalho e finalizacao.
- [x] 2.6 Mapear app tecnico em `App/HomeController.php` e views, cobrindo lista, detalhe, check-in, checklist, notas, assinatura e sync.
- [x] 2.7 Mapear evidencias em `WorkOrderEvidence.php`, endpoints e armazenamento atual, registrando limites e falhas conhecidas.
- [x] 2.8 Mapear localizacao e mapa em `MapOpsController.php`, perfil do tecnico e migrations 039/040, distinguindo ponto atual de ponto antigo.
- [x] 2.9 Mapear sync legado em `syncData`, `syncActions`, migrations e JavaScript do app, identificando duplicacao, ordem e conflitos.
- [x] 2.10 Mapear queries e definicoes dos indicadores de dashboard, atraso, tecnico parado, rework e finalizacao do dia.
- [x] 2.11 Classificar cada comportamento encontrado como `preservar`, `redesenhar`, `adiar` ou `descartar`, com justificativa.
- [x] 2.12 Criar matriz rastreavel `fonte PHP -> regra -> spec OpenSpec -> tarefa -> teste` e aprova-la com produto/operacao.

## 3. Fechamento das regras do MVP

- [x] 3.1 Consolidar `docs/WORK_ORDER_FLOW.md` com atores, pre-condicoes e caminho feliz ponta a ponta.
- [x] 3.2 Aprovar matriz de estados e transicoes de ticket, incluindo autor e motivo de cada transicao.
- [x] 3.3 Aprovar matriz de estados e transicoes de OS a partir dos estados observados no legado.
- [x] 3.4 Definir quais evidencias sao obrigatorias por tipo de OS e quando a validacao administrativa e necessaria.
- [x] 3.5 Definir politica de reatribuicao, cancelamento, reabertura, retrabalho e acao offline concorrente.
- [x] 3.6 Definir matriz simples de permissoes dos cinco perfis por recurso e acao.
- [x] 3.7 Definir campos obrigatorios e validacoes de empresa, filial, usuario, tecnico, cliente, endereco, ticket e OS.
- [x] 3.8 Definir thresholds de OS atrasada, tecnico parado, sync antigo e localizacao desatualizada.
- [x] 3.9 Publicar `docs/API_CONTRACT.md` com recursos, erros estaveis, paginacao, datas UTC e estrategia de versao.
- [x] 3.10 Executar o gate funcional: nenhuma fatia de implementacao inicia com regra essencial sem decisao ou criterio de aceite.

## 4. Fundacao do monorepo e ambientes

- [x] 4.1 Auditar `package.json`, workspaces e versoes de Node/TypeScript; alinhar scripts `dev`, `build`, `lint`, `typecheck` e `test`.
- [x] 4.2 Completar `.env.example` com variaveis tipadas para API, web, PostgreSQL/PostGIS, Redis, S3/R2 e WebSocket sem segredos reais.
- [x] 4.3 Ajustar `docker-compose.yml` para PostgreSQL com PostGIS, Redis, API e web com volumes e healthchecks reproduziveis.
- [x] 4.4 Criar validacao de configuracao na inicializacao de `apps/api` e `apps/web`, falhando com mensagem clara em variavel obrigatoria ausente.
- [x] 4.5 Configurar migrations Drizzle deterministicas e comandos de aplicar/verificar rollback compativel com a estrategia do projeto.
- [x] 4.6 Configurar testes unitarios, integracao e E2E por workspace, com banco e Redis isolados para teste.
- [x] 4.7 Configurar CI para install bloqueado, lint, typecheck, testes, build e validacao OpenSpec.
- [x] 4.8 Adicionar endpoints de saude da API para processo, banco, Redis e filas, distinguindo saudavel de degradado.
- [x] 4.9 Criar dados seed minimos do piloto para desenvolvimento, sem copiar massa sensivel do FieldOps.
- [x] 4.10 Validar onboarding local do zero e registrar os comandos em `README.md`.

## 5. Contratos compartilhados e modelo de dados

- [x] 5.1 Definir IDs, timestamps UTC, enums e schemas compartilhados em `packages/shared/src` sem acoplar o PWA ao ORM.
- [x] 5.2 Modelar em `packages/db/src` empresas, filiais, usuarios, perfis e sessoes com indices e unicidade por empresa.
- [x] 5.3 Modelar tecnicos, vinculo com usuario, filial e disponibilidade sem incluir o People Core completo do legado.
- [x] 5.4 Modelar clientes e enderecos de atendimento separados, incluindo coluna PostGIS e snapshot operacional necessario.
- [x] 5.5 Modelar tickets, ordens de servico e despachos com FKs, estados, prazos e indices de fila operacional.
- [x] 5.6 Modelar `work_order_events` com payload, ator, origem, idempotencia, horarios, offline e localizacao opcional.
- [x] 5.7 Modelar `technician_locations`, `evidences`, `sync_receipts` e `audit_logs` com indices de consulta e retencao.
- [x] 5.8 Criar constraints que impeçam duplicidade de `idempotency_key` no escopo correto e referencias entre empresas.
- [x] 5.9 Criar migrations e testes de schema para constraints, cascatas, soft delete e extensao PostGIS.
- [x] 5.10 Documentar o dicionario de dados e decisoes legado -> novo em `docs/DATABASE_MAP.md`.

## 6. Identidade, organizacao e autorizacao

- [ ] 6.1 Implementar modulos `auth`, `organizations` e `users` em `apps/api/src`, com DTOs validados e servicos testaveis.
- [ ] 6.2 Implementar login, renovacao/validacao e revogacao de sessao com cookies/tokens protegidos conforme o canal escolhido.
- [ ] 6.3 Implementar guards de empresa, filial e perfil na API; cobrir negacao mesmo quando a interface omite a acao.
- [ ] 6.4 Implementar CRUD minimo de filial e associacao de usuario/tecnico no painel `apps/web`.
- [ ] 6.5 Implementar experiencia de login e redirecionamento entre painel e PWA tecnico.
- [ ] 6.6 Implementar logout e limpeza de dados locais protegidos em troca/revogacao de usuario.
- [ ] 6.7 Adicionar auditoria de login, revogacao, mudanca de perfil e tentativas relevantes negadas.
- [ ] 6.8 Testar isolamento organizacional, sessao revogada e tecnico tentando acessar OS de outro tecnico.

## 7. Clientes e enderecos de atendimento

- [ ] 7.1 Implementar modulos `customers` e `service-addresses` na API com busca, paginacao e validacoes aprovadas.
- [ ] 7.2 Implementar cadastro e consulta de cliente com varios enderecos no painel.
- [ ] 7.3 Implementar persistencia e consulta espacial do endereco com PostGIS, aceitando endereco ainda sem coordenada.
- [ ] 7.4 Implementar snapshot/contexto de endereco usado por atendimento para preservar prova historica.
- [ ] 7.5 Adicionar indice e estrategia de busca por nome, documento, codigo externo e endereco.
- [ ] 7.6 Testar duplicidade, isolamento por empresa, endereco sem GPS e alteracao posterior a OS concluida.

## 8. Tickets, OS e despacho no painel

- [ ] 8.1 Implementar modulo `tickets` com criacao, consulta, prioridade, status e vinculo opcional a cliente/endereco.
- [ ] 8.2 Implementar criacao de OS a partir de ticket e OS avulsa, preservando o vinculo de origem.
- [ ] 8.3 Implementar maquina de estados central em `work-orders` com erros estaveis para transicao invalida.
- [ ] 8.4 Implementar servico transacional que grava evento e atualiza `work_orders.status` atomicamente.
- [ ] 8.5 Implementar modulo `dispatch` para atribuir, reagendar, desatribuir e reatribuir com justificativa e historico.
- [ ] 8.6 Implementar telas do painel para lista, criacao, detalhe, timeline e despacho de OS.
- [ ] 8.7 Expor transicoes permitidas por ator para orientar controles do painel e PWA sem substituir validacao server-side.
- [ ] 8.8 Implementar eventos compensatorios para correcao administrativa sem editar eventos confirmados.
- [ ] 8.9 Testar transicoes validas/invalidas, atribuicao inativa, reatribuicao, atomicidade e auditoria.

## 9. Primeira fatia vertical executavel

- [ ] 9.1 Entregar `login -> OS atribuidas -> detalhe -> mudar status -> timeline -> painel` com dados reais da API.
- [ ] 9.2 Garantir que o tecnico veja apenas OS validas para sua identidade e filial.
- [ ] 9.3 Publicar evento de mudanca de status e refletir o novo estado em consulta do painel.
- [ ] 9.4 Criar teste E2E da primeira fatia cobrindo gestor, despachante e tecnico.
- [ ] 9.5 Homologar a fatia contra cenarios equivalentes do FieldOps e registrar divergencias aprovadas.
- [ ] 9.6 Executar gate da fundacao: build, testes, migrations, isolamento e fluxo vertical devem estar verdes antes de ampliar o PWA.

## 10. Banco local e shell PWA

- [ ] 10.1 Configurar manifesto, service worker, instalabilidade e cache somente do shell/ativos seguros em `apps/web`.
- [ ] 10.2 Criar banco Dexie versionado para OS, clientes, enderecos, outbox, evidencias pendentes e estado de sync.
- [ ] 10.3 Implementar migracoes do banco local sem apagar itens pendentes em atualizacao de versao.
- [ ] 10.4 Implementar download incremental e projecao local das OS atribuidas ao tecnico.
- [ ] 10.5 Implementar gravacao atomica de evento local e atualizacao otimista da tela.
- [ ] 10.6 Exibir estados `local`, `pendente`, `sincronizando`, `sincronizado`, `falhou` e `conflito` sem depender da conectividade.
- [ ] 10.7 Implementar gatilhos de sync ao abrir, voltar ao primeiro plano, recuperar rede e acionar retry manual.
- [ ] 10.8 Monitorar cota do navegador e solicitar armazenamento persistente quando suportado, sem prometer durabilidade absoluta.
- [ ] 10.9 Testar reload offline, atualizacao de schema Dexie, logout, troca de usuario e pressao de armazenamento.

## 11. Protocolo de sincronizacao

- [ ] 11.1 Definir DTO versionado de lote, evento, dependencia, cursor e resultado individual em `packages/shared`.
- [ ] 11.2 Implementar endpoint `sync` no NestJS com resultados `applied`, `already_done`, `rejected`, `conflict` e `retry_later`.
- [ ] 11.3 Persistir recibo idempotente e alteracao de dominio na mesma transacao.
- [ ] 11.4 Implementar processamento ordenado por dependencia sem confiar somente no horario do dispositivo.
- [ ] 11.5 Implementar politica por tipo para nota aditiva, status, check-in, localizacao, evidencia e assinatura.
- [ ] 11.6 Implementar conflito explicito para OS cancelada, concluida ou reatribuida durante periodo offline.
- [ ] 11.7 Implementar no PWA remocao da outbox somente apos ACK seguro e backoff limitado para falha transitoria.
- [ ] 11.8 Exibir erro permanente e conflito com orientacao acionavel, preservando o payload original.
- [ ] 11.9 Criar testes de lote parcial, reenvio identico, evento fora de ordem, queda antes do ACK e processamento concorrente.
- [ ] 11.10 Criar ferramenta administrativa de diagnostico por lote, evento, OS, tecnico e dispositivo sem expor dados sensiveis.

## 12. Localizacao operacional por evento

- [ ] 12.1 Implementar captura de geolocalizacao no PWA com timeout, precisao, permissao negada e fallback sem coordenada.
- [ ] 12.2 Vincular captura a check-in, status relevante, evidencia, finalizacao e ping manual conforme regra aprovada.
- [ ] 12.3 Persistir pontos na outbox e em PostGIS com origem, precisao, `occurred_at` e `received_at`.
- [ ] 12.4 Atualizar ultima posicao conhecida do tecnico a partir de evento valido sem apagar o historico.
- [ ] 12.5 Implementar captura periodica somente em primeiro plano e configuravel, sem alegar background continuo.
- [ ] 12.6 Testar permissao negada, leitura imprecisa, timestamp antigo, ponto duplicado e sincronizacao tardia.
- [ ] 12.7 Revisar todos os textos de produto e painel para comunicar ultima posicao e recencia corretamente.

## 13. Evidencias, fotos e assinatura

- [ ] 13.1 Definir politica de formatos, tamanho, dimensao, qualidade, EXIF, hash, retencao e privacidade de evidencias.
- [ ] 13.2 Implementar captura, orientacao e compressao de imagem antes de persistir o Blob no Dexie.
- [ ] 13.3 Implementar registro local de foto, assinatura e nota com identificador idempotente e vinculo a evento/OS.
- [ ] 13.4 Implementar adaptador neutro de object storage e endpoint autorizado de URL pre-assinada para S3/R2.
- [ ] 13.5 Implementar upload direto com progresso, expiracao, nova URL e retry manual/automatico.
- [ ] 13.6 Implementar confirmacao idempotente de objeto, hash, tamanho, tipo e vinculo a evidencia/timeline.
- [ ] 13.7 Implementar estados `pending_upload`, `uploaded` e `failed` no PWA, API e painel.
- [ ] 13.8 Implementar finalizacao local com evidencia capturada e upload pendente, mantendo alerta ate confirmacao.
- [ ] 13.9 Implementar job BullMQ de verificacao/limpeza de objeto orfao com janela e protecao de objetos confirmados.
- [ ] 13.10 Testar arquivo grande, cota insuficiente, URL expirada, upload sem ACK, retry e objeto com tipo/hash invalido.

## 14. Realtime, filas e efeitos assincronos

- [ ] 14.1 Configurar Redis e BullMQ com filas nomeadas, retries limitados, backoff e tratamento de jobs mortos.
- [ ] 14.2 Implementar publicacao pos-commit/outbox para impedir mensagem sobre transacao que falhou.
- [ ] 14.3 Implementar gateway WebSocket autenticado e canais por empresa/filial/recurso.
- [ ] 14.4 Definir mensagens leves de invalidacao com ID, tipo, versao/cursor e escopo autorizado.
- [ ] 14.5 Implementar reconexao e reconciliacao por API no painel apos intervalo sem mensagens.
- [ ] 14.6 Garantir degradacao controlada quando Redis ou WebSocket estiver indisponivel, preservando operacoes confirmadas no banco.
- [ ] 14.7 Testar mensagem duplicada/perdida, reconexao, acesso cruzado, Redis indisponivel e job esgotado.

## 15. Sala de operacao e mapa

- [ ] 15.1 Implementar consultas unicas e documentadas para OS abertas, atrasadas, em execucao e concluidas hoje.
- [ ] 15.2 Implementar definicao de tecnico em campo, parado, sem trabalho e sem sincronizar sem misturar os conceitos.
- [ ] 15.3 Construir home operacional em `apps/web` com indicadores acionaveis que abrem listas usando a mesma regra do total.
- [ ] 15.4 Construir mapa com ultima posicao, precisao, origem, horario e classe de recencia de cada tecnico.
- [ ] 15.5 Implementar filtros consistentes por filial, tecnico, status, atraso e recencia em indicadores, lista e mapa.
- [ ] 15.6 Implementar timeline da OS com eventos online/offline, localizacao, evidencias e correcoes administrativas.
- [ ] 15.7 Exibir filas pendentes, conflitos e evidencias falhas como alertas operacionais acionaveis.
- [ ] 15.8 Integrar atualizacoes WebSocket sem causar duplicacao, salto de layout ou perda de filtro.
- [ ] 15.9 Testar definicoes de indicadores com fixtures conhecidas e reconciliar totais com as listas detalhadas.
- [ ] 15.10 Validar responsividade e uso em desktop operacional e mobile do tecnico com dados longos e estados extremos.

## 16. Seguranca, auditoria e observabilidade

- [ ] 16.1 Executar threat model de autenticacao, sync offline, IDs de cliente, WebSocket, PostGIS e upload pre-assinado.
- [ ] 16.2 Validar todos os DTOs e aplicar limites de lote, payload, arquivo, pagina e frequencia por identidade.
- [ ] 16.3 Garantir que evidencias sejam privadas e acessadas somente por URL autorizada/temporaria.
- [ ] 16.4 Implementar logs estruturados com correlacao de requisicao, lote, evento, OS, dispositivo e job.
- [ ] 16.5 Remover de logs tokens, bytes, assinatura e dados pessoais desnecessarios; testar redacao.
- [ ] 16.6 Implementar metricas de API, banco, sync, outbox reportada, upload, filas, WebSocket e operacao.
- [ ] 16.7 Criar alertas para falha/idade de fila, conflito crescente, upload preso, banco/Redis/storage degradado e erro de API.
- [ ] 16.8 Implementar consultas de auditoria para status, despacho, permissao, correcao e finalizacao.
- [ ] 16.9 Testar autorizacao horizontal/vertical, abuso de URL, replay idempotente, lote excessivo e acesso WebSocket cruzado.

## 17. Relatorios essenciais e qualidade do MVP

- [ ] 17.1 Definir e implementar somente relatorios essenciais do piloto: volume, atraso, execucao, finalizacao, rework e sync.
- [ ] 17.2 Garantir que relatorios usem eventos para historico e estado atual apenas quando semanticamente correto.
- [ ] 17.3 Criar suite E2E do fluxo completo online do gestor ao tecnico e retorno ao painel.
- [ ] 17.4 Criar suite E2E offline: baixar OS, perder rede, executar, capturar GPS/foto/assinatura, recarregar, reconectar e reconciliar.
- [ ] 17.5 Criar testes de resiliencia para Redis, storage e WebSocket indisponiveis sem perda da acao do tecnico.
- [ ] 17.6 Executar testes em navegadores/dispositivos representativos do piloto e registrar limitacoes conhecidas.
- [ ] 17.7 Executar avaliacao de desempenho para listas, dashboard, mapa, lote de sync e upload no volume do piloto.
- [ ] 17.8 Bloquear expansao de financeiro, estoque, SaaS, BI e roteirizacao ate o gate de aceite operacional.

## 18. Staging e migracao de dados

- [ ] 18.1 Definir recorte de usuarios, tecnicos, clientes, enderecos, tickets, OS e evidencias necessario ao piloto.
- [ ] 18.2 Criar tabelas `legacy_*` com origem, lote, hash, estado de validacao e erro sem misturar com tabelas finais.
- [ ] 18.3 Implementar extratores somente leitura do banco FieldOps com checkpoint e relatorio de execucao.
- [ ] 18.4 Implementar transformadores com mapeamento de IDs, normalizacao, deduplicacao e quarentena de invalido.
- [ ] 18.5 Implementar cargas idempotentes para o modelo final e preservar referencia ao ID legado.
- [ ] 18.6 Criar reconciliacao automatica de totais, chaves, status, datas, relacionamentos e amostras.
- [ ] 18.7 Testar reprocessamento do mesmo lote, interrupcao no meio, dado orfao, encoding, timezone e arquivo ausente.
- [ ] 18.8 Executar pelo menos dois ensaios completos em homologacao e comparar duracao e divergencias.
- [ ] 18.9 Obter aceite formal das divergencias conhecidas antes de preparar carga de corte.

## 19. Piloto controlado

- [ ] 19.1 Preparar ambiente de homologacao com configuracao proxima da producao, backups, monitoramento e storage isolado.
- [ ] 19.2 Treinar gestores, despachantes, atendentes e tecnicos no fluxo e na interpretacao de pendencia/ultima localizacao.
- [ ] 19.3 Rodar piloto com grupo pequeno e suporte acompanhado, sem desligar consulta ao FieldOps.
- [ ] 19.4 Medir sucesso de login, sync, idade da outbox, conflitos, uploads, OS concluidas e tempo de operacao.
- [ ] 19.5 Registrar feedback por severidade, corrigir bloqueadores e repetir cenarios de regressao.
- [ ] 19.6 Validar comportamento em area de internet ruim com tecnicos e dispositivos reais.
- [ ] 19.7 Executar gate de piloto: zero defeito critico aberto, reconciliacao aprovada, runbooks testados e aceite operacional.

## 20. Corte, rollback e estabilizacao

- [ ] 20.1 Definir sistema autoritativo por entidade em cada momento da transicao e proibir dupla escrita generica.
- [ ] 20.2 Criar runbook de corte com responsaveis, janela, backup, carga delta, smoke test, comunicacao e limite de abortar.
- [ ] 20.3 Criar runbook de rollback que preserve e exporte eventos criados no CrewOps durante a janela.
- [ ] 20.4 Ensaiar corte e rollback em homologacao com tempos medidos e evidencias anexadas ao plano.
- [ ] 20.5 Executar backup verificado, carga final/delta, reconciliacao e smoke tests antes de liberar usuarios.
- [ ] 20.6 Tornar o FieldOps somente leitura apenas quando todos os gates obrigatorios estiverem aprovados.
- [ ] 20.7 Monitorar intensivamente API, banco, filas, sync, upload, conflitos e indicadores durante a estabilizacao.
- [ ] 20.8 Executar rollback se criterio objetivo for atingido; nao improvisar migracao parcial durante incidente.
- [ ] 20.9 Encerrar estabilizacao somente apos reconciliacao final, aceite operacional e ausencia de severidade critica.
- [ ] 20.10 Manter o legado consultavel pelo periodo aprovado e planejar desativacao separada com retencao e compliance.

## 21. Encerramento do MVP e proxima decisao

- [ ] 21.1 Consolidar metricas, incidentes, divergencias e aprendizados do piloto/corte em `docs/MVP_REVIEW.md`.
- [ ] 21.2 Atualizar specs OpenSpec com o comportamento realmente aprovado e arquivar mudancas concluidas.
- [ ] 21.3 Remover flags, codigo temporario e acessos de migracao somente depois de confirmar que nao sao mais necessarios.
- [ ] 21.4 Priorizar backlog pos-MVP com base em uso medido, sem reintroduzir automaticamente todos os modulos do legado.
- [ ] 21.5 Abrir iniciativa separada de app nativo/Expo somente se rastreamento continuo se tornar requisito comprovado.
- [ ] 21.6 Registrar decisao formal de continuar, ampliar ou interromper a substituicao do FieldOps com base nos criterios do piloto.
