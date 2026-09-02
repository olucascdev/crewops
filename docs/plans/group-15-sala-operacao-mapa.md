# Plano Grupo 15 - Sala de operacao e mapa

> Escopo: tarefas 15.1-15.10. Fontes: `specs/operations-dashboard/spec.md`, `docs/OPERATIONAL_THRESHOLDS.md`, `docs/GPS_POLICY.md` e `docs/API_CONTRACT.md`.
> Gates: D-102 (mapa/geocoding) e D-103/R-034 (thresholds) devem ser resolvidos antes de homologacao.

## Implementacao

1. Criar consultas canonicas, documentadas e reutilizadas por KPI e lista para OS abertas, atrasadas, em execucao e concluidas hoje. Definir timezone/filtros na consulta, nao na tela.
2. Modelar separadamente tecnico em campo, parado, sem trabalho e sem sync; cada conceito usa sua regra e evidencia, sem inferencia por cor de marcador.
3. Construir home operacional com indicadores acionaveis que abrem a lista filtrada pela mesma definicao do total.
4. Integrar mapa com ultima posicao, precisao, origem, horario e recencia. Sem coordenada gera estado explicito, nao marcador inventado.
5. Unificar filtros por filial, tecnico, status, atraso e recencia em URL/estado compartilhado para KPI, lista e mapa.
6. Exibir timeline completa da OS, inclusive eventos offline, localizacao, evidencias e correcoes, preservando ordem e autoria.
7. Tornar filas pendentes, conflitos e evidencias falhas alertas navegaveis. Integrar invalidacoes WebSocket sem apagar filtros ou reordenar abruptamente a tela.
8. Validar responsividade em desktop operacional e mobile, dados longos e estados extremos.

## Testes e gate

- Fixtures conhecidas reconciliam total do indicador com lista detalhada.
- Testar filtros cruzados, mapa sem posicao, recencia, alertas e reconexao.
- O grupo so conclui com thresholds aprovados, mapa acessivel e nenhum KPI sem consulta rastreavel.
