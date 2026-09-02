# Plano Grupo 18 - Staging e migracao de dados

> Escopo: tarefas 18.1-18.9. Fontes: `specs/data-migration-cutover/spec.md`, `docs/MIGRATION_STRATEGY.md`, `docs/DATABASE_MAP.md` e `docs/TRACEABILITY_MATRIX.md`.
> Gate: D-104/R-020/R-021/R-033 resolvidos e dono de Dados nomeado antes de carga de homologacao.

## Implementacao

1. Definir recorte minimo do piloto para usuarios, tecnicos, clientes, enderecos, tickets, OS e evidencias; registrar inclusoes/exclusoes e responsavel.
2. Criar tabelas `legacy_*` de staging com origem, lote, hash, estado de validacao, erro e checkpoint. Nunca misturar staging com tabelas finais.
3. Implementar extratores somente leitura contra o FieldOps, com credencial de menor privilegio, pagina/checkpoint e relatorio por execucao.
4. Transformar dados com mapa de IDs, normalizacao, timezone/encoding, deduplicacao e quarentena de invalido. Nenhum registro invalido entra silenciosamente no destino.
5. Carregar o modelo final de modo idempotente, preservando referencia do ID legado e auditando insert/update/rejeicao.
6. Reconciliar origem, staging e destino por total, chave, status, data, relacionamento e amostra. Divergencia acima do limite bloqueia corte.
7. Testar reprocessamento, interrupcao, orfao, encoding, timezone e arquivo ausente.
8. Executar ao menos dois ensaios completos em homologacao, comparando tempo, volume, erros e divergencias; obter aceite formal antes da carga de corte.

## Gate

Somente staging aprovado, reconciliacao dentro do limite e divergencias formalmente aceitas podem alimentar o Grupo 20. O legado permanece intocado e consultavel.
