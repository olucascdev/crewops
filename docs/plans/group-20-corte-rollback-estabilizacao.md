# Plano Grupo 20 - Corte, rollback e estabilizacao

> Escopo: tarefas 20.1-20.10. Fontes: `specs/data-migration-cutover/spec.md`, `docs/MIGRATION_STRATEGY.md`, `docs/ACCEPTANCE_PLAN.md` e `docs/PILOT_GOVERNANCE.md`.
> Pre-condicao: piloto aprovado e decisor de Corte nomeado. Nao executar corte ou mudar o FieldOps sem autorizacao explicita.

## Implementacao operacional

1. Definir por entidade o sistema autoritativo em cada fase e proibir dupla escrita fora de mecanismo documentado.
2. Escrever runbook de corte com responsaveis, janela, backup verificado, carga delta, reconciliacao, smoke tests, comunicacao e limiar objetivo de abortar.
3. Escrever rollback que preserva/exporta eventos do CrewOps produzidos na janela, restaura o plano de contingencia e define reconciliacao posterior.
4. Ensaiar corte e rollback em homologacao com tempos, evidencias e decisoes registradas.
5. No dia autorizado, verificar backup, executar delta, reconciliar e fazer smoke tests antes de liberar usuarios.
6. Tornar o FieldOps somente leitura exclusivamente depois de todos os gates. Durante estabilizacao, monitorar API, banco, filas, sync, upload, conflitos e KPIs.
7. Se criterio objetivo disparar, executar rollback do runbook; nao improvisar migracao parcial durante incidente.
8. Encerrar estabilizacao somente com reconciliacao final, aceite e zero severidade critica; manter legado consultavel pelo periodo aprovado e planejar desligamento separado.

## Gate

Todo passo deve ter timestamp, dono e evidencia. A ausencia de backup validado, reconciliacao ou autoridade de corte bloqueia a execucao.
