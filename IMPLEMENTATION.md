# IMPLEMENTATION

## Purpose

This document tracks the real implementation state of the repository and the high-level milestones already delivered. It should reflect what exists, not what is merely planned.

## Current Repository State

- The repository is still in bootstrap stage.
- A runnable Electron application scaffold now exists.
- The repository currently contains product and process documentation, license metadata, and logo assets.
- Public project documentation exists in [`README.md`](./README.md) and [`README.pt-BR.md`](./README.pt-BR.md).
- Product specification exists in [`SPEC.md`](./SPEC.md).
- Architecture and workflow guidance exists in [`DECISIONS.md`](./DECISIONS.md) and [`AGENTS.md`](./AGENTS.md).
- The first implementation milestone is defined as local-only, without Google sync, OAuth, or external infrastructure.

## Implemented Milestones

- Initial repository documentation baseline created
- Agent workflow guidance documented
- Git and line ending conventions documented
- AI-assisted development policy documented
- Public README split into English and Brazilian Portuguese versions
- Initial Electron/React/TypeScript scaffold delivered
- Local SQLite persistence layer delivered
- Single-board drag-and-drop UI delivered
- GitHub release/version automation configured for `main`
- Windows release packaging simplified to NSIS installer only
- Public GitHub Releases currently publish Windows artifacts only
- Public landing page scaffold delivered under `site/`
- GitHub Pages deployment workflow configured with repository-level fork protection

## Current Implementation Focus

- The current codebase implements the first local-only milestone
- The next major step is hardening and manual validation before committing the scaffold
- The initial scaffold should be usable without subscriptions, paid services, or cloud dependencies

## Not Implemented Yet

- Synchronization layer
- Release workflow validation on GitHub Actions
- Multi-board support
- DNS validation for `stickban.com`

## Notes

- This file records actual repository state and completed milestones.
- Future goals and planning belong in [`ROADMAP.md`](./ROADMAP.md).
- Architectural decisions belong in [`DECISIONS.md`](./DECISIONS.md).
- Remote sync remains intentionally outside the first implementation milestone.
