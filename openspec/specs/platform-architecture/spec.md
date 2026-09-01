# Spec: Arquitetura da Plataforma

## Requirements

### Requirement: Monorepo TypeScript

CrewOps SHALL usar um monorepo TypeScript com separacao clara entre PWA, API, banco e codigo compartilhado.

#### Scenario: Estrutura base do repositorio

- **WHEN** um desenvolvedor abrir o diretorio `crewops`
- **THEN** deve encontrar `apps/web` para Next.js PWA
- **AND** deve encontrar `apps/api` para NestJS
- **AND** deve encontrar `packages/db` para Drizzle e PostgreSQL
- **AND** deve encontrar `packages/shared` para tipos e constantes compartilhadas

### Requirement: Backend modular

A API SHALL ser organizada em modulos de dominio, mantendo uma API principal no MVP.

#### Scenario: Modulos iniciais

- **WHEN** uma funcionalidade nova for implementada
- **THEN** ela deve se encaixar em um dominio como auth, users, branches, technicians, customers, tickets, work-orders, dispatch, field-events, locations, evidence, notifications, reports ou audit
- **AND** nao deve criar microservicos antes de haver necessidade medida

### Requirement: Banco operacional

CrewOps SHALL usar PostgreSQL + PostGIS como banco principal e Drizzle ORM para schema, migrations e queries tipadas.

#### Scenario: Dados com geolocalizacao

- **WHEN** o sistema persistir enderecos ou eventos de localizacao
- **THEN** deve prever indices e tipos adequados para consultas geograficas no PostgreSQL/PostGIS
- **AND** deve manter as coordenadas associadas ao contexto operacional que gerou o ponto

### Requirement: Infraestrutura local com Docker

CrewOps SHALL oferecer ambiente Docker para banco, Redis e servicos necessarios ao desenvolvimento local.

#### Scenario: Novo desenvolvedor

- **WHEN** um desenvolvedor iniciar o ambiente local
- **THEN** PostgreSQL/PostGIS e Redis devem subir de forma reproduzivel
- **AND** a API e o PWA devem conseguir se conectar sem configuracao manual dispersa
