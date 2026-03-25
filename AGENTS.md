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
- A runnable local-first application scaffold now exists.
- Do not describe commands, scripts, folders, or modules as already implemented unless they exist in the repository.
- Treat planned structure as planned structure, not current implementation.

**PT-BR**

- O repositorio esta em fase de bootstrap.
- Ja existe um scaffold executavel local-first da aplicacao.
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
- User-selected synced folder as sync provider
- Immutable operation-log sync with periodic checkpoints
- Tombstones and deterministic merge rules for remote conflict handling
- AI-assisted development by default, with manual edits allowed when appropriate
- Initial scaffold must remain local-first and exclude Google sync, OAuth, and external infrastructure
- Public landing page deployment must stay separate from the desktop release pipeline

## Agent Operating Rules / Regras Operacionais para Agentes

1. Do not invent repository reality.
   State clearly when something is planned versus already implemented.

2. Preserve the offline-first model.
   Local writes should be treated as primary; sync is a secondary propagation mechanism.

3. Treat SQLite as the authoritative local store.
   Do not redesign persistence around remote-first assumptions.

4. Do not introduce sync behavior that contradicts the documented remote sync direction.
   If a change would alter the synced-folder provider model, operation-log strategy, checkpoint role, or conflict semantics, record it in [`DECISIONS.md`](./DECISIONS.md) as part of the same work.

5. Keep the implementation scope intentionally narrow.
   Do not add provider APIs, OAuth, paid services, or managed cloud dependencies unless the documented project direction changes.

6. Keep the public landing page pipeline independent.
   Changes to the public site must not break or replace the desktop app release workflow, and automatic Pages deployment must remain restricted to the official repository.

7. Prefer small, traceable changes.
   Keep diffs narrow and document meaningful architectural changes.

8. Record assumptions explicitly.
   When code or infrastructure does not exist yet, note assumptions in documentation, task output, or decision records rather than silently filling gaps.

9. Keep documentation synchronized with reality.
   Update [`README.md`](./README.md) when public-facing setup or project status changes.
   Update [`README.pt-BR.md`](./README.pt-BR.md) when the Portuguese public-facing guidance changes.
   Update [`ROADMAP.md`](./ROADMAP.md) when priorities or future direction change.
   Update [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) when a relevant delivery changes the actual repository state.
   Update [`DECISIONS.md`](./DECISIONS.md) when architecture or implementation direction changes materially.

10. Update Markdown documentation as part of every relevant delivery.
   If a change affects workflow, architecture, setup, scope, or repository conventions, update the affected `.md` files in the same delivery.

11. Update the public site whenever a relevant delivery changes public project reality.
   If a change affects product capabilities, public positioning, release expectations, or repository status that is reflected in `site/`, update the landing page content in the same delivery.

12. Preserve the repository's AI-first development model.
   Prefer implementation and maintenance through compatible AI-assisted tools and agents when possible, while allowing manual code edits as a complementary path when they are the better fit.

13. Treat AI output as material that still requires technical validation.
    Expected use of AI does not remove the need to review correctness, safety, maintainability, and repository alignment.

## Documentation Expectations / Expectativas de Documentacao

**EN:** Public-facing repository guidance belongs in `README.md` and `README.pt-BR.md`. Future planning belongs in `ROADMAP.md`. Real implementation state and delivered milestones belong in `IMPLEMENTATION.md`. Agent-specific rules belong in `AGENTS.md`. Architectural intent and changes belong in `DECISIONS.md`.  
**PT-BR:** Orientacoes publicas do repositorio pertencem ao `README.md` e ao `README.pt-BR.md`. Planejamento futuro pertence ao `ROADMAP.md`. Estado real da implementacao e marcos entregues pertencem ao `IMPLEMENTATION.md`. Regras especificas para agentes pertencem ao `AGENTS.md`. Intencao arquitetural e mudancas relevantes pertencem ao `DECISIONS.md`.

Avoid copying large sections from `SPEC.md`. Prefer linking back to the spec and summarizing only what is necessary.
Keep AI workflow policy and public transparency notes consistent across `README.md` and `README.pt-BR.md` when they change.
Treat `.md` files and the public site under `site/` as mandatory synchronization targets whenever the delivery changes public-facing capabilities or project reality.
Do not record completed implementation work in `ROADMAP.md`, and do not use `IMPLEMENTATION.md` as a backlog for future work.
Do not introduce paid dependencies or cloud requirements into the initial scaffold unless the repository decisions are updated first.
Treat commit conventions as release semantics, because pushes to `main` are expected to trigger automatic SemVer-based releases.
Keep GitHub Pages publication protected so forks can build the landing page without deploying the official domain.

## Implementation Defaults / Defaults de Implementacao

Unless the repository later defines a different rule:

- Use UUIDs for entity identifiers
- Prefer soft deletes where sync safety matters
- Avoid blocking the UI during sync work
- Protect local data from remote sync failures
- Keep naming and module boundaries consistent with the planned app/main/renderer split
- Assume AI-assisted implementation is the preferred delivery path unless the user explicitly requests otherwise
- Assume the current sync milestone must run without provider APIs or OAuth

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

## Line Ending Policy / Politica de Finais de Linha

**EN:** The repository should normalize text files with LF in Git to reduce Windows, WSL, and Linux interoperability issues. Use [`.gitattributes`](./.gitattributes) as the source of truth for line ending behavior.  
**PT-BR:** O repositorio deve normalizar arquivos de texto com LF no Git para reduzir problemas de interoperabilidade entre Windows, WSL e Linux. Use [`.gitattributes`](./.gitattributes) como fonte de verdade para o comportamento de finais de linha.

## When to Update This File / Quando Atualizar Este Arquivo

Update `AGENTS.md` when:

- the tech stack changes;
- the repository moves beyond bootstrap and gains real scripts/paths/workflows;
- agent operating constraints change;
- architectural rules need stronger or weaker enforcement.
