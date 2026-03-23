import { contextBridge, ipcRenderer } from 'electron'
import type { CardDraft, CardMovePayload, StickbanApi } from '../shared/types'

const api: StickbanApi = {
  getBoard: () => ipcRenderer.invoke('board:get'),
  createCard: (columnId: string, draft: CardDraft) => ipcRenderer.invoke('card:create', columnId, draft),
  updateCard: (cardId: string, draft: CardDraft) => ipcRenderer.invoke('card:update', cardId, draft),
  deleteCard: (cardId: string) => ipcRenderer.invoke('card:delete', cardId),
  moveCard: (payload: CardMovePayload) => ipcRenderer.invoke('card:move', payload),
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', value),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  closeWindow: () => ipcRenderer.invoke('window:close')
}

contextBridge.exposeInMainWorld('stickban', api)
