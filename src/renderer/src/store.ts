import { create } from 'zustand'
import type { BoardRecord, BoardDraft, CardDraft, CardRecord } from '@shared/types'

interface BoardState {
  board: BoardRecord | null
  alwaysOnTop: boolean
  isMaximized: boolean
  platform: string
  loading: boolean
  saving: boolean
  error: string | null
  editingCard: CardRecord | null
  initialize: () => Promise<void>
  updateBoard: (draft: BoardDraft) => Promise<void>
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

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
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
      const [board, windowState] = await Promise.all([
        window.stickban.getBoard(),
        window.stickban.getWindowState()
      ])

      set({
        board,
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
  createCard: async (columnId, draft) => {
    set({ saving: true, error: null })
    try {
      const board = await window.stickban.createCard(columnId, draft)
      set({ board, saving: false })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to create card'
      })
    }
  },
  updateBoard: async (draft) => {
    set({ saving: true, error: null })
    try {
      const board = await window.stickban.updateBoard(draft)
      set({ board, saving: false })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to update board'
      })
    }
  },
  updateCard: async (cardId, draft) => {
    set({ saving: true, error: null })
    try {
      const board = await window.stickban.updateCard(cardId, draft)
      set({ board, saving: false, editingCard: null })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to update card'
      })
    }
  },
  deleteCard: async (cardId) => {
    set({ saving: true, error: null })
    try {
      const board = await window.stickban.deleteCard(cardId)
      set({ board, saving: false })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to delete card'
      })
    }
  },
  moveCard: async (cardId, toColumnId, toIndex) => {
    set({ saving: true, error: null })
    try {
      const board = await window.stickban.moveCard({ cardId, toColumnId, toIndex })
      set({ board, saving: false })
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to move card'
      })
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
