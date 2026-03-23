export interface CardRecord {
  id: string
  columnId: string
  title: string
  description: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface ColumnRecord {
  id: string
  boardId: string
  title: string
  position: number
  cards: CardRecord[]
}

export interface BoardRecord {
  id: string
  title: string
  position: number
  columns: ColumnRecord[]
}

export interface BoardSummary {
  id: string
  title: string
  position: number
  columnCount: number
  cardCount: number
}

export interface WorkspaceRecord {
  boards: BoardSummary[]
  activeBoardId: string
  activeBoard: BoardRecord
}

export interface WindowState {
  alwaysOnTop: boolean
  isMaximized: boolean
  platform: NodeJS.Platform
}

export interface CardDraft {
  title: string
  description: string
}

export interface BoardDraft {
  title: string
}

export interface ColumnDraft {
  title: string
}

export interface CardMovePayload {
  cardId: string
  toColumnId: string
  toIndex: number
}

export interface ColumnMovePayload {
  columnId: string
  toBoardId: string
  toIndex: number
}

export interface StickbanApi {
  getWorkspace: () => Promise<WorkspaceRecord>
  createBoard: (draft: BoardDraft) => Promise<WorkspaceRecord>
  updateBoard: (boardId: string, draft: BoardDraft) => Promise<WorkspaceRecord>
  deleteBoard: (boardId: string) => Promise<WorkspaceRecord>
  setActiveBoard: (boardId: string) => Promise<WorkspaceRecord>
  createColumn: (boardId: string, draft: ColumnDraft) => Promise<WorkspaceRecord>
  updateColumn: (columnId: string, draft: ColumnDraft) => Promise<WorkspaceRecord>
  deleteColumn: (columnId: string) => Promise<WorkspaceRecord>
  moveColumn: (payload: ColumnMovePayload) => Promise<WorkspaceRecord>
  createCard: (columnId: string, draft: CardDraft) => Promise<WorkspaceRecord>
  updateCard: (cardId: string, draft: CardDraft) => Promise<WorkspaceRecord>
  deleteCard: (cardId: string) => Promise<WorkspaceRecord>
  moveCard: (payload: CardMovePayload) => Promise<WorkspaceRecord>
  getWindowState: () => Promise<WindowState>
  setAlwaysOnTop: (value: boolean) => Promise<WindowState>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<WindowState>
  closeWindow: () => Promise<void>
}
