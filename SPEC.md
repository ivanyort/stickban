# 🧩 Stickban

**A sticky Kanban board that lives on your desktop.**

Stickban is a lightweight desktop Kanban application designed to stay visible and accessible at all times. It combines a fast, distraction-free workflow with an offline-first architecture and optional cloud synchronization.

---

## 🚀 Features

- 🧩 Kanban boards with drag-and-drop cards
- 📌 Sticky desktop widget behavior (always-on-top optional)
- ⚡ Fast and lightweight UX
- 🌐 Works fully offline (offline-first)
- 🔄 Automatic sync across devices through a user-selected synced folder
- 🎨 Light, dark, and black themes
- 🖥️ Frameless window with adjustable opacity
- 🧠 Local-first data persistence (SQLite)
- 🔁 Background sync with retry and resilience

---

## 🧱 Tech Stack

- Electron
- React + TypeScript
- SQLite (better-sqlite3)
- Zustand (state management)
- TailwindCSS
- Renderer-managed drag and drop

---

## 📦 Installation

### Prerequisites

- Node.js (>= 18)
- npm or pnpm

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build application

```bash
npm run build
```

---

## 🖥️ Usage

- Launch Stickban
- Create or edit cards directly on the board
- Drag cards between columns
- Toggle always-on-top to keep it visible
- Work normally even without internet
- If a synced folder is configured, sync runs automatically through local file replication

---

## 🧠 Architecture Overview

Stickban follows an **offline-first architecture**:

- Local SQLite database is the source of truth
- All changes are persisted locally immediately
- Changes are queued for background synchronization
- A user-selected synced folder is used only as a sync layer

---

## 💾 Data Model

Main entities:

- Boards
- Columns
- Cards

Each entity includes:

- id (UUID)
- deletedAt when sync safety matters
- sync metadata needed for conflict handling and replay

Current implementation notes:

- Cards persist `createdAt` and `updatedAt`
- Boards and columns currently persist ordering, tombstones, and sync state instead of dedicated timestamp/version columns

---

## 🔄 Synchronization

- Provider: user-managed synced folder (OneDrive, Dropbox, Google Drive Desktop, iCloud Drive, or equivalent)
- Strategy: immutable operation log with periodic checkpoints
- Conflict handling: deterministic merge with tombstones and checkpoint recovery

### Sync triggers:

- App startup
- Synced folder configured
- Local changes with debounce
- Background interval
- Manual trigger

---

## 📡 Offline Support

Stickban works fully offline:

- Create, edit, move, delete cards without internet
- Changes are stored locally
- Sync resumes when the configured synced folder becomes available again and the local file-based sync loop runs

---

## 📁 Project Structure

```
/app
  /main
  /renderer
  /db
  /services
    /sync
    /syncFolder
  /models
  /store
  /components
  /hooks
  /utils
```

---

## 🧪 Non-functional Requirements

- Startup time < 2 seconds
- Smooth drag-and-drop interactions
- Low memory usage
- No UI blocking during sync

---

## 🗺️ Roadmap

### MVP
- Single board
- 3 columns
- Drag & drop
- SQLite persistence
- Always-on-top

### Phase 2
- Multiple boards
- Synced-folder cloud sync
- System tray
- Themes

### Future
- Custom fields
- Notifications
- Advanced sync conflict resolution
- Mobile companion app

---

## 🧠 Development Notes

- Use UUIDs for all entities
- Prefer soft deletes for sync safety
- Never block UI during sync
- Never lose local data due to sync failures

---

## 📄 License

MIT (or define later)

---

## ✨ Vision

Stickban aims to be the simplest and fastest way to manage tasks directly from your des
