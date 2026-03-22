# Stickban

A sticky Kanban board that lives on your desktop.

For Brazilian Portuguese, see [`README.pt-BR.md`](./README.pt-BR.md).

## Overview

Stickban is a desktop Kanban application focused on speed, low friction, and constant visibility. The product direction is offline-first, with local persistence as the primary data source and optional cloud synchronization across devices.

## Current Status

This repository is in bootstrap stage. The product specification exists in [`SPEC.md`](./SPEC.md), but the application scaffold has not been created yet.

The documentation in this repository is intended to establish direction before implementation starts.

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

## AI-Assisted Development

Stickban was conceived from the start as a project developed with AI-assisted tooling, including tools such as Codex, Claude, Antigravity, and similar systems. The preferred maintenance model for this repository is to keep using AI-capable development tools as the primary workflow, while still allowing direct manual edits when they are the better fit for a task.

## Transparency Note

This repository may contain code, documentation, and project structure created or refined with AI assistance and human review. AI assistance does not remove the need for technical validation. The project does not provide any warranty beyond the terms already stated in [`LICENSE`](./LICENSE), and independent review remains advisable for commercial, regulated, or higher-risk use cases.

## Getting Started Today

There is no runnable application scaffold yet. The current next step is to turn the product specification into the initial Electron/React/TypeScript project structure.
The current repository state is tracked in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).

## License

This repository includes an MIT license in [`LICENSE`](./LICENSE).
