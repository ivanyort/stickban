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
  Use Google Drive AppDataFolder as the planned sync provider for a later phase, not for the initial local-first scaffold.
  Usar Google Drive AppDataFolder como provedor planejado de sincronizacao para uma fase posterior, nao para o scaffold inicial local-first.
- Consequences / Consequencias:
  Auth, background sync, and remote file lifecycle can be deferred until after the first local milestone is stable.
  Autenticacao, sincronizacao em background e ciclo de vida de arquivos remotos podem ser adiados ate que o primeiro milestone local esteja estavel.

## D-006: Sync Strategy

- Date / Data: 2026-03-22
- Status: planned
- Context / Contexto:
  The project needs a simple first implementation path for synchronization.
  O projeto precisa de um primeiro caminho simples para implementacao da sincronizacao.
- Decision / Decisao:
  Adopt snapshot-based synchronization when remote sync is introduced, not in the initial scaffold.
  Adotar sincronizacao baseada em snapshot quando o sync remoto for introduzido, nao no scaffold inicial.
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
  Use last-write-wins as the initial remote conflict resolution strategy when sync is added later.
  Usar last-write-wins como estrategia inicial de resolucao de conflitos remotos quando o sync for adicionado depois.
- Consequences / Consequencias:
  Conflict handling stays simple in early versions, but edge cases may later justify a stronger model.
  O tratamento de conflitos permanece simples nas versoes iniciais, mas casos limite podem justificar um modelo mais robusto no futuro.

## D-008: AI-Assisted Development Default

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The repository was conceived from the start to be developed with AI-assisted tools, and the maintainer prefers to preserve that workflow as the default operating model.
  O repositorio foi concebido desde o inicio para ser desenvolvido com ferramentas assistidas por IA, e o mantenedor prefere preservar esse fluxo como modelo operacional padrao.
- Decision / Decisao:
  Adopt AI-assisted development by default, using tools such as Codex, Claude, Antigravity, and equivalent systems as the preferred implementation path, while allowing manual code changes when they are the better fit for a task.
  Adotar desenvolvimento assistido por IA como padrao, usando ferramentas como Codex, Claude, Antigravity e sistemas equivalentes como caminho preferencial de implementacao, permitindo alteracoes manuais no codigo quando elas forem a melhor opcao para uma tarefa.
- Consequences / Consequencias:
  Repository documentation and workflow guidance should remain agent-friendly, and changes to process, governance, or collaboration expectations should keep this AI-first model explicit.
  A documentacao do repositorio e as orientacoes de workflow devem continuar amigaveis para agentes, e mudancas de processo, governanca ou expectativas de colaboracao devem manter esse modelo AI-first explicito.

## D-009: Initial Scaffold Scope

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The project should be implementable locally without paid services, subscriptions, cloud infrastructure, or unnecessary early complexity.
  O projeto deve ser implementavel localmente sem servicos pagos, assinaturas, infraestrutura cloud ou complexidade prematura desnecessaria.
- Decision / Decisao:
  Keep the initial scaffold focused on Electron, React + TypeScript, local SQLite via `better-sqlite3`, Zustand, Tailwind CSS, and `dnd-kit`, with a single local board, three columns, drag and drop, SQLite persistence, and always-on-top behavior. Exclude Google Drive sync, OAuth, and remote infrastructure from the first milestone.
  Manter o scaffold inicial focado em Electron, React + TypeScript, SQLite local via `better-sqlite3`, Zustand, Tailwind CSS e `dnd-kit`, com um quadro local unico, tres colunas, drag and drop, persistencia em SQLite e comportamento always-on-top. Deixar Google Drive sync, OAuth e infraestrutura remota fora do primeiro milestone.
- Consequences / Consequencias:
  The first implementation milestone remains local-only and cost-free to develop and run, while remote synchronization stays as a later phase capability.
  O primeiro milestone de implementacao permanece apenas local e sem custo para desenvolver e executar, enquanto a sincronizacao remota permanece como capability de fase posterior.

## Notes / Notas

**EN:** Entries marked as `planned` reflect current intended direction from the specification and should be validated during implementation.  
**PT-BR:** Entradas marcadas como `planned` refletem a direcao pretendida atual da especificacao e devem ser validadas durante a implementacao.
