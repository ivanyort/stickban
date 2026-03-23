import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import type { BoardRecord, CardDraft } from '../shared/types'

const BOARD_ID = 'board-default'
const DEFAULT_COLUMNS = [
  { id: 'column-todo', title: 'To Do', position: 0 },
  { id: 'column-doing', title: 'Doing', position: 1 },
  { id: 'column-done', title: 'Done', position: 2 }
]

let db: Database.Database | null = null

function now(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }

  return db
}

export function initializeDatabase(userDataPath: string): void {
  const databasePath = join(userDataPath, 'data', 'stickban.db')
  mkdirSync(dirname(databasePath), { recursive: true })

  db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE
    );
  `)

  seedDatabase()
}

function seedDatabase(): void {
  const database = getDb()
  const boardCount = database.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number }

  if (boardCount.count > 0) {
    return
  }

  const insertBoard = database.prepare('INSERT INTO boards (id, title) VALUES (?, ?)')
  const insertColumn = database.prepare(
    'INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)'
  )

  const seed = database.transaction(() => {
    insertBoard.run(BOARD_ID, 'Stickban')
    for (const column of DEFAULT_COLUMNS) {
      insertColumn.run(column.id, BOARD_ID, column.title, column.position)
    }
  })

  seed()
}

export function getBoard(): BoardRecord {
  const database = getDb()
  const board = database.prepare('SELECT id, title FROM boards WHERE id = ?').get(BOARD_ID) as
    | { id: string; title: string }
    | undefined

  if (!board) {
    throw new Error('Default board not found')
  }

  const columns = database
    .prepare('SELECT id, board_id, title, position FROM columns WHERE board_id = ? ORDER BY position ASC')
    .all(BOARD_ID) as Array<{
    id: string
    board_id: string
    title: string
    position: number
  }>

  const cardsByColumn = new Map<string, BoardRecord['columns'][number]['cards']>()
  for (const column of columns) {
    const cards = database
      .prepare(
        'SELECT id, column_id, title, description, position, created_at, updated_at FROM cards WHERE column_id = ? ORDER BY position ASC'
      )
      .all(column.id) as Array<{
      id: string
      column_id: string
      title: string
      description: string
      position: number
      created_at: string
      updated_at: string
    }>

    cardsByColumn.set(
      column.id,
      cards.map((card) => ({
        id: card.id,
        columnId: card.column_id,
        title: card.title,
        description: card.description,
        position: card.position,
        createdAt: card.created_at,
        updatedAt: card.updated_at
      }))
    )
  }

  return {
    id: board.id,
    title: board.title,
    columns: columns.map((column) => ({
      id: column.id,
      boardId: column.board_id,
      title: column.title,
      position: column.position,
      cards: cardsByColumn.get(column.id) ?? []
    }))
  }
}

export function createCard(columnId: string, draft: CardDraft): BoardRecord {
  const database = getDb()
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  const lastPosition = database
    .prepare('SELECT COALESCE(MAX(position), -1) as maxPosition FROM cards WHERE column_id = ?')
    .get(columnId) as { maxPosition: number }

  const insert = database.prepare(
    'INSERT INTO cards (id, column_id, title, description, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  insert.run(
    createId('card'),
    columnId,
    trimmedTitle,
    draft.description.trim(),
    lastPosition.maxPosition + 1,
    now(),
    now()
  )

  return getBoard()
}

export function updateCard(cardId: string, draft: CardDraft): BoardRecord {
  const database = getDb()
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  database
    .prepare('UPDATE cards SET title = ?, description = ?, updated_at = ? WHERE id = ?')
    .run(trimmedTitle, draft.description.trim(), now(), cardId)

  return getBoard()
}

export function deleteCard(cardId: string): BoardRecord {
  const database = getDb()
  const card = database
    .prepare('SELECT id, column_id FROM cards WHERE id = ?')
    .get(cardId) as { id: string; column_id: string } | undefined

  if (!card) {
    throw new Error('Card not found')
  }

  const remove = database.transaction(() => {
    database.prepare('DELETE FROM cards WHERE id = ?').run(cardId)

    const remainingIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC')
        .all(card.column_id) as Array<{ id: string }>
    ).map((row) => row.id)

    const updatePosition = database.prepare('UPDATE cards SET position = ?, updated_at = ? WHERE id = ?')
    remainingIds.forEach((id, index) => {
      updatePosition.run(index, now(), id)
    })
  })

  remove()
  return getBoard()
}

export function moveCard(cardId: string, toColumnId: string, toIndex: number): BoardRecord {
  const database = getDb()

  const card = database
    .prepare('SELECT id, column_id FROM cards WHERE id = ?')
    .get(cardId) as { id: string; column_id: string } | undefined

  if (!card) {
    throw new Error('Card not found')
  }

  const currentColumnId = card.column_id

  const move = database.transaction(() => {
    const sourceIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC')
        .all(currentColumnId) as Array<{ id: string }>
    )
      .map((row) => row.id)
      .filter((id) => id !== cardId)

    const targetIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC')
        .all(toColumnId) as Array<{ id: string }>
    )
      .map((row) => row.id)
      .filter((id) => id !== cardId)

    const boundedIndex = Math.max(0, Math.min(toIndex, targetIds.length))
    targetIds.splice(boundedIndex, 0, cardId)

    const updateSource = database.prepare('UPDATE cards SET position = ?, updated_at = ? WHERE id = ?')
    const updateTarget = database.prepare(
      'UPDATE cards SET column_id = ?, position = ?, updated_at = ? WHERE id = ?'
    )

    sourceIds.forEach((id, index) => {
      updateSource.run(index, now(), id)
    })

    targetIds.forEach((id, index) => {
      updateTarget.run(toColumnId, index, now(), id)
    })
  })

  move()
  return getBoard()
}
