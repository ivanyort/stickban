# DECISIONS

**EN:** Lightweight architecture decision log for Stickban.  
**PT-BR:** Registro leve de decisoes arquiteturais do Stickban.

## How to Read / Como Ler

**EN:** Each entry records context, the current decision, and the expected consequences. Status values are intentionally simple: `accepted` or `planned`.  
**PT-BR:** Cada entrada registra contexto, a decisao atual e as consequencias esperadas. Os status sao intencionalmente simples: `accepted` ou `planned`.

## D-001: Desktop Application Base

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The product is intended to stay visible on the desktop with optional always-on-top behavior.
  O produto foi concebido para permanecer visivel no desktop com comportamento always-on-top opcional.
- Decision / Decisao:
  Build Stickban as a desktop application using Electron.
  Construir o Stickban como uma aplicacao desktop usando Electron.
- Consequences / Consequencias:
  The project will need a main-process/renderer-process split and desktop packaging strategy.
  O projeto vai exigir separacao entre main process e renderer process, alem de estrategia de empacotamento desktop.

## D-002: Renderer Technology

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The UI needs fast iteration, rich interaction, and a maintainable typed frontend stack.
  A interface precisa de iteracao rapida, interacao rica e uma stack tipada de frontend que seja sustentavel.
- Decision / Decisao:
  Use React + TypeScript for the renderer layer.
  Usar React + TypeScript na camada de renderer.
- Consequences / Consequencias:
  Component structure, state typing, and renderer tooling should align with a React/TypeScript workflow.
  Estrutura de componentes, tipagem de estado e tooling do renderer devem seguir um fluxo React/TypeScript.

## D-003: Local Persistence Model

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The application is offline-first and must retain local state reliably.
  A aplicacao e offline-first e precisa reter o estado local com confiabilidade.
- Decision / Decisao:
  Use SQLite as the local persistence layer and treat it as the source of truth.
  Usar SQLite como camada de persistencia local e trata-lo como fonte de verdade.
- Consequences / Consequencias:
  Data writes should land locally first, and sync should propagate from local state rather than replace it.
  Gravacoes de dados devem ocorrer primeiro localmente, e a sincronizacao deve propagar o estado local em vez de substitui-lo.

## D-004: State Management and UI Utilities

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The product direction already defines the intended frontend stack for state, styling, and drag-and-drop interactions.
  A direcao do produto ja define a stack pretendida para estado, estilo e interacoes de drag and drop.
- Decision / Decisao:
  Use Zustand for state management, Tailwind CSS for styling, and `dnd-kit` for drag and drop.
  Usar Zustand para gerenciamento de estado, Tailwind CSS para estilos e `dnd-kit` para drag and drop.
- Consequences / Consequencias:
  Initial scaffold and component architecture should align with these libraries unless superseded by a newer recorded decision.
  O scaffold inicial e a arquitetura de componentes devem se alinhar a essas bibliotecas, salvo decisao posterior registrada.

## D-005: Sync Provider

- Date / Data: 2026-03-22
- Status: planned
- Context / Contexto:
  The product specification calls for optional sync across devices without making cloud storage the primary system of record.
  A especificacao do produto pede sincronizacao opcional entre dispositivos sem transformar a nuvem no sistema primario de registro.
- Decision / Decisao:
  Use Google Drive AppDataFolder as the sync provider for the MVP direction.
  Usar Google Drive AppDataFolder como provedor de sincronizacao na direcao atual do MVP.
- Consequences / Consequencias:
  Auth, background sync, and remote file lifecycle must be designed around Google Drive capabilities.
  Autenticacao, sincronizacao em background e ciclo de vida de arquivos remotos devem ser desenhados em torno das capacidades do Google Drive.

## D-006: Sync Strategy

- Date / Data: 2026-03-22
- Status: planned
- Context / Contexto:
  The project needs a simple first implementation path for synchronization.
  O projeto precisa de um primeiro caminho simples para implementacao da sincronizacao.
- Decision / Decisao:
  Adopt snapshot-based synchronization for the MVP.
  Adotar sincronizacao baseada em snapshot para o MVP.
- Consequences / Consequencias:
  Sync logic can start simpler, but future evolution may require more advanced merge behavior.
  A logica de sync pode comecar mais simples, mas evolucoes futuras podem exigir merge mais avancado.

## D-007: Conflict Resolution

- Date / Data: 2026-03-22
- Status: planned
- Context / Contexto:
  The MVP needs a deterministic conflict policy that is cheap to implement.
  O MVP precisa de uma politica deterministica de conflitos que seja barata de implementar.
- Decision / Decisao:
  Use last-write-wins as the initial conflict resolution strategy.
  Usar last-write-wins como estrategia inicial de resolucao de conflitos.
- Consequences / Consequencias:
  Conflict handling stays simple in early versions, but edge cases may later justify a stronger model.
  O tratamento de conflitos permanece simples nas versoes iniciais, mas casos limite podem justificar um modelo mais robusto no futuro.

## Notes / Notas

**EN:** Entries marked as `planned` reflect current intended direction from the specification and should be validated during implementation.  
**PT-BR:** Entradas marcadas como `planned` refletem a direcao pretendida atual da especificacao e devem ser validadas durante a implementacao.
