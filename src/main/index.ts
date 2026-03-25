import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'node:path'
import {
  createBoard,
  createCard,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  getWorkspace,
  initializeDatabase,
  moveColumn,
  moveCard,
  setActiveBoard,
  updateBoard,
  updateCard,
  updateColumn
} from './database'
import type { BoardDraft, CardDraft, CardMovePayload, ColumnDraft, ColumnMovePayload } from '../shared/types'
import { SyncManager } from './sync'
import { UpdateManager } from './update'

let mainWindow: BrowserWindow | null = null
let syncManager: SyncManager | null = null
let updateManager: UpdateManager | null = null

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    title: 'Stickban',
    backgroundColor: '#eef2ff',
    ...(process.platform === 'win32'
      ? {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: {
            color: '#fdfbf8',
            symbolColor: '#7f6758',
            height: 56
          }
        }
      : {
          frame: false
        }),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.platform === 'win32' || process.platform === 'linux') {
    window.removeMenu()
  }

  window.once('ready-to-show', () => {
    window.setMenuBarVisibility(false)
    window.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function registerIpc(): void {
  ipcMain.handle('workspace:get', () => getWorkspace())
  ipcMain.handle('board:create', (_event, draft: BoardDraft) => createBoard(draft))
  ipcMain.handle('board:update', (_event, boardId: string, draft: BoardDraft) => updateBoard(boardId, draft))
  ipcMain.handle('board:delete', (_event, boardId: string) => deleteBoard(boardId))
  ipcMain.handle('board:setActive', (_event, boardId: string) => setActiveBoard(boardId))
  ipcMain.handle('column:create', (_event, boardId: string, draft: ColumnDraft) => createColumn(boardId, draft))
  ipcMain.handle('column:update', (_event, columnId: string, draft: ColumnDraft) =>
    updateColumn(columnId, draft)
  )
  ipcMain.handle('column:delete', (_event, columnId: string) => deleteColumn(columnId))
  ipcMain.handle('column:move', (_event, payload: ColumnMovePayload) =>
    moveColumn(payload.columnId, payload.toBoardId, payload.toIndex)
  )
  ipcMain.handle('card:create', (_event, columnId: string, draft: CardDraft) => createCard(columnId, draft))
  ipcMain.handle('card:update', (_event, cardId: string, draft: CardDraft) => updateCard(cardId, draft))
  ipcMain.handle('card:delete', (_event, cardId: string) => deleteCard(cardId))
  ipcMain.handle('card:move', (_event, payload: CardMovePayload) =>
    moveCard(payload.cardId, payload.toColumnId, payload.toIndex)
  )
  ipcMain.handle('window:getState', () => ({
    alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
    isMaximized: mainWindow?.isMaximized() ?? false,
    platform: process.platform,
    appVersion: app.getVersion()
  }))
  ipcMain.handle('window:setAlwaysOnTop', (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value)
    return {
      alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
      isMaximized: mainWindow?.isMaximized() ?? false,
      platform: process.platform,
      appVersion: app.getVersion()
    }
  })
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) {
      return { alwaysOnTop: false, isMaximized: false, platform: process.platform, appVersion: app.getVersion() }
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }

    return {
      alwaysOnTop: mainWindow.isAlwaysOnTop(),
      isMaximized: mainWindow.isMaximized(),
      platform: process.platform,
      appVersion: app.getVersion()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('sync:getStatus', () => syncManager?.getStatus())
  ipcMain.handle('sync:chooseFolder', () => syncManager?.chooseSyncFolder(mainWindow))
  ipcMain.handle('sync:clearFolder', () => syncManager?.clearSyncFolder())
  ipcMain.handle('sync:runNow', () => syncManager?.syncNow())
  ipcMain.handle('sync:adoptRemoteWorkspace', () => syncManager?.adoptRemoteWorkspace())
  ipcMain.handle('sync:getFolderInfo', () => syncManager?.getFolderInfo())
  ipcMain.handle('sync:getNotices', () => syncManager?.getNotices())
  ipcMain.handle('update:getStatus', () => updateManager?.getStatus())
  ipcMain.handle('update:check', () => updateManager?.checkForUpdates())
  ipcMain.handle('update:download', () => updateManager?.downloadUpdate())
  ipcMain.handle('update:quitAndInstall', () => {
    updateManager?.quitAndInstallUpdate()
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  initializeDatabase(app.getPath('userData'))
  syncManager = new SyncManager(app.getPath('userData'))
  syncManager.initialize()
  updateManager = new UpdateManager()
  updateManager.initialize()
  registerIpc()
  mainWindow = createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  syncManager?.flushPendingLocalOperationsToRemote()
  syncManager?.dispose()
  updateManager?.dispose()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
