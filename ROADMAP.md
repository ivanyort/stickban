# ROADMAP

## Purpose

This document tracks planned product direction and upcoming milestones for Stickban. It is the place for future work and current priorities, not for implementation history.

## Status Model

- `planned`: intended but not started
- `in progress`: currently being worked on
- `blocked`: waiting on a dependency or decision
- `done`: completed milestone, kept temporarily until reflected elsewhere

## MVP

Status: `in progress`

Goals and milestones:

- Local workspace experience for the desktop
- Multiple boards with board-specific columns
- Drag and drop movement for cards
- Local SQLite persistence
- Always-on-top support
- Initial Electron + React + TypeScript application scaffold

Implementation constraints for this phase:

- No Google Drive sync
- No OAuth
- No external infrastructure or paid services

## Phase 2

Status: `planned`

Goals and milestones:

- Google Drive synchronization
- System tray integration
- Theme support

## Future

Status: `planned`

Goals and milestones:

- Custom fields
- Notifications
- More advanced sync conflict resolution
- Mobile companion app

## Notes

- This file tracks future direction and active priorities.
- Detailed architectural choices belong in [`DECISIONS.md`](./DECISIONS.md).
- Current repository reality and completed milestones belong in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
- Remote sync belongs to a later phase and is not part of the initial scaffold milestone.
