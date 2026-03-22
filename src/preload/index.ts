import { contextBridge, ipcRenderer } from 'electron'
import type { CardDraft, CardMovePayload, StickbanApi } from '../shared/types'

const api: StickbanApi = {
  getBoard: () => ipcRenderer.invoke('board:get'),
  createCard: (columnId: string, draft: CardDraft) => ipcRenderer.invoke('card:create', columnId, draft),
  updateCard: (cardId: string, draft: CardDraft) => ipcRenderer.invoke('card:update', cardId, draft),
  moveCard: (payload: CardMovePayload) => ipcRenderer.invoke('card:move', payload),
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', value)
}

contextBridge.exposeInMainWorld('stickban', api)
