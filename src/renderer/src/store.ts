import { create } from 'zustand'
import type { BoardRecord, CardDraft, CardRecord } from '@shared/types'

interface BoardState {
  board: BoardRecord | null
  alwaysOnTop: boolean
  loading: boolean
  saving: boolean
  error: string | null
  editingCard: CardRecord | null
  initialize: () => Promise<void>
  createCard: (columnId: string, draft: CardDraft) => Promise<void>
  updateCard: (cardId: string, draft: CardDraft) => Promise<void>
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => Promise<void>
  setEditingCard: (card: CardRecord | null) => void
  toggleAlwaysOnTop: () => Promise<void>
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  alwaysOnTop: false,
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
    set({ alwaysOnTop: windowState.alwaysOnTop })
  }
}))
