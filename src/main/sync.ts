import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BrowserWindow, OpenDialogOptions } from 'electron'
import { dialog } from 'electron'
import type { SyncCheckpoint, SyncFolderConfig, SyncNotice, SyncOperation, SyncStatus } from '../shared/types'
import {
  applyRemoteOperation,
  clearWorkspaceForRemoteBootstrap,
  exportCheckpoint,
  getAppliedOperationsCount,
  getDeviceId,
  getLocalClock,
  getWorkspaceBootstrapState,
  importCheckpoint,
  isOperationApplied,
  registerOperationEmitter
} from './database'

interface SyncConfigFile {
  folderPath: string | null
  linkedSyncRootPath?: string | null
}

const SYNC_FOLDER_NAME = 'stickban-sync'
const CHECKPOINT_INTERVAL = 20

function now(): string {
  return new Date().toISOString()
}

function inferProviderHint(folderPath: string): string {
  const normalized = folderPath.toLowerCase()
  if (normalized.includes('onedrive')) {
    return 'OneDrive'
  }
  if (normalized.includes('dropbox')) {
    return 'Dropbox'
  }
  if (normalized.includes('google drive') || normalized.includes('gdrive')) {
    return 'Google Drive Desktop'
  }
  if (normalized.includes('icloud')) {
    return 'iCloud Drive'
  }
  return 'Synced folder'
}

function safeParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function compareOperations(left: SyncOperation, right: SyncOperation): number {
  if (left.clock !== right.clock) {
    return left.clock - right.clock
  }
  if (left.createdAtUtc !== right.createdAtUtc) {
    return left.createdAtUtc.localeCompare(right.createdAtUtc)
  }
  if (left.deviceId !== right.deviceId) {
    return left.deviceId.localeCompare(right.deviceId)
  }
  return left.operationId.localeCompare(right.operationId)
}

function compareCheckpoints(left: SyncCheckpoint, right: SyncCheckpoint): number {
  if (left.maxClock !== right.maxClock) {
    return left.maxClock - right.maxClock
  }
  if (left.createdAtUtc !== right.createdAtUtc) {
    return left.createdAtUtc.localeCompare(right.createdAtUtc)
  }
  return left.checkpointId.localeCompare(right.checkpointId)
}

interface RemoteStateSummary {
  operationCount: number
  checkpointCount: number
}

interface PendingRemoteBootstrap {
  folderPath: string
  syncRootPath: string
  providerHint: string
}

export class SyncManager {
  private readonly configPath: string
  private readonly outboxPath: string
  private readonly syncStatePath: string
  private status: SyncStatus
  private syncTimer: NodeJS.Timeout | null = null
  private watchStop: (() => void) | null = null
  private intervalTimer: NodeJS.Timeout | null = null
  private inFlightSync: Promise<SyncStatus> | null = null
  private localOpsSinceCheckpoint = 0
  private pendingRemoteBootstrap: PendingRemoteBootstrap | null = null

  constructor(private readonly userDataPath: string) {
    const localSyncDir = join(userDataPath, 'sync')
    this.configPath = join(localSyncDir, 'config.json')
    this.outboxPath = join(localSyncDir, 'outbox')
    this.syncStatePath = localSyncDir
    mkdirSync(this.outboxPath, { recursive: true })
    this.status = {
      configured: false,
      syncing: false,
      folderPath: null,
      syncRootPath: null,
      providerHint: null,
      deviceId: getDeviceId(),
      pendingLocalOperations: 0,
      lastSyncedAtUtc: null,
      lastImportedAtUtc: null,
      lastExportedAtUtc: null,
      lastCheckpointAtUtc: null,
      lastError: null,
      bootstrapConflict: null,
      notices: []
    }
  }

  initialize(): void {
    registerOperationEmitter((operation) => {
      try {
        mkdirSync(this.outboxPath, { recursive: true })
        writeFileSync(join(this.outboxPath, `${operation.operationId}.json`), JSON.stringify(operation, null, 2))
        this.localOpsSinceCheckpoint += 1
        this.refreshPendingLocalOperations()
        this.scheduleSync(1200)
      } catch (error) {
        this.setError(error instanceof Error ? error.message : 'Failed to write a local sync operation.')
      }
    })

    const config = this.readConfig()
    if (config.folderPath) {
      this.applyFolderPath(config.folderPath)
      this.scheduleSync(1000)
    } else {
      this.refreshPendingLocalOperations()
    }
  }

  async chooseSyncFolder(window: BrowserWindow | null): Promise<SyncStatus> {
    const previousConfig = this.readConfig()
    const options: OpenDialogOptions = {
      title: 'Choose a synced folder for Stickban',
      properties: ['openDirectory', 'createDirectory']
    }
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return this.getStatus()
    }

    this.applyFolderPath(result.filePaths[0])
    const syncStatus = await this.syncNow()
    if (!syncStatus.lastError || syncStatus.bootstrapConflict) {
      return syncStatus
    }

    if (previousConfig.folderPath) {
      this.applyFolderPath(previousConfig.folderPath)
      this.status = {
        ...this.status,
        lastError: syncStatus.lastError,
        notices: syncStatus.notices
      }
    } else {
      this.stopWatching()
      this.status = {
        ...syncStatus,
        configured: false,
        folderPath: null,
        syncRootPath: null,
        providerHint: null
      }
    }

    return this.getStatus()
  }

  clearSyncFolder(): SyncStatus {
    this.stopWatching()
    this.pendingRemoteBootstrap = null
    const currentConfig = this.readConfig()
    this.writeConfig({
      folderPath: null,
      linkedSyncRootPath: currentConfig.linkedSyncRootPath ?? this.status.syncRootPath
    })
    this.status = {
      ...this.status,
      configured: false,
      folderPath: null,
      syncRootPath: null,
      providerHint: null,
      lastError: null,
      bootstrapConflict: null
    }
    return this.getStatus()
  }

  getStatus(): SyncStatus {
    this.refreshPendingLocalOperations()
    return { ...this.status, notices: [...this.status.notices] }
  }

  getNotices(): SyncNotice[] {
    return [...this.status.notices]
  }

  getFolderInfo(): SyncFolderConfig | null {
    if (!this.status.configured || !this.status.folderPath || !this.status.syncRootPath) {
      return null
    }

    return {
      folderPath: this.status.folderPath,
      syncRootPath: this.status.syncRootPath,
      operationsPath: join(this.status.syncRootPath, 'operations'),
      checkpointsPath: join(this.status.syncRootPath, 'checkpoints'),
      providerHint: this.status.providerHint ?? 'Synced folder'
    }
  }

  scheduleSync(delayMs = 1500): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.syncTimer = setTimeout(() => {
      this.syncTimer = null
      void this.syncNow()
    }, delayMs)
  }

  async syncNow(): Promise<SyncStatus> {
    if (!this.status.configured) {
      this.refreshPendingLocalOperations()
      return this.getStatus()
    }

    if (this.inFlightSync) {
      return this.inFlightSync
    }

    this.inFlightSync = this.performSync()
    try {
      return await this.inFlightSync
    } finally {
      this.inFlightSync = null
    }
  }

  async adoptRemoteWorkspace(): Promise<SyncStatus> {
    if (!this.pendingRemoteBootstrap) {
      return this.getStatus()
    }

    const pending = this.pendingRemoteBootstrap
    clearWorkspaceForRemoteBootstrap()
    this.clearOutbox()
    this.applyFolderPath(pending.folderPath)
    this.writeConfig({
      folderPath: pending.folderPath,
      linkedSyncRootPath: pending.syncRootPath
    })
    this.pendingRemoteBootstrap = null
    this.status = {
      ...this.status,
      lastError: null,
      bootstrapConflict: null
    }
    return this.syncNow()
  }

  private async performSync(): Promise<SyncStatus> {
    this.status = { ...this.status, syncing: true, lastError: null }

    try {
      const info = this.getFolderInfo()
      if (!info) {
        this.status = { ...this.status, syncing: false }
        return this.getStatus()
      }

      this.ensureRemoteDirs(info)
      const persistedConfig = this.readConfig()
      const remoteState = this.scanRemoteState(info)
      const localState = getWorkspaceBootstrapState()
      const isCurrentRootLinked = persistedConfig.linkedSyncRootPath === info.syncRootPath

      if (remoteState.operationCount === 0 && remoteState.checkpointCount === 0) {
        if (!isCurrentRootLinked) {
          this.writeCheckpoint(info)
          this.pushNotice({
            id: randomUUID(),
            level: 'info',
            message: 'Exported an initial cloud checkpoint from the current local workspace.',
            createdAtUtc: now()
          })
        }
      } else if (!isCurrentRootLinked) {
        if (localState.isPristineSeedWorkspace) {
          if (remoteState.checkpointCount === 0 && remoteState.operationCount > 0) {
            clearWorkspaceForRemoteBootstrap()
            this.pushNotice({
              id: randomUUID(),
              level: 'info',
              message: 'Cleared the local seed workspace before importing remote operation history.',
              createdAtUtc: now()
            })
          }
        } else {
          this.pendingRemoteBootstrap = {
            folderPath: info.folderPath,
            syncRootPath: info.syncRootPath,
            providerHint: info.providerHint
          }
          this.stopWatching()
          this.status = {
            ...this.status,
            syncing: false,
            configured: false,
            folderPath: null,
            syncRootPath: null,
            providerHint: null,
            lastError:
              'This sync folder already contains another Stickban workspace, and this device also has local data that has never been linked.',
            bootstrapConflict: {
              folderPath: info.folderPath,
              syncRootPath: info.syncRootPath,
              providerHint: info.providerHint,
              reason:
                'Use the remote workspace only if you want to discard the current local data on this machine.'
            }
          }
          return this.getStatus()
        }
      }

      const importedCheckpoint = this.importNewestCheckpoint(info)
      const exportedCount = this.flushOutbox(info)
      const importedCount = this.importRemoteOperations(info)
      const shouldCheckpoint = this.localOpsSinceCheckpoint >= CHECKPOINT_INTERVAL || importedCheckpoint || importedCount > 0
      let syncActivityHappened = importedCheckpoint || exportedCount > 0 || importedCount > 0
      if (shouldCheckpoint) {
        this.writeCheckpoint(info)
        syncActivityHappened = true
      }

      if (exportedCount > 0) {
        this.status = { ...this.status, lastExportedAtUtc: now() }
      }
      if (importedCount > 0 || importedCheckpoint) {
        this.status = { ...this.status, lastImportedAtUtc: now() }
      }

      this.writeConfig({
        folderPath: this.status.folderPath,
        linkedSyncRootPath: info.syncRootPath
      })
      this.pendingRemoteBootstrap = null
      this.status = {
        ...this.status,
        syncing: false,
        lastSyncedAtUtc: syncActivityHappened ? now() : this.status.lastSyncedAtUtc,
        lastError: null
      }
      this.status = { ...this.status, bootstrapConflict: null }
      this.refreshPendingLocalOperations()
      return this.getStatus()
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Sync failed.')
      return this.getStatus()
    }
  }

  private setError(message: string): void {
    this.status = { ...this.status, syncing: false, lastError: message }
    this.pushNotice({
      id: randomUUID(),
      level: 'error',
      message,
      createdAtUtc: now()
    })
  }

  private pushNotice(notice: SyncNotice): void {
    this.status = {
      ...this.status,
      notices: [notice, ...this.status.notices].slice(0, 12)
    }
  }

  private refreshPendingLocalOperations(): void {
    if (!existsSync(this.outboxPath)) {
      this.status = { ...this.status, pendingLocalOperations: 0 }
      return
    }

    const count = readdirSync(this.outboxPath).filter((entry) => entry.endsWith('.json')).length
    this.status = { ...this.status, pendingLocalOperations: count }
  }

  private clearOutbox(): void {
    if (!existsSync(this.outboxPath)) {
      return
    }

    readdirSync(this.outboxPath)
      .filter((entry) => entry.endsWith('.json'))
      .forEach((entry) => {
        rmSync(join(this.outboxPath, entry), { force: true })
      })

    this.refreshPendingLocalOperations()
  }

  private readConfig(): SyncConfigFile {
    mkdirSync(this.syncStatePath, { recursive: true })
    if (!existsSync(this.configPath)) {
      return { folderPath: null }
    }

    return safeParseJson<SyncConfigFile>(readFileSync(this.configPath, 'utf8')) ?? { folderPath: null }
  }

  private writeConfig(config: SyncConfigFile): void {
    mkdirSync(this.syncStatePath, { recursive: true })
    writeFileSync(this.configPath, JSON.stringify(config, null, 2))
  }

  private applyFolderPath(folderPath: string): void {
    const syncRootPath = join(folderPath, SYNC_FOLDER_NAME)
    mkdirSync(join(syncRootPath, 'operations'), { recursive: true })
    mkdirSync(join(syncRootPath, 'checkpoints'), { recursive: true })

    this.status = {
      ...this.status,
      configured: true,
      folderPath,
      syncRootPath,
      providerHint: inferProviderHint(folderPath),
      lastError: null
    }

    this.startWatching()
  }

  private ensureRemoteDirs(info: SyncFolderConfig): void {
    mkdirSync(info.operationsPath, { recursive: true })
    mkdirSync(info.checkpointsPath, { recursive: true })
  }

  private scanRemoteState(info: SyncFolderConfig): RemoteStateSummary {
    return {
      operationCount: readdirSync(info.operationsPath).filter((entry) => entry.endsWith('.json')).length,
      checkpointCount: readdirSync(info.checkpointsPath).filter((entry) => entry.endsWith('.json')).length
    }
  }

  private startWatching(): void {
    this.stopWatching()
    const info = this.getFolderInfo()
    if (!info) {
      return
    }

    const watcher = watch(info.syncRootPath, { recursive: true }, () => {
      this.scheduleSync(1200)
    })

    this.watchStop = () => watcher.close()
    this.intervalTimer = setInterval(() => {
      void this.syncNow()
    }, 10_000)
  }

  private stopWatching(): void {
    if (this.watchStop) {
      this.watchStop()
      this.watchStop = null
    }

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = null
    }
  }

  private flushOutbox(info: SyncFolderConfig): number {
    const files = existsSync(this.outboxPath)
      ? readdirSync(this.outboxPath).filter((entry) => entry.endsWith('.json')).sort()
      : []

    let exportedCount = 0
    files.forEach((file) => {
      const sourcePath = join(this.outboxPath, file)
      const targetPath = join(info.operationsPath, file)
      if (!existsSync(targetPath)) {
        cpSync(sourcePath, targetPath)
      }
      rmSync(sourcePath, { force: true })
      exportedCount += 1
    })
    this.refreshPendingLocalOperations()
    return exportedCount
  }

  private importRemoteOperations(info: SyncFolderConfig): number {
    const operations = readdirSync(info.operationsPath)
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => {
        const parsed = safeParseJson<SyncOperation>(readFileSync(join(info.operationsPath, entry), 'utf8'))
        return parsed
      })
      .filter((entry): entry is SyncOperation => Boolean(entry))
      .sort(compareOperations)

    let importedCount = 0
    operations.forEach((operation) => {
      if (isOperationApplied(operation.operationId)) {
        return
      }

      const notices = applyRemoteOperation(operation)
      notices.forEach((notice) => this.pushNotice(notice))
      importedCount += 1
    })

    return importedCount
  }

  private importNewestCheckpoint(info: SyncFolderConfig): boolean {
    const checkpoints = readdirSync(info.checkpointsPath)
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => safeParseJson<SyncCheckpoint>(readFileSync(join(info.checkpointsPath, entry), 'utf8')))
      .filter((entry): entry is SyncCheckpoint => Boolean(entry))
      .sort(compareCheckpoints)

    const latest = checkpoints.at(-1)
    if (!latest) {
      return false
    }

    const localClock = getLocalClock()
    const localApplied = getAppliedOperationsCount()
    if (latest.maxClock < localClock) {
      return false
    }
    if (latest.maxClock === localClock && latest.workspace.appliedOperationIds.length <= localApplied) {
      return false
    }

    importCheckpoint(latest)
    this.pushNotice({
      id: randomUUID(),
      level: 'info',
      message: `Imported checkpoint ${latest.checkpointId.slice(0, 8)} from ${latest.deviceId.slice(0, 8)}.`,
      createdAtUtc: now()
    })
    return true
  }

  private writeCheckpoint(info: SyncFolderConfig): void {
    const checkpoint = exportCheckpoint()
    const targetPath = join(info.checkpointsPath, `${checkpoint.checkpointId}.json`)
    writeFileSync(targetPath, JSON.stringify(checkpoint, null, 2))
    this.localOpsSinceCheckpoint = 0
    this.status = { ...this.status, lastCheckpointAtUtc: checkpoint.createdAtUtc }

    const checkpointFiles = readdirSync(info.checkpointsPath)
      .filter((entry) => entry.endsWith('.json'))
      .sort()
    if (checkpointFiles.length > 6) {
      checkpointFiles.slice(0, checkpointFiles.length - 6).forEach((file) => {
        rmSync(join(info.checkpointsPath, file), { force: true })
      })
    }
  }
}
