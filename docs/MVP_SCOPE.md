# Escopo MVP CrewOps

## Objetivo do MVP

Validar a operacao de campo ponta a ponta para um provedor: criar OS, despachar tecnico, executar no PWA, registrar evidencias e acompanhar no painel.

## Entrega Principal

```txt
Gestor cria OS
Despachante atribui para tecnico
Tecnico recebe no PWA
Tecnico executa em campo
Registra status, GPS por evento, foto e assinatura
Admin acompanha status, mapa e timeline
```

## Usuarios

Perfis iniciais:

- `admin`;
- `gestor_operacional`;
- `atendente`;
- `despachante`;
- `tecnico`.

## Modulos do MVP

- autenticacao;
- usuarios e perfis;
- empresa e filiais;
- tecnicos;
- clientes;
- enderecos de atendimento;
- tickets;
- ordens de servico;
- despacho/agendamento;
- eventos de OS;
- localizacao por evento;
- evidencias;
- assinatura;
- sync offline;
- dashboard operacional;
- mapa de ultima posicao conhecida;
- relatorios simples.

## Fora do MVP

- multiempresa/SaaS completo;
- financeiro;
- estoque;
- roteirizacao avancada;
- chat interno;
- BI sofisticado;
- permissoes super complexas;
- app nativo;
- microservicos;
- Kubernetes;
- Kafka;
- CQRS pesado.

## Criterios de Sucesso

- Tecnico consegue trabalhar com internet instavel.
- Gestor entende a operacao em poucos segundos.
- OS tem timeline confiavel.
- Evidencias nao se perdem.
- Sync nao duplica eventos.
- GPS e comunicado como localizacao por evento, nao rastreamento continuo.
