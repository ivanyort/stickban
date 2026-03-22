# Stickban

A sticky Kanban board that lives on your desktop.

For Brazilian Portuguese, see [`README.pt-BR.md`](./README.pt-BR.md).

## Overview

Stickban is a desktop Kanban application focused on speed, low friction, and constant visibility. The product direction is offline-first, with local persistence as the primary data source and optional cloud synchronization across devices.

## Current Status

This repository is in bootstrap stage. The product specification exists in [`SPEC.md`](./SPEC.md), and the first runnable application scaffold is now in place.

The documentation in this repository is intended to establish direction before implementation starts.
The initial technical milestone is local-first and does not include remote sync, OAuth, or external infrastructure.
The first runnable milestone already covers a single local board, SQLite persistence, drag and drop, and always-on-top behavior.

## Product Direction

- Desktop-first Kanban workflow
- Sticky widget behavior, with optional always-on-top mode
- Fast and lightweight user experience
- Offline-first architecture
- Local SQLite persistence
- Optional Google Drive synchronization

## Planned Technology Stack

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand for state management
- Tailwind CSS
- `dnd-kit` for drag and drop

## Initial Implementation Cut

- Keep the local desktop stack: Electron, React + TypeScript, `better-sqlite3`, Zustand, Tailwind CSS, and `dnd-kit`
- Exclude Google Drive sync, OAuth, and remote infrastructure from the first scaffold
- Focus the first milestone on a single local board, 3 columns, drag and drop, SQLite persistence, and always-on-top behavior
- Treat sync as a later capability, not as a bootstrap requirement

## Local Development

Prerequisites:

- Node.js 18+ recommended
- npm

Commands:

```bash
npm install
npm run dev
```

If you are running as `root` in WSL/Linux, use:

```bash
npm run dev:root
```

Production build:

```bash
npm run build
npm run dist
```

To launch the built app as `root`:

```bash
npm run start:root
```

## Core Principles

- Local data is the source of truth
- UI interactions should stay responsive
- Sync must not block the interface
- Local data must not be lost because of sync failures
- AI-assisted development is the default workflow, with manual edits allowed when appropriate
- Architectural changes should remain aligned with [`SPEC.md`](./SPEC.md) and [`DECISIONS.md`](./DECISIONS.md)

## Planned Project Structure

The structure below is planned, not implemented yet.

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

## Roadmap Snapshot

For the detailed roadmap, see [`ROADMAP.md`](./ROADMAP.md).

- MVP: single board, 3 columns, drag and drop, SQLite persistence, always-on-top
- Phase 2: multiple boards, Google Drive sync, system tray, themes
- Future: custom fields, notifications, advanced conflict resolution, mobile companion

## Repository Documents

- [`README.pt-BR.md`](./README.pt-BR.md): Brazilian Portuguese version of this README
- [`SPEC.md`](./SPEC.md): product specification
- [`ROADMAP.md`](./ROADMAP.md): planned milestones and future priorities
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): current repository state and delivered milestones
- [`AGENTS.md`](./AGENTS.md): operating guidance for programming agents
- [`DECISIONS.md`](./DECISIONS.md): architecture decision log

## Releases

- Every push to `main` is intended to generate an automatic GitHub Release
- The release version is calculated from commit conventions since the latest SemVer tag
- `feat` bumps minor, `fix` and operational commit types bump patch, and `BREAKING CHANGE` or `type!` bumps major
- Release artifacts are produced for Windows and Linux

## AI-Assisted Development

Stickban was conceived from the start as a project developed with AI-assisted tooling, including tools such as Codex, Claude, Antigravity, and similar systems. The preferred maintenance model for this repository is to keep using AI-capable development tools as the primary workflow, while still allowing direct manual edits when they are the better fit for a task.

## Transparency Note

This repository may contain code, documentation, and project structure created or refined with AI assistance and human review. AI assistance does not remove the need for technical validation. The project does not provide any warranty beyond the terms already stated in [`LICENSE`](./LICENSE), and independent review remains advisable for commercial, regulated, or higher-risk use cases.

## Getting Started Today

The repository now contains a runnable local-first Electron/React/TypeScript scaffold for the first milestone.
The current repository state is tracked in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
The initial scaffold is expected to work without paid services, subscriptions, cloud infrastructure, or Google integration.

## License

This repository includes an MIT license in [`LICENSE`](./LICENSE).
