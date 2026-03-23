# Stickban

A sticky Kanban board that lives on your desktop.

For Brazilian Portuguese, see [`README.pt-BR.md`](./README.pt-BR.md).

## Overview

Stickban is a desktop Kanban application focused on speed, low friction, and constant visibility. The product direction is offline-first, with local persistence as the primary data source and optional cloud synchronization across devices.

## Current Status

This repository is in bootstrap stage. The product specification exists in [`SPEC.md`](./SPEC.md), and the first runnable application scaffold is now in place.

The documentation in this repository is intended to establish direction while implementation is still maturing.
The current technical milestone remains local-first and does not include remote sync, OAuth, or external infrastructure.
The current runnable milestone already covers multiple local boards, board-specific columns, column reordering and cross-board moves, SQLite persistence, drag and drop, and always-on-top behavior.

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
- Focus the current milestone on a fully local workspace with multiple boards, board-specific columns, inline column rename, column drag and drop, SQLite persistence, and always-on-top behavior
- Treat sync as a later capability, not as a bootstrap requirement

## Local Development

Prerequisites:

- Node.js 18+ recommended
- npm

Commands:

```bash
npm install
npm run dev
npm run site:build
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

## Local Data Path

Stickban persists its local SQLite database at:

```text
<userData>/data/stickban.db
```

Typical locations:

- Windows packaged app: `%APPDATA%/Stickban/data/stickban.db`
- Linux packaged app: `~/.config/Stickban/data/stickban.db`
- Linux development runs: `~/.config/Electron/data/stickban.db`

The Linux development path may use `Electron` instead of `Stickban` because Electron dev runs can inherit the default app name before packaging.

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

- MVP: local workspace, multiple boards, customizable columns, column drag and drop, SQLite persistence, always-on-top
- Phase 2: Google Drive sync, system tray, themes
- Future: custom fields, notifications, advanced conflict resolution, mobile companion

## Repository Documents

- [`README.pt-BR.md`](./README.pt-BR.md): Brazilian Portuguese version of this README
- [`SPEC.md`](./SPEC.md): product specification
- [`ROADMAP.md`](./ROADMAP.md): planned milestones and future priorities
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): current repository state and delivered milestones
- [`AGENTS.md`](./AGENTS.md): operating guidance for programming agents
- [`DECISIONS.md`](./DECISIONS.md): architecture decision log

## Landing Page

- The project includes a public landing page built from [`site/`](./site)
- The landing page is intended for GitHub Pages publication
- The canonical public domain is `stickban.com`
- Forks can build the site, but automatic Pages deployment is restricted to the official repository

## Releases

- Every push to `main` is intended to generate an automatic GitHub Release
- The release version is calculated from commit conventions since the latest SemVer tag
- `feat` bumps minor, `fix` and operational commit types bump patch, and `BREAKING CHANGE` or `type!` bumps major
- Public release artifacts are currently produced for Windows only
- Windows releases are distributed as an NSIS installer
- Linux packaging remains available for local builds, but Linux artifacts are not currently published in GitHub Releases
- The public landing page is deployed separately from the desktop release pipeline

## AI-Assisted Development

Stickban was conceived from the start as a project developed with AI-assisted tooling, including tools such as Codex, Claude, Antigravity, and similar systems. The preferred maintenance model for this repository is to keep using AI-capable development tools as the primary workflow, while still allowing direct manual edits when they are the better fit for a task.

## Transparency Note

This repository may contain code, documentation, and project structure created or refined with AI assistance and human review. AI assistance does not remove the need for technical validation. The project does not provide any warranty beyond the terms already stated in [`LICENSE`](./LICENSE), and independent review remains advisable for commercial, regulated, or higher-risk use cases.

## Getting Started Today

The repository now contains a runnable local-first Electron/React/TypeScript scaffold for the first milestone.
The current repository state is tracked in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
The initial scaffold is expected to work without paid services, subscriptions, cloud infrastructure, or Google integration.
The app footer displays the runtime application version exposed by Electron, which is intended to match the version injected into packaged releases by the GitHub Actions release workflow.

## License

This repository includes an MIT license in [`LICENSE`](./LICENSE).
