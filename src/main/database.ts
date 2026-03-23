import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import type {
  BoardDraft,
  BoardRecord,
  BoardSummary,
  CardDraft,
  ColumnDraft,
  WorkspaceRecord
} from '../shared/types'

const DEFAULT_COLUMNS = ['To Do', 'Doing', 'Done']
const ACTIVE_BOARD_KEY = 'active_board_id'

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

function hasColumn(tableName: string, columnName: string): boolean {
  const database = getDb()
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  return columns.some((column) => column.name === columnName)
}

function getBoardRows(): Array<{ id: string; title: string; position: number }> {
  return getDb()
    .prepare('SELECT id, title, position FROM boards ORDER BY position ASC, rowid ASC')
    .all() as Array<{ id: string; title: string; position: number }>
}

function getStateValue(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM app_state WHERE key = ?')
    .get(key) as { value: string } | undefined

  return row?.value ?? null
}

function setStateValue(key: string, value: string): void {
  getDb()
    .prepare(
      `
        INSERT INTO app_state (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `
    )
    .run(key, value)
}

function getBoardById(boardId: string): BoardRecord {
  const database = getDb()
  const board = database
    .prepare('SELECT id, title, position FROM boards WHERE id = ?')
    .get(boardId) as { id: string; title: string; position: number } | undefined

  if (!board) {
    throw new Error('Board not found')
  }

  const columns = database
    .prepare(
      'SELECT id, board_id, title, position FROM columns WHERE board_id = ? ORDER BY position ASC, rowid ASC'
    )
    .all(boardId) as Array<{
    id: string
    board_id: string
    title: string
    position: number
  }>

  return {
    id: board.id,
    title: board.title,
    position: board.position,
    columns: columns.map((column) => ({
      id: column.id,
      boardId: column.board_id,
      title: column.title,
      position: column.position,
      cards: database
        .prepare(
          `
            SELECT id, column_id, title, description, position, created_at, updated_at
            FROM cards
            WHERE column_id = ?
            ORDER BY position ASC, rowid ASC
          `
        )
        .all(column.id)
        .map((card) => ({
          id: (card as any).id,
          columnId: (card as any).column_id,
          title: (card as any).title,
          description: (card as any).description,
          position: (card as any).position,
          createdAt: (card as any).created_at,
          updatedAt: (card as any).updated_at
        }))
    }))
  }
}

function getBoardSummaries(): BoardSummary[] {
  return getDb()
    .prepare(
      `
        SELECT
          b.id,
          b.title,
          b.position,
          COUNT(DISTINCT c.id) AS column_count,
          COUNT(cards.id) AS card_count
        FROM boards b
        LEFT JOIN columns c ON c.board_id = b.id
        LEFT JOIN cards ON cards.column_id = c.id
        GROUP BY b.id
        ORDER BY b.position ASC, b.rowid ASC
      `
    )
    .all()
    .map((row) => ({
      id: (row as any).id,
      title: (row as any).title,
      position: (row as any).position,
      columnCount: (row as any).column_count,
      cardCount: (row as any).card_count
    }))
}

function getFallbackBoardId(): string {
  const boards = getBoardRows()
  if (boards.length === 0) {
    throw new Error('No boards available')
  }

  return boards[0].id
}

function resolveActiveBoardId(): string {
  const preferred = getStateValue(ACTIVE_BOARD_KEY)
  if (preferred) {
    const exists = getDb().prepare('SELECT 1 FROM boards WHERE id = ?').get(preferred) as
      | { 1: number }
      | undefined
    if (exists) {
      return preferred
    }
  }

  const fallback = getFallbackBoardId()
  setStateValue(ACTIVE_BOARD_KEY, fallback)
  return fallback
}

function createDefaultColumns(boardId: string): void {
  const insertColumn = getDb().prepare(
    'INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)'
  )

  DEFAULT_COLUMNS.forEach((title, index) => {
    insertColumn.run(createId('column'), boardId, title, index)
  })
}

function normalizeBoardPositions(): void {
  const update = getDb().prepare('UPDATE boards SET position = ? WHERE id = ?')
  getBoardRows().forEach((board, index) => {
    if (board.position !== index) {
      update.run(index, board.id)
    }
  })
}

function normalizeColumnPositions(boardId: string): void {
  const columns = getDb()
    .prepare('SELECT id, position FROM columns WHERE board_id = ? ORDER BY position ASC, rowid ASC')
    .all(boardId) as Array<{ id: string; position: number }>

  const update = getDb().prepare('UPDATE columns SET position = ? WHERE id = ?')
  columns.forEach((column, index) => {
    if (column.position !== index) {
      update.run(index, column.id)
    }
  })
}

function initializeSchema(): void {
  const database = getDb()

  database.exec(`
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

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  if (!hasColumn('boards', 'position')) {
    database.exec('ALTER TABLE boards ADD COLUMN position INTEGER NOT NULL DEFAULT 0')
  }
}

function seedDatabase(): void {
  const database = getDb()
  const boardCount = database.prepare('SELECT COUNT(*) AS count FROM boards').get() as { count: number }

  if (boardCount.count === 0) {
    const boardId = createId('board')
    const seed = database.transaction(() => {
      database.prepare('INSERT INTO boards (id, title, position) VALUES (?, ?, ?)').run(boardId, 'Stickban', 0)
      createDefaultColumns(boardId)
      setStateValue(ACTIVE_BOARD_KEY, boardId)
    })

    seed()
    return
  }

  const migrate = database.transaction(() => {
    normalizeBoardPositions()

    const boards = getBoardRows()
    boards.forEach((board) => {
      const columnCount = database
        .prepare('SELECT COUNT(*) AS count FROM columns WHERE board_id = ?')
        .get(board.id) as { count: number }

      if (columnCount.count === 0) {
        createDefaultColumns(board.id)
      } else {
        normalizeColumnPositions(board.id)
      }
    })

    if (!getStateValue(ACTIVE_BOARD_KEY)) {
      setStateValue(ACTIVE_BOARD_KEY, boards[0].id)
    }
  })

  migrate()
}

export function initializeDatabase(userDataPath: string): void {
  const databasePath = join(userDataPath, 'data', 'stickban.db')
  mkdirSync(dirname(databasePath), { recursive: true })

  db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initializeSchema()
  seedDatabase()
}

export function getWorkspace(): WorkspaceRecord {
  const activeBoardId = resolveActiveBoardId()

  return {
    boards: getBoardSummaries(),
    activeBoardId,
    activeBoard: getBoardById(activeBoardId)
  }
}

export function createBoard(draft: BoardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Board title is required')
  }

  const database = getDb()
  const lastBoard = database
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM boards')
    .get() as { maxPosition: number }

  const boardId = createId('board')
  const create = database.transaction(() => {
    database
      .prepare('INSERT INTO boards (id, title, position) VALUES (?, ?, ?)')
      .run(boardId, trimmedTitle, lastBoard.maxPosition + 1)
    createDefaultColumns(boardId)
    setStateValue(ACTIVE_BOARD_KEY, boardId)
  })

  create()
  return getWorkspace()
}

export function updateBoard(boardId: string, draft: BoardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Board title is required')
  }

  getDb().prepare('UPDATE boards SET title = ? WHERE id = ?').run(trimmedTitle, boardId)
  return getWorkspace()
}

export function deleteBoard(boardId: string): WorkspaceRecord {
  const database = getDb()
  const boards = getBoardRows()

  if (boards.length <= 1) {
    throw new Error('At least one board must remain')
  }

  const boardIndex = boards.findIndex((board) => board.id === boardId)
  if (boardIndex === -1) {
    throw new Error('Board not found')
  }

  const deleteOperation = database.transaction(() => {
    database.prepare('DELETE FROM boards WHERE id = ?').run(boardId)
    normalizeBoardPositions()

    const currentActiveBoardId = getStateValue(ACTIVE_BOARD_KEY)
    if (currentActiveBoardId === boardId) {
      const remainingBoards = getBoardRows()
      const nextBoard = remainingBoards[boardIndex] ?? remainingBoards[boardIndex - 1]
      if (!nextBoard) {
        throw new Error('No boards available after deletion')
      }
      setStateValue(ACTIVE_BOARD_KEY, nextBoard.id)
    }
  })

  deleteOperation()
  return getWorkspace()
}

export function setActiveBoard(boardId: string): WorkspaceRecord {
  const exists = getDb().prepare('SELECT 1 FROM boards WHERE id = ?').get(boardId) as
    | { 1: number }
    | undefined

  if (!exists) {
    throw new Error('Board not found')
  }

  setStateValue(ACTIVE_BOARD_KEY, boardId)
  return getWorkspace()
}

export function createColumn(boardId: string, draft: ColumnDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Column title is required')
  }

  const database = getDb()
  const lastColumn = database
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM columns WHERE board_id = ?')
    .get(boardId) as { maxPosition: number }

  database
    .prepare('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)')
    .run(createId('column'), boardId, trimmedTitle, lastColumn.maxPosition + 1)

  return getWorkspace()
}

export function updateColumn(columnId: string, draft: ColumnDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Column title is required')
  }

  getDb().prepare('UPDATE columns SET title = ? WHERE id = ?').run(trimmedTitle, columnId)
  return getWorkspace()
}

export function deleteColumn(columnId: string): WorkspaceRecord {
  const database = getDb()
  const column = database
    .prepare('SELECT id, board_id FROM columns WHERE id = ?')
    .get(columnId) as { id: string; board_id: string } | undefined

  if (!column) {
    throw new Error('Column not found')
  }

  const remove = database.transaction(() => {
    database.prepare('DELETE FROM columns WHERE id = ?').run(columnId)
    normalizeColumnPositions(column.board_id)
  })

  remove()
  return getWorkspace()
}

export function moveColumn(columnId: string, toBoardId: string, toIndex: number): WorkspaceRecord {
  const database = getDb()
  const column = database
    .prepare('SELECT id, board_id, position FROM columns WHERE id = ?')
    .get(columnId) as { id: string; board_id: string; position: number } | undefined

  if (!column) {
    throw new Error('Column not found')
  }

  const targetBoard = database
    .prepare('SELECT id FROM boards WHERE id = ?')
    .get(toBoardId) as { id: string } | undefined

  if (!targetBoard) {
    throw new Error('Target board not found')
  }

  const move = database.transaction(() => {
    const sourceBoardId = column.board_id
    const sourceIds = (
      database
        .prepare('SELECT id FROM columns WHERE board_id = ? ORDER BY position ASC, rowid ASC')
        .all(sourceBoardId) as Array<{ id: string }>
    )
      .map((row) => row.id)
      .filter((id) => id !== columnId)

    const targetIds = (
      database
        .prepare('SELECT id FROM columns WHERE board_id = ? ORDER BY position ASC, rowid ASC')
        .all(toBoardId) as Array<{ id: string }>
    )
      .map((row) => row.id)
      .filter((id) => id !== columnId)

    const boundedIndex = Math.max(0, Math.min(toIndex, targetIds.length))
    targetIds.splice(boundedIndex, 0, columnId)

    const updateSource = database.prepare('UPDATE columns SET position = ? WHERE id = ?')
    const updateTarget = database.prepare('UPDATE columns SET board_id = ?, position = ? WHERE id = ?')

    sourceIds.forEach((id, index) => {
      updateSource.run(index, id)
    })

    targetIds.forEach((id, index) => {
      updateTarget.run(toBoardId, index, id)
    })

    if (sourceBoardId === toBoardId) {
      return
    }

    normalizeColumnPositions(sourceBoardId)
  })

  move()
  return getWorkspace()
}

export function createCard(columnId: string, draft: CardDraft): WorkspaceRecord {
  const database = getDb()
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  const lastPosition = database
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM cards WHERE column_id = ?')
    .get(columnId) as { maxPosition: number }

  database
    .prepare(
      'INSERT INTO cards (id, column_id, title, description, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      createId('card'),
      columnId,
      trimmedTitle,
      draft.description.trim(),
      lastPosition.maxPosition + 1,
      now(),
      now()
    )

  return getWorkspace()
}

export function updateCard(cardId: string, draft: CardDraft): WorkspaceRecord {
  const database = getDb()
  const trimmedTitle = draft.title.trim()

  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  database
    .prepare('UPDATE cards SET title = ?, description = ?, updated_at = ? WHERE id = ?')
    .run(trimmedTitle, draft.description.trim(), now(), cardId)

  return getWorkspace()
}

export function deleteCard(cardId: string): WorkspaceRecord {
  const database = getDb()
  const card = database
    .prepare(
      `
        SELECT cards.id, cards.column_id, columns.board_id
        FROM cards
        INNER JOIN columns ON columns.id = cards.column_id
        WHERE cards.id = ?
      `
    )
    .get(cardId) as { id: string; column_id: string; board_id: string } | undefined

  if (!card) {
    throw new Error('Card not found')
  }

  const remove = database.transaction(() => {
    database.prepare('DELETE FROM cards WHERE id = ?').run(cardId)

    const remainingIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC, rowid ASC')
        .all(card.column_id) as Array<{ id: string }>
    ).map((row) => row.id)

    const updatePosition = database.prepare('UPDATE cards SET position = ?, updated_at = ? WHERE id = ?')
    remainingIds.forEach((id, index) => {
      updatePosition.run(index, now(), id)
    })
  })

  remove()
  return getWorkspace()
}

export function moveCard(cardId: string, toColumnId: string, toIndex: number): WorkspaceRecord {
  const database = getDb()

  const card = database
    .prepare(
      `
        SELECT cards.id, cards.column_id, source_columns.board_id AS board_id
        FROM cards
        INNER JOIN columns source_columns ON source_columns.id = cards.column_id
        WHERE cards.id = ?
      `
    )
    .get(cardId) as { id: string; column_id: string; board_id: string } | undefined

  if (!card) {
    throw new Error('Card not found')
  }

  const targetColumn = database
    .prepare('SELECT id, board_id FROM columns WHERE id = ?')
    .get(toColumnId) as { id: string; board_id: string } | undefined

  if (!targetColumn) {
    throw new Error('Target column not found')
  }

  if (targetColumn.board_id !== card.board_id) {
    throw new Error('Cards cannot move across boards')
  }

  const currentColumnId = card.column_id

  const move = database.transaction(() => {
    const sourceIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC, rowid ASC')
        .all(currentColumnId) as Array<{ id: string }>
    )
      .map((row) => row.id)
      .filter((id) => id !== cardId)

    const targetIds = (
      database
        .prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position ASC, rowid ASC')
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
  return getWorkspace()
}
