# Stickban

**A sticky Kanban board that lives on your desktop.**

Stickban is a lightweight desktop Kanban application designed to stay visible and accessible while you work. It combines an offline-first local workspace with optional cross-device synchronization through a user-selected synced folder.

## Product Summary

- Desktop-first Kanban workflow
- Offline-first architecture with SQLite as the source of truth
- Multiple persisted boards with board-specific columns
- Fast card movement inside and across columns
- Optional always-on-top behavior
- Optional cloud propagation through a synced folder already managed by the user

## Current Repository Reality

The current runnable milestone already includes:

- Multiple local boards
- Board-specific columns
- Card drag and drop
- SQLite persistence
- Always-on-top support
- Synced-folder cloud sync via immutable operation files and periodic checkpoints
- Packaged Windows update checks through GitHub Releases

The following are not current implementation reality yet:

- Multi-language interface
- Theme support
- System tray integration
- Adjustable opacity
- Managed provider APIs or OAuth-based sync

## Tech Stack

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand for renderer state
- Tailwind CSS
- Renderer-managed drag interactions

## Usage

- Launch Stickban
- Create, edit, move, and delete cards directly in the board UI
- Create, rename, reorder, move, and delete columns
- Switch between multiple boards
- Toggle always-on-top to keep the app visible
- Work fully locally even without internet
- If a synced folder is configured, let the background file-based sync loop propagate changes across devices

## Architecture Overview

Stickban follows an offline-first model:

- Local SQLite database is the operational source of truth
- Local writes succeed immediately and do not depend on sync availability
- A synced folder is used only as a propagation layer between devices
- Sync uses immutable operation files plus periodic checkpoints
- Sync failures must not discard local data

## Data Model

Main entities:

- Boards
- Columns
- Cards

Current model guarantees:

- All entities have stable IDs
- Deletes use tombstones where sync safety matters
- Sync metadata exists to support deterministic replay and conflict handling
- Cards persist `createdAt` and `updatedAt`
- Boards and columns currently persist ordering, tombstones, and sync state instead of dedicated timestamp/version columns

Implementation defaults:

- New entities should use UUIDs
- Local SQLite remains authoritative
- Sync metadata should stay explicit enough to support replay, checkpoint validation, and conflict recovery

## Synchronization

Current sync model:

- Provider: user-managed synced folder such as OneDrive, Dropbox, Google Drive Desktop, iCloud Drive, or equivalent
- Strategy: immutable operation log with periodic checkpoints
- Source of truth: local SQLite on each device
- Recovery primitive: checkpoint import plus later operation replay

Current sync triggers:

- App startup when a synced folder is already configured
- Choosing a synced folder
- Local changes after debounce
- Filesystem changes detected in the synced folder
- Periodic background interval
- Manual `Sync now`

Current sync safety rules:

- Remote bootstrap into an already populated folder must import valid remote state before any local export is allowed
- Invalid checkpoints are rejected instead of becoming canonical state
- Orphan remote operations that reference missing boards or columns are skipped
- Disconnecting a synced folder clears the trusted link so reconnecting the same path runs bootstrap again

## Offline Support

Stickban works fully offline:

- Local reads and writes remain available without internet
- Sync depends only on the local presence of the chosen synced folder
- If the cloud drive client has not yet downloaded the sync files onto the current machine, Stickban cannot import them until they exist locally

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

The repository does not yet match a fully separated final folder layout. The current app implementation lives mainly in:

- `src/main/`
- `src/preload/`
- `src/renderer/`
- `src/shared/`

Any broader `/app/...` structure should still be treated as planned, not current repository reality.

## Non-functional Requirements

- Fast startup
- Responsive renderer interactions
- No UI blocking during sync or update checks
- Local data protection against sync failures
- Deterministic sync behavior when devices reconnect

## Roadmap Direction

Current focus areas after the current milestone:

- Synced-folder cloud sync hardening
- Multi-language interface support
- System tray integration
- Theme support
- Richer sync conflict inspection and recovery UX

## Development Defaults

- Prefer soft deletes for sync safety
- Never block the UI during sync
- Never lose local data because of sync failures
- Keep sync secondary to local persistence, never the other way around

## License

MIT
