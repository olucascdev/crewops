# Plano Grupo 17 - Relatorios essenciais e qualidade do MVP

> Escopo: tarefas 17.1-17.8. Fontes: `docs/ACCEPTANCE_PLAN.md`, `docs/OPERATIONAL_THRESHOLDS.md`, `docs/WORK_ORDER_FLOW.md` e `design.md` secao 13.

## Implementacao

1. Definir somente os relatorios do piloto: volume, atraso, execucao, finalizacao, rework e sync. Cada metrica declara fonte, janela, filtro, timezone e dono.
2. Usar eventos para historico e projecao atual apenas para o estado presente; documentar essa escolha por relatorio.
3. Criar E2E online do gestor ao tecnico e retorno ao painel, e E2E offline com download, perda de rede, acao, GPS/foto/assinatura, reload e reconciliacao.
4. Criar testes de resiliencia para Redis, storage e WebSocket sem perda de acao local do tecnico.
5. Executar matriz de navegadores/dispositivos reais do piloto, registrando limitacoes e contornos.
6. Medir listas, dashboard, mapa, lote e upload no volume definido por R-016/R-018; corrigir gargalos que ameacem o piloto.
7. Bloquear explicitamente financeiro, estoque, SaaS, BI e roteirizacao ate o aceite operacional; novos pedidos viram backlog separado.

## Gate

Relatorios reconciliados, E2Es verdes, resiliencia comprovada e performance medida no volume do piloto. Nenhum defeito critico aberto e nenhum escopo adicional incorporado por conveniencia.
