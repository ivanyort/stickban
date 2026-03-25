import { create } from 'zustand'
import type {
  BoardDraft,
  BoardRecord,
  BoardSummary,
  CardDraft,
  CardRecord,
  ColumnDraft,
  ColumnMovePayload,
  SyncFolderConfig,
  SyncNotice,
  SyncStatus,
  UpdateStatus,
  WorkspaceRecord
} from '@shared/types'

interface BoardState {
  boards: BoardSummary[]
  activeBoardId: string | null
  activeBoard: BoardRecord | null
  alwaysOnTop: boolean
  isMaximized: boolean
  platform: string
  appVersion: string
  loading: boolean
  saving: boolean
  error: string | null
  syncStatus: SyncStatus | null
  syncFolderInfo: SyncFolderConfig | null
  syncNotices: SyncNotice[]
  updateStatus: UpdateStatus | null
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
  chooseSyncFolder: () => Promise<void>
  clearSyncFolder: () => Promise<void>
  syncNow: () => Promise<void>
  adoptRemoteWorkspace: () => Promise<void>
  refreshSyncStatus: () => Promise<void>
  refreshUpdateStatus: () => Promise<void>
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstallUpdate: () => Promise<void>
  refreshWorkspace: () => Promise<void>
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
  appVersion: '0.0.0',
  loading: true,
  saving: false,
  error: null,
  syncStatus: null,
  syncFolderInfo: null,
  syncNotices: [],
  updateStatus: null,
  editingCard: null,
  initialize: async () => {
    set({ loading: true, error: null })

    try {
      const [workspace, windowState, syncStatus, syncFolderInfo, syncNotices, updateStatus] = await Promise.all([
        window.stickban.getWorkspace(),
        window.stickban.getWindowState(),
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices(),
        window.stickban.getUpdateStatus()
      ])

      set({
        ...applyWorkspace(workspace),
        alwaysOnTop: windowState.alwaysOnTop,
        isMaximized: windowState.isMaximized,
        platform: windowState.platform,
        appVersion: windowState.appVersion,
        syncStatus,
        syncFolderInfo,
        syncNotices,
        updateStatus,
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
      platform: windowState.platform,
      appVersion: windowState.appVersion
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
      platform: windowState.platform,
      appVersion: windowState.appVersion
    })
  },
  closeWindow: async () => {
    await window.stickban.closeWindow()
  },
  refreshSyncStatus: async () => {
    try {
      const [syncStatus, syncFolderInfo, syncNotices] = await Promise.all([
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices()
      ])
      set({ syncStatus, syncFolderInfo, syncNotices })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh sync status' })
    }
  },
  refreshUpdateStatus: async () => {
    try {
      const updateStatus = await window.stickban.getUpdateStatus()
      set({ updateStatus })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh update status' })
    }
  },
  checkForUpdates: async () => {
    try {
      set({ error: null })
      await window.stickban.checkForUpdates()
      const updateStatus = await window.stickban.getUpdateStatus()
      set({ updateStatus })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to check for updates' })
    }
  },
  downloadUpdate: async () => {
    try {
      set({ error: null })
      await window.stickban.downloadUpdate()
      const updateStatus = await window.stickban.getUpdateStatus()
      set({ updateStatus })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to download update' })
    }
  },
  quitAndInstallUpdate: async () => {
    try {
      await window.stickban.quitAndInstallUpdate()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to install update' })
    }
  },
  refreshWorkspace: async () => {
    try {
      const workspace = await window.stickban.getWorkspace()
      set({ ...applyWorkspace(workspace) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh workspace' })
    }
  },
  chooseSyncFolder: async () => {
    try {
      set({ saving: true, error: null })
      await window.stickban.chooseSyncFolder()
      const [workspace, syncStatus, syncFolderInfo, syncNotices] = await Promise.all([
        window.stickban.getWorkspace(),
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices()
      ])
      set({ ...applyWorkspace(workspace), saving: false, syncStatus, syncFolderInfo, syncNotices })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to choose a sync folder' })
    }
  },
  clearSyncFolder: async () => {
    try {
      set({ saving: true, error: null })
      await window.stickban.clearSyncFolder()
      const [syncStatus, syncFolderInfo, syncNotices] = await Promise.all([
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices()
      ])
      set({ saving: false, syncStatus, syncFolderInfo, syncNotices })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to clear sync folder' })
    }
  },
  syncNow: async () => {
    try {
      set({ saving: true, error: null })
      await window.stickban.syncNow()
      const [workspace, syncStatus, syncFolderInfo, syncNotices] = await Promise.all([
        window.stickban.getWorkspace(),
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices()
      ])
      set({ ...applyWorkspace(workspace), saving: false, syncStatus, syncFolderInfo, syncNotices })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to run sync' })
    }
  },
  adoptRemoteWorkspace: async () => {
    try {
      set({ saving: true, error: null })
      await window.stickban.adoptRemoteWorkspace()
      const [workspace, syncStatus, syncFolderInfo, syncNotices] = await Promise.all([
        window.stickban.getWorkspace(),
        window.stickban.getSyncStatus(),
        window.stickban.getSyncFolderInfo(),
        window.stickban.getSyncNotices()
      ])
      set({ ...applyWorkspace(workspace), saving: false, syncStatus, syncFolderInfo, syncNotices })
    } catch (error) {
      set({ saving: false, error: error instanceof Error ? error.message : 'Failed to adopt remote workspace' })
    }
  }
}))
