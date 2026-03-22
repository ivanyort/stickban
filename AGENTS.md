# AGENTS

## Purpose / Proposito

**EN:** This file defines how programming agents should operate in the Stickban repository. It is intended for tools such as Codex, Claude, and similar coding agents.  
**PT-BR:** Este arquivo define como agentes de programacao devem operar no repositorio Stickban. Ele e destinado a ferramentas como Codex, Claude e agentes similares.

## Primary Source of Truth / Fonte Principal de Verdade

**EN:** Use [`SPEC.md`](./SPEC.md) as the main product reference. Use [`DECISIONS.md`](./DECISIONS.md) as the running log of architectural choices.  
**PT-BR:** Use [`SPEC.md`](./SPEC.md) como referencia principal de produto. Use [`DECISIONS.md`](./DECISIONS.md) como registro corrente das escolhas arquiteturais.

If a proposal conflicts with `SPEC.md`, treat the spec as authoritative unless the repository explicitly records a newer decision in `DECISIONS.md`.

## Current Repository Reality / Realidade Atual do Repositorio

**EN**

- The repository is in bootstrap stage.
- There is no application scaffold yet.
- Do not describe commands, scripts, folders, or modules as already implemented unless they exist in the repository.
- Treat planned structure as planned structure, not current implementation.

**PT-BR**

- O repositorio esta em fase de bootstrap.
- Ainda nao existe scaffold da aplicacao.
- Nao descreva comandos, scripts, pastas ou modulos como ja implementados se eles nao existirem no repositorio.
- Trate a estrutura planejada como estrutura planejada, nao como implementacao atual.

## Technical Direction / Direcao Tecnica

Agents should stay aligned with these project-level decisions:

- Desktop app built with Electron
- Renderer built with React + TypeScript
- Local persistence in SQLite
- Zustand for state management
- Tailwind CSS for styling
- `dnd-kit` for drag and drop
- Offline-first architecture
- Local SQLite database as source of truth
- Google Drive AppDataFolder as sync provider
- Snapshot-based sync for MVP
- Last-write-wins conflict resolution for MVP

## Agent Operating Rules / Regras Operacionais para Agentes

1. Do not invent repository reality.
   State clearly when something is planned versus already implemented.

2. Preserve the offline-first model.
   Local writes should be treated as primary; sync is a secondary propagation mechanism.

3. Treat SQLite as the authoritative local store.
   Do not redesign persistence around remote-first assumptions.

4. Do not introduce sync behavior that contradicts the current MVP direction.
   If a change would alter snapshot sync or last-write-wins semantics, record it in [`DECISIONS.md`](./DECISIONS.md) as part of the same work.

5. Prefer small, traceable changes.
   Keep diffs narrow and document meaningful architectural changes.

6. Record assumptions explicitly.
   When code or infrastructure does not exist yet, note assumptions in documentation, task output, or decision records rather than silently filling gaps.

7. Keep documentation synchronized with reality.
   Update [`README.md`](./README.md) when public-facing setup or project status changes.
   Update [`DECISIONS.md`](./DECISIONS.md) when architecture or implementation direction changes materially.

## Documentation Expectations / Expectativas de Documentacao

**EN:** Public-facing repository guidance belongs in `README.md`. Agent-specific rules belong in `AGENTS.md`. Architectural intent and changes belong in `DECISIONS.md`.  
**PT-BR:** Orientacoes publicas do repositorio pertencem ao `README.md`. Regras especificas para agentes pertencem ao `AGENTS.md`. Intencao arquitetural e mudancas relevantes pertencem ao `DECISIONS.md`.

Avoid copying large sections from `SPEC.md`. Prefer linking back to the spec and summarizing only what is necessary.

## Implementation Defaults / Defaults de Implementacao

Unless the repository later defines a different rule:

- Use UUIDs for entity identifiers
- Prefer soft deletes where sync safety matters
- Avoid blocking the UI during sync work
- Protect local data from remote sync failures
- Keep naming and module boundaries consistent with the planned app/main/renderer split

## Git Workflow Policy / Politica de Workflow Git

All programming agents working in this repository must follow these Git rules:

1. Use commit conventions in every commit message.
   The subject line must follow a conventional prefix such as `docs:`, `feat:`, `fix:`, `refactor:`, or equivalent.

2. Write detailed commit messages.
   Explain what changed and why, especially when the diff affects architecture, repository conventions, or shared workflow.

3. Push after every commit.
   Do not leave local commits unpublished unless the user explicitly asks not to push.

4. Stage all relevant tracked and untracked changes for the task before committing.
   Respect `.gitignore`, but do not omit files that are part of the intended change set.

5. For detailed or multiline commit messages, always write the message to a temporary file and run `git commit -F <file>`.
   Do not use inline multiline commit flags for this repository workflow.

6. Never use `git commit -m` for multiline messages or messages containing characters that are easier to preserve via file-based commit input.
   This includes cases with backticks, dollar signs, backslashes, or markdown-like formatting.

7. Use the repository commit author required by the project when creating commits through an agent workflow.
   Current required author: `Ivan Yort <ivan.yort@gmail.com>`.

## Git Workflow Summary / Resumo do Workflow Git

**EN:** If an agent makes a repository change, the default expectation is: stage the full task diff, create a conventional detailed commit using a temporary message file, and push immediately.  
**PT-BR:** Se um agente fizer uma mudanca no repositorio, a expectativa padrao e: adicionar todo o diff da tarefa, criar um commit convencional detalhado usando arquivo temporario de mensagem e fazer push imediatamente.

## When to Update This File / Quando Atualizar Este Arquivo

Update `AGENTS.md` when:

- the tech stack changes;
- the repository moves beyond bootstrap and gains real scripts/paths/workflows;
- agent operating constraints change;
- architectural rules need stronger or weaker enforcement.
