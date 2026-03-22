import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { createCard, getBoard, initializeDatabase, moveCard, updateCard } from './database'
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
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.once('ready-to-show', () => {
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
  ipcMain.handle('card:move', (_event, payload: CardMovePayload) =>
    moveCard(payload.cardId, payload.toColumnId, payload.toIndex)
  )
  ipcMain.handle('window:getState', () => ({
    alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false
  }))
  ipcMain.handle('window:setAlwaysOnTop', (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value)
    return {
      alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false
    }
  })
}

app.whenReady().then(() => {
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
