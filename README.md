# Stickban

**EN:** A sticky Kanban board that lives on your desktop.  
**PT-BR:** Um quadro Kanban persistente que fica visível na sua área de trabalho.

## Overview / Visao Geral

**EN:** Stickban is a desktop Kanban application focused on speed, low friction, and constant visibility. The product direction is offline-first, with local persistence as the primary data source and optional cloud synchronization across devices.  
**PT-BR:** Stickban e um aplicativo desktop de Kanban focado em velocidade, baixo atrito e visibilidade constante. A direcao do produto e offline-first, com persistencia local como fonte primaria de dados e sincronizacao opcional em nuvem entre dispositivos.

## Current Status / Estado Atual

**EN:** This repository is in bootstrap stage. The product specification exists in [`SPEC.md`](./SPEC.md), but the application scaffold has not been created yet.  
**PT-BR:** Este repositorio esta em fase de bootstrap. A especificacao do produto existe em [`SPEC.md`](./SPEC.md), mas o scaffold da aplicacao ainda nao foi criado.

**EN:** The documentation in this repository is intended to establish direction before implementation starts.  
**PT-BR:** A documentacao deste repositorio serve para estabelecer direcao antes do inicio da implementacao.

## Product Direction / Direcao do Produto

**EN**

- Desktop-first Kanban workflow
- Sticky widget behavior, with optional always-on-top mode
- Fast and lightweight user experience
- Offline-first architecture
- Local SQLite persistence
- Optional Google Drive synchronization

**PT-BR**

- Fluxo de Kanban orientado a desktop
- Comportamento de widget fixo, com modo always-on-top opcional
- Experiencia leve e rapida
- Arquitetura offline-first
- Persistencia local em SQLite
- Sincronizacao opcional com Google Drive

## Planned Technology Stack / Stack Planejada

**EN**

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand for state management
- Tailwind CSS
- `dnd-kit` for drag and drop

**PT-BR**

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand para gerenciamento de estado
- Tailwind CSS
- `dnd-kit` para drag and drop

## Core Principles / Principios Centrais

**EN**

- Local data is the source of truth
- UI interactions should stay responsive
- Sync must not block the interface
- Local data must not be lost because of sync failures
- Architectural changes should remain aligned with [`SPEC.md`](./SPEC.md) and [`DECISIONS.md`](./DECISIONS.md)

**PT-BR**

- Dados locais sao a fonte de verdade
- Interacoes da interface devem permanecer responsivas
- A sincronizacao nao deve bloquear a interface
- Dados locais nao podem ser perdidos por falhas de sincronizacao
- Mudancas arquiteturais devem permanecer alinhadas com [`SPEC.md`](./SPEC.md) e [`DECISIONS.md`](./DECISIONS.md)

## Planned Project Structure / Estrutura Planejada do Projeto

**EN:** The structure below is planned, not implemented yet.  
**PT-BR:** A estrutura abaixo esta planejada, mas ainda nao foi implementada.

```text
/app
  /main
  /renderer
  /db
  /services
    /sync
    /googleDrive
  /models
  /store
  /components
  /hooks
  /utils
```

## Roadmap Snapshot / Resumo do Roadmap

**EN**

- MVP: single board, 3 columns, drag and drop, SQLite persistence, always-on-top
- Phase 2: multiple boards, Google Drive sync, system tray, themes
- Future: custom fields, notifications, advanced conflict resolution, mobile companion

**PT-BR**

- MVP: quadro unico, 3 colunas, drag and drop, persistencia em SQLite, always-on-top
- Fase 2: multiplos quadros, sync com Google Drive, system tray, temas
- Futuro: campos customizados, notificacoes, resolucao avancada de conflitos, app mobile complementar

## Repository Documents / Documentos do Repositorio

- [`SPEC.md`](./SPEC.md): product specification / especificacao do produto
- [`AGENTS.md`](./AGENTS.md): operating guidance for programming agents / guia operacional para agentes de programacao
- [`DECISIONS.md`](./DECISIONS.md): architecture decision log / registro de decisoes arquiteturais

## Getting Started Today / Como Comecar Hoje

**EN:** There is no runnable application scaffold yet. The current next step is to turn the product specification into the initial Electron/React/TypeScript project structure.  
**PT-BR:** Ainda nao existe um scaffold executavel da aplicacao. O proximo passo atual e transformar a especificacao do produto na estrutura inicial do projeto com Electron/React/TypeScript.

## License / Licenca

This repository includes an MIT license in [`LICENSE`](./LICENSE).
