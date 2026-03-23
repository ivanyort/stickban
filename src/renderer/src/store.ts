import { create } from 'zustand'
import type {
  BoardDraft,
  BoardRecord,
  BoardSummary,
  CardDraft,
  CardRecord,
  ColumnDraft,
  ColumnMovePayload,
  WorkspaceRecord
} from '@shared/types'

interface BoardState {
  boards: BoardSummary[]
  activeBoardId: string | null
  activeBoard: BoardRecord | null
  alwaysOnTop: boolean
  isMaximized: boolean
  platform: string
  loading: boolean
  saving: boolean
  error: string | null
  editingCard: CardRecord | null
  initialize: () => Promise<void>
  createBoard: (draft: BoardDraft) => Promise<void>
  updateBoard: (boardId: string, draft: BoardDraft) => Promise<void>
  deleteBoard: (boardId: string) => Promise<void>
  setActiveBoard: (boardId: string) => Promise<void>
  createColumn: (boardId: string, draft: ColumnDraft) => Promise<void>
  updateColumn: (columnId: string, draft: ColumnDraft) => Promise<void>
  deleteColumn: (columnId: string) => Promise<void>
  moveColumn: (payload: ColumnMovePayload) => Promise<void>
  createCard: (columnId: string, draft: CardDraft) => Promise<void>
  updateCard: (cardId: string, draft: CardDraft) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => Promise<void>
  setEditingCard: (card: CardRecord | null) => void
  toggleAlwaysOnTop: () => Promise<void>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
}

function applyWorkspace(workspace: WorkspaceRecord): Pick<BoardState, 'boards' | 'activeBoardId' | 'activeBoard'> {
  return {
    boards: workspace.boards,
    activeBoardId: workspace.activeBoardId,
    activeBoard: workspace.activeBoard
  }
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  activeBoardId: null,
  activeBoard: null,
  alwaysOnTop: false,
  isMaximized: false,
  platform: 'unknown',
  loading: true,
  saving: false,
  error: null,
  editingCard: null,
  initialize: async () => {
    set({ loading: true, error: null })

    try {
      const [workspace, windowState] = await Promise.all([
        window.stickban.getWorkspace(),
        window.stickban.getWindowState()
      ])

      set({
        ...applyWorkspace(workspace),
        alwaysOnTop: windowState.alwaysOnTop,
        isMaximized: windowState.isMaximized,
        platform: windowState.platform,
        loading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize Stickban',
        loading: false
      })
    }
  },
  createBoard: async (draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.createBoard(draft)
      set({ ...applyWorkspace(workspace), saving: false, editingCard: null })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to create board' })
    }
  },
  updateBoard: async (boardId, draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.updateBoard(boardId, draft)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to update board' })
    }
  },
  deleteBoard: async (boardId) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.deleteBoard(boardId)
      set({ ...applyWorkspace(workspace), saving: false, editingCard: null })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to delete board' })
    }
  },
  setActiveBoard: async (boardId) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.setActiveBoard(boardId)
      set({ ...applyWorkspace(workspace), saving: false, editingCard: null })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to switch board' })
    }
  },
  createColumn: async (boardId, draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.createColumn(boardId, draft)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to create column' })
    }
  },
  updateColumn: async (columnId, draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.updateColumn(columnId, draft)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to update column' })
    }
  },
  deleteColumn: async (columnId) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.deleteColumn(columnId)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to delete column' })
    }
  },
  moveColumn: async (payload) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.moveColumn(payload)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to move column' })
    }
  },
  createCard: async (columnId, draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.createCard(columnId, draft)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to create card' })
    }
  },
  updateCard: async (cardId, draft) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.updateCard(cardId, draft)
      set({ ...applyWorkspace(workspace), saving: false, editingCard: null })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to update card' })
    }
  },
  deleteCard: async (cardId) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.deleteCard(cardId)
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to delete card' })
    }
  },
  moveCard: async (cardId, toColumnId, toIndex) => {
    set({ saving: true, error: null })
    try {
      const workspace = await window.stickban.moveCard({ cardId, toColumnId, toIndex })
      set({ ...applyWorkspace(workspace), saving: false })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to move card' })
    }
  },
  setEditingCard: (card) => set({ editingCard: card }),
  toggleAlwaysOnTop: async () => {
    const current = useBoardStore.getState().alwaysOnTop
    const windowState = await window.stickban.setAlwaysOnTop(!current)
    set({
      alwaysOnTop: windowState.alwaysOnTop,
      isMaximized: windowState.isMaximized,
      platform: windowState.platform
    })
  },
  minimizeWindow: async () => {
    await window.stickban.minimizeWindow()
  },
  toggleMaximizeWindow: async () => {
    const windowState = await window.stickban.toggleMaximizeWindow()
    set({
      alwaysOnTop: windowState.alwaysOnTop,
      isMaximized: windowState.isMaximized,
      platform: windowState.platform
    })
  },
  closeWindow: async () => {
    await window.stickban.closeWindow()
  }
}))
