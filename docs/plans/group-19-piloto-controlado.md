# Plano Grupo 19 - Piloto controlado

> Escopo: tarefas 19.1-19.7. Fontes: `docs/ACCEPTANCE_PLAN.md`, `docs/MVP_SCOPE.md`, `docs/PILOT_GOVERNANCE.md` e `docs/PILOT_RATIFICATIONS.md`.

## Implementacao operacional

1. Preparar homologacao proxima de producao: configuracao isolada, backup testado, monitoramento, storage separado e acesso minimo necessario.
2. Treinar gestor, despachante, atendente e tecnico com roteiro de login, pendencia de sync/evidencia, ultima localizacao e escalonamento de erro.
3. Rodar piloto pequeno com suporte acompanhado e FieldOps mantido como consulta, sem dupla escrita generica.
4. Medir login, sync, idade da outbox, conflitos, uploads, OS concluidas e tempos. Usar valores reais aprovados, nao placeholders de R-030 a R-034.
5. Registrar feedback e defeitos por severidade; corrigir bloqueadores e repetir regressao antes de ampliar participantes.
6. Validar internet ruim em dispositivos e locais representativos, documentando limitacoes reais do PWA.

## Gate

O piloto passa apenas com zero critico aberto, reconciliacao aprovada, runbooks exercitados e aceite operacional formal. Sem esses sinais, o resultado e iteracao controlada, nao corte.
