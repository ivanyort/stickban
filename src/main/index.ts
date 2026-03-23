import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'node:path'
import { createCard, deleteCard, getBoard, initializeDatabase, moveCard, updateCard } from './database'
import type { CardDraft, CardMovePayload } from '../shared/types'

let mainWindow: BrowserWindow | null = null

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
  ipcMain.handle('board:get', () => getBoard())
  ipcMain.handle('card:create', (_event, columnId: string, draft: CardDraft) => createCard(columnId, draft))
  ipcMain.handle('card:update', (_event, cardId: string, draft: CardDraft) => updateCard(cardId, draft))
  ipcMain.handle('card:delete', (_event, cardId: string) => deleteCard(cardId))
  ipcMain.handle('card:move', (_event, payload: CardMovePayload) =>
    moveCard(payload.cardId, payload.toColumnId, payload.toIndex)
  )
  ipcMain.handle('window:getState', () => ({
    alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
    isMaximized: mainWindow?.isMaximized() ?? false,
    platform: process.platform
  }))
  ipcMain.handle('window:setAlwaysOnTop', (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value)
    return {
      alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
      isMaximized: mainWindow?.isMaximized() ?? false,
      platform: process.platform
    }
  })
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) {
      return { alwaysOnTop: false, isMaximized: false, platform: process.platform }
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }

    return {
      alwaysOnTop: mainWindow.isAlwaysOnTop(),
      isMaximized: mainWindow.isMaximized(),
      platform: process.platform
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  initializeDatabase(app.getPath('userData'))
  registerIpc()
  mainWindow = createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
