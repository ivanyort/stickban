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
  columns: ColumnRecord[]
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

export interface CardMovePayload {
  cardId: string
  toColumnId: string
  toIndex: number
}

export interface StickbanApi {
  getBoard: () => Promise<BoardRecord>
  updateBoard: (draft: BoardDraft) => Promise<BoardRecord>
  createCard: (columnId: string, draft: CardDraft) => Promise<BoardRecord>
  updateCard: (cardId: string, draft: CardDraft) => Promise<BoardRecord>
  deleteCard: (cardId: string) => Promise<BoardRecord>
  moveCard: (payload: CardMovePayload) => Promise<BoardRecord>
  getWindowState: () => Promise<WindowState>
  setAlwaysOnTop: (value: boolean) => Promise<WindowState>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<WindowState>
  closeWindow: () => Promise<void>
}
