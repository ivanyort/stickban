import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BrowserWindow, OpenDialogOptions } from 'electron'
import { dialog } from 'electron'
import type { SyncCheckpoint, SyncFolderConfig, SyncNotice, SyncOperation, SyncStatus } from '../shared/types'
import {
  applyRemoteOperation,
  backupDatabase,
  clearWorkspaceForRemoteBootstrap,
  exportCheckpoint,
  getAppliedOperationsCount,
  getDeviceId,
  getLocalClock,
  getWorkspaceBootstrapState,
  importCheckpoint,
  registerOperationEmitter,
  validateCheckpointSnapshot,
  validateOperationShape,
  withScratchDatabase
} from './database'

interface SyncConfigFile {
  folderPath: string | null
  linkedSyncRootPath?: string | null
  hasCompletedSync?: boolean
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

function createFileWarningNotice(message: string): SyncNotice {
  return {
    id: randomUUID(),
    level: 'warning',
    message,
    createdAtUtc: now()
  }
}

interface PendingRemoteBootstrap {
  folderPath: string
  syncRootPath: string
  providerHint: string
}

interface ParsedRemoteOperationFile {
  fileName: string
  operation: SyncOperation
}

interface ParsedRemoteCheckpointFile {
  fileName: string
  checkpoint: SyncCheckpoint
}

interface LoadedRemoteData {
  operations: ParsedRemoteOperationFile[]
  checkpoints: ParsedRemoteCheckpointFile[]
}

interface RemoteBootstrapPlan {
  checkpoint: SyncCheckpoint | null
  operations: SyncOperation[]
  hasWorkspaceData: boolean
}

interface ApplyFolderPathOptions {
  hasCompletedSync?: boolean
}

export class SyncManager {
  private readonly configPath: string
  private readonly outboxPath: string
  private readonly recoveryPath: string
  private readonly syncStatePath: string
  private status: SyncStatus
  private syncTimer: NodeJS.Timeout | null = null
  private watchStop: (() => void) | null = null
  private intervalTimer: NodeJS.Timeout | null = null
  private inFlightSync: Promise<SyncStatus> | null = null
  private localOpsSinceCheckpoint = 0
  private pendingRemoteBootstrap: PendingRemoteBootstrap | null = null
  private readonly sessionNoticeKeys = new Set<string>()

  constructor(private readonly userDataPath: string) {
    const localSyncDir = join(userDataPath, 'sync')
    this.configPath = join(localSyncDir, 'config.json')
    this.outboxPath = join(localSyncDir, 'outbox')
    this.recoveryPath = join(localSyncDir, 'recovery')
    this.syncStatePath = localSyncDir
    mkdirSync(this.outboxPath, { recursive: true })
    this.status = {
      configured: false,
      syncing: false,
      hasCompletedSync: false,
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
      this.applyFolderPath(config.folderPath, { hasCompletedSync: Boolean(config.hasCompletedSync) })
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

    this.applyFolderPath(result.filePaths[0], { hasCompletedSync: false })
    const syncStatus = await this.syncNow()
    if (!syncStatus.lastError || syncStatus.bootstrapConflict) {
      return syncStatus
    }

    if (previousConfig.folderPath) {
      this.applyFolderPath(previousConfig.folderPath, { hasCompletedSync: Boolean(previousConfig.hasCompletedSync) })
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
        hasCompletedSync: false,
        folderPath: null,
        syncRootPath: null,
        providerHint: null
      }
    }

    return this.getStatus()
  }

  clearSyncFolder(): SyncStatus {
    this.stopWatching()
    this.sessionNoticeKeys.clear()
    this.pendingRemoteBootstrap = null
    this.writeConfig({
      folderPath: null,
      linkedSyncRootPath: null,
      hasCompletedSync: false
    })
    this.status = {
      ...this.status,
      configured: false,
      hasCompletedSync: false,
      folderPath: null,
      syncRootPath: null,
      providerHint: null,
      lastSyncedAtUtc: null,
      lastImportedAtUtc: null,
      lastExportedAtUtc: null,
      lastCheckpointAtUtc: null,
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
    const info = this.buildFolderInfoFromPending(pending)
    this.ensureRemoteDirs(info)
    const remoteData = this.loadRemoteData(info)
    const remotePlan = this.buildRemoteBootstrapPlan(remoteData)

    if (!remotePlan || !remotePlan.hasWorkspaceData) {
      this.status = {
        ...this.status,
        lastError:
          'Stickban could not validate the remote workspace before replacing the current local data on this machine.'
      }
      return this.getStatus()
    }

    try {
      await this.createRecoveryBackup('adopt-remote-workspace', info)
      this.clearOutbox()
      this.applyFolderPath(pending.folderPath, { hasCompletedSync: false })
      const importSummary = this.applyBootstrapPlan(remotePlan)
      const syncMoment = now()

      this.writeConfig({
        folderPath: pending.folderPath,
        linkedSyncRootPath: pending.syncRootPath,
        hasCompletedSync: true
      })
      this.pendingRemoteBootstrap = null
      this.status = {
        ...this.status,
        syncing: false,
        hasCompletedSync: true,
        lastSyncedAtUtc: syncMoment,
        lastImportedAtUtc: importSummary.importedCheckpoint || importSummary.importedCount > 0 ? syncMoment : null,
        lastError: null,
        bootstrapConflict: null
      }
      this.refreshPendingLocalOperations()
      return this.getStatus()
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to adopt the remote workspace.')
      return this.getStatus()
    }
  }

  flushPendingLocalOperationsToRemote(): void {
    const info = this.getFolderInfo()
    if (!info) {
      return
    }

    try {
      this.ensureRemoteDirs(info)
      const exportedCount = this.flushOutbox(info)
      if (exportedCount > 0) {
        const syncMoment = now()
        this.status = {
          ...this.status,
          hasCompletedSync: true,
          lastExportedAtUtc: syncMoment,
          lastSyncedAtUtc: syncMoment,
          lastError: null
        }
        this.writeConfig({
          folderPath: this.status.folderPath,
          linkedSyncRootPath: info.syncRootPath,
          hasCompletedSync: true
        })
      }
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to flush local sync operations before shutdown.')
    }
  }

  dispose(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    this.stopWatching()
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
      const remoteData = this.loadRemoteData(info)
      const localState = getWorkspaceBootstrapState()
      const isCurrentRootLinked = persistedConfig.linkedSyncRootPath === info.syncRootPath
      const remoteHasRecognizedHistory = remoteData.operations.length + remoteData.checkpoints.length > 0
      const remoteBootstrapPlan =
        !isCurrentRootLinked && remoteHasRecognizedHistory ? this.buildRemoteBootstrapPlan(remoteData) : null

      if (!isCurrentRootLinked && remoteHasRecognizedHistory && !remoteBootstrapPlan) {
        throw new Error(
          'Stickban found remote sync files, but could not validate a usable remote workspace candidate from them. The local workspace was left untouched.'
        )
      }

      if (!isCurrentRootLinked && remoteBootstrapPlan?.hasWorkspaceData) {
        if (localState.isPristineSeedWorkspace) {
          const importSummary = this.applyBootstrapPlan(remoteBootstrapPlan)
          const syncMoment = now()

          this.writeConfig({
            folderPath: this.status.folderPath,
            linkedSyncRootPath: info.syncRootPath,
            hasCompletedSync: true
          })
          this.pendingRemoteBootstrap = null
          this.status = {
            ...this.status,
            syncing: false,
            hasCompletedSync: true,
            lastSyncedAtUtc: syncMoment,
            lastImportedAtUtc: importSummary.importedCheckpoint || importSummary.importedCount > 0 ? syncMoment : null,
            lastError: null,
            bootstrapConflict: null
          }
          this.refreshPendingLocalOperations()
          return this.getStatus()
        }

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
          hasCompletedSync: false,
          folderPath: null,
          syncRootPath: null,
          providerHint: null,
          lastError:
            'This sync folder already contains another Stickban workspace, and this device also has local data that has never been linked.',
          bootstrapConflict: {
            folderPath: info.folderPath,
            syncRootPath: info.syncRootPath,
            providerHint: info.providerHint,
            reason: 'Use the remote workspace only if you want to discard the current local data on this machine.'
          }
        }
        return this.getStatus()
      }

      if (!remoteHasRecognizedHistory && !isCurrentRootLinked) {
        this.writeCheckpoint(info)
        this.pushNotice({
          id: randomUUID(),
          level: 'info',
          message: 'Exported an initial cloud checkpoint from the current local workspace.',
          createdAtUtc: now()
        })
      }

      const importedCheckpoint = this.importNewestCheckpoint(remoteData.checkpoints.map((entry) => entry.checkpoint))
      const exportedCount = this.flushOutbox(info)
      const importedCount = this.importRemoteOperations(remoteData.operations.map((entry) => entry.operation))
      const shouldCheckpoint = this.localOpsSinceCheckpoint >= CHECKPOINT_INTERVAL || importedCheckpoint || importedCount > 0
      let syncActivityHappened = importedCheckpoint || exportedCount > 0 || importedCount > 0
      if (shouldCheckpoint) {
        this.writeCheckpoint(info)
        syncActivityHappened = true
      }

      const syncMoment = syncActivityHappened ? now() : null
      if (exportedCount > 0 && syncMoment) {
        this.status = { ...this.status, lastExportedAtUtc: syncMoment }
      }
      if ((importedCount > 0 || importedCheckpoint) && syncMoment) {
        this.status = { ...this.status, lastImportedAtUtc: syncMoment }
      }

      this.writeConfig({
        folderPath: this.status.folderPath,
        linkedSyncRootPath: info.syncRootPath,
        hasCompletedSync: this.status.hasCompletedSync || syncActivityHappened
      })
      this.pendingRemoteBootstrap = null
      this.status = {
        ...this.status,
        syncing: false,
        hasCompletedSync: this.status.hasCompletedSync || syncActivityHappened,
        lastSyncedAtUtc: syncMoment ?? this.status.lastSyncedAtUtc,
        lastError: null,
        bootstrapConflict: null
      }
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

  private pushNoticeOnce(key: string, notice: SyncNotice): void {
    if (this.sessionNoticeKeys.has(key)) {
      return
    }

    this.sessionNoticeKeys.add(key)
    this.pushNotice(notice)
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
      return { folderPath: null, hasCompletedSync: false }
    }

    return safeParseJson<SyncConfigFile>(readFileSync(this.configPath, 'utf8')) ?? { folderPath: null, hasCompletedSync: false }
  }

  private writeConfig(config: SyncConfigFile): void {
    mkdirSync(this.syncStatePath, { recursive: true })
    writeFileSync(
      this.configPath,
      JSON.stringify(
        {
          folderPath: config.folderPath,
          linkedSyncRootPath: config.linkedSyncRootPath ?? null,
          hasCompletedSync: Boolean(config.hasCompletedSync)
        },
        null,
        2
      )
    )
  }

  private applyFolderPath(folderPath: string, options: ApplyFolderPathOptions = {}): void {
    const syncRootPath = join(folderPath, SYNC_FOLDER_NAME)
    mkdirSync(join(syncRootPath, 'operations'), { recursive: true })
    mkdirSync(join(syncRootPath, 'checkpoints'), { recursive: true })
    this.sessionNoticeKeys.clear()

    this.status = {
      ...this.status,
      configured: true,
      hasCompletedSync: options.hasCompletedSync ?? false,
      folderPath,
      syncRootPath,
      providerHint: inferProviderHint(folderPath),
      lastSyncedAtUtc: null,
      lastImportedAtUtc: null,
      lastExportedAtUtc: null,
      lastCheckpointAtUtc: null,
      lastError: null,
      bootstrapConflict: null
    }

    this.startWatching()
  }

  private ensureRemoteDirs(info: SyncFolderConfig): void {
    mkdirSync(info.operationsPath, { recursive: true })
    mkdirSync(info.checkpointsPath, { recursive: true })
  }

  private buildFolderInfoFromPending(pending: PendingRemoteBootstrap): SyncFolderConfig {
    return {
      folderPath: pending.folderPath,
      syncRootPath: pending.syncRootPath,
      operationsPath: join(pending.syncRootPath, 'operations'),
      checkpointsPath: join(pending.syncRootPath, 'checkpoints'),
      providerHint: pending.providerHint
    }
  }

  private loadRemoteData(info: SyncFolderConfig): LoadedRemoteData {
    const operations = readdirSync(info.operationsPath)
      .filter((entry) => entry.endsWith('.json'))
      .map((fileName) => {
        const sourcePath = join(info.operationsPath, fileName)
        const parsed = safeParseJson<SyncOperation>(readFileSync(sourcePath, 'utf8'))
        if (!parsed) {
          this.pushNoticeOnce(
            `invalid-operation-file:${sourcePath}`,
            createFileWarningNotice(`Ignored unreadable remote operation file ${fileName}.`)
          )
          return null
        }

        const validationError = validateOperationShape(parsed)
        if (validationError) {
          this.pushNoticeOnce(
            `invalid-operation-shape:${sourcePath}`,
            createFileWarningNotice(`Ignored invalid remote operation file ${fileName}: ${validationError}.`)
          )
          return null
        }

        return { fileName, operation: parsed }
      })
      .filter((entry): entry is ParsedRemoteOperationFile => Boolean(entry))
      .sort((left, right) => compareOperations(left.operation, right.operation))

    const checkpoints = readdirSync(info.checkpointsPath)
      .filter((entry) => entry.endsWith('.json'))
      .map((fileName) => {
        const sourcePath = join(info.checkpointsPath, fileName)
        const parsed = safeParseJson<SyncCheckpoint>(readFileSync(sourcePath, 'utf8'))
        if (!parsed) {
          this.pushNoticeOnce(
            `invalid-checkpoint-file:${sourcePath}`,
            createFileWarningNotice(`Ignored unreadable remote checkpoint file ${fileName}.`)
          )
          return null
        }

        const validationError = validateCheckpointSnapshot(parsed)
        if (validationError) {
          this.pushNoticeOnce(
            `invalid-checkpoint-shape:${sourcePath}`,
            createFileWarningNotice(`Ignored invalid remote checkpoint file ${fileName}: ${validationError}`)
          )
          return null
        }

        return { fileName, checkpoint: parsed }
      })
      .filter((entry): entry is ParsedRemoteCheckpointFile => Boolean(entry))
      .sort((left, right) => compareCheckpoints(left.checkpoint, right.checkpoint))

    return { operations, checkpoints }
  }

  private buildRemoteBootstrapPlan(remoteData: LoadedRemoteData): RemoteBootstrapPlan | null {
    const operations = remoteData.operations.map((entry) => entry.operation)
    const checkpointCandidates = remoteData.checkpoints.map((entry) => entry.checkpoint)

    for (const checkpoint of [...checkpointCandidates].reverse()) {
      const plan = this.stageRemoteBootstrapPlan(checkpoint, operations)
      if (plan?.hasWorkspaceData) {
        return plan
      }
    }

    if (operations.length > 0) {
      const operationsOnlyPlan = this.stageRemoteBootstrapPlan(null, operations)
      if (operationsOnlyPlan?.hasWorkspaceData) {
        return operationsOnlyPlan
      }
    }

    return null
  }

  private stageRemoteBootstrapPlan(checkpoint: SyncCheckpoint | null, operations: SyncOperation[]): RemoteBootstrapPlan | null {
    try {
      return withScratchDatabase(() => {
        if (checkpoint) {
          importCheckpoint(checkpoint)
        }

        operations.forEach((operation) => {
          applyRemoteOperation(operation)
        })

        exportCheckpoint()
        const workspaceState = getWorkspaceBootstrapState()
        const hasWorkspaceData =
          workspaceState.boardCount > 0 || workspaceState.columnCount > 0 || workspaceState.cardCount > 0

        return {
          checkpoint,
          operations,
          hasWorkspaceData
        }
      })
    } catch {
      return null
    }
  }

  private applyBootstrapPlan(plan: RemoteBootstrapPlan): { importedCheckpoint: boolean; importedCount: number } {
    if (plan.checkpoint) {
      importCheckpoint(plan.checkpoint)
      this.pushNotice({
        id: randomUUID(),
        level: 'info',
        message: `Imported checkpoint ${plan.checkpoint.checkpointId.slice(0, 8)} from ${plan.checkpoint.deviceId.slice(0, 8)}.`,
        createdAtUtc: now()
      })
    } else {
      clearWorkspaceForRemoteBootstrap()
    }

    const importedCount = this.importRemoteOperations(plan.operations)
    return {
      importedCheckpoint: Boolean(plan.checkpoint),
      importedCount
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

  private importRemoteOperations(operations: SyncOperation[]): number {
    let importedCount = 0

    operations.forEach((operation) => {
      const result = applyRemoteOperation(operation)
      result.notices.forEach((notice) => {
        if (result.outcome === 'deferred') {
          this.pushNoticeOnce(`deferred:${operation.operationId}:${notice.message}`, notice)
          return
        }
        if (result.outcome === 'invalid') {
          this.pushNoticeOnce(`invalid:${operation.operationId}:${notice.message}`, notice)
          return
        }
        this.pushNotice(notice)
      })

      if (result.outcome === 'applied') {
        importedCount += 1
      }
    })

    return importedCount
  }

  private importNewestCheckpoint(checkpoints: SyncCheckpoint[]): boolean {
    const localClock = getLocalClock()
    const localApplied = getAppliedOperationsCount()
    const localWorkspace = getWorkspaceBootstrapState()

    for (const latest of [...checkpoints].reverse()) {
      const remoteHasWorkspaceData =
        latest.workspace.boards.length > 0 || latest.workspace.columns.length > 0 || latest.workspace.cards.length > 0
      const localNeedsBootstrap = localWorkspace.boardCount === 0 || localWorkspace.isPristineSeedWorkspace

      if (localNeedsBootstrap && remoteHasWorkspaceData) {
        try {
          importCheckpoint(latest)
          this.pushNotice({
            id: randomUUID(),
            level: 'info',
            message: `Imported checkpoint ${latest.checkpointId.slice(0, 8)} from ${latest.deviceId.slice(0, 8)}.`,
            createdAtUtc: now()
          })
          return true
        } catch (error) {
          this.pushNoticeOnce(
            `checkpoint-import:${latest.checkpointId}`,
            createFileWarningNotice(
              error instanceof Error ? error.message : `Ignored remote checkpoint ${latest.checkpointId.slice(0, 8)} during import.`
            )
          )
          continue
        }
      }

      if (latest.maxClock < localClock) {
        continue
      }
      if (latest.maxClock === localClock && latest.workspace.appliedOperationIds.length <= localApplied) {
        continue
      }

      try {
        importCheckpoint(latest)
        this.pushNotice({
          id: randomUUID(),
          level: 'info',
          message: `Imported checkpoint ${latest.checkpointId.slice(0, 8)} from ${latest.deviceId.slice(0, 8)}.`,
          createdAtUtc: now()
        })
        return true
      } catch (error) {
        this.pushNoticeOnce(
          `checkpoint-import:${latest.checkpointId}`,
          createFileWarningNotice(
            error instanceof Error ? error.message : `Ignored remote checkpoint ${latest.checkpointId.slice(0, 8)} during import.`
          )
        )
      }
    }

    return false
  }

  private writeCheckpoint(info: SyncFolderConfig): void {
    const checkpoint = exportCheckpoint()
    const targetPath = join(info.checkpointsPath, `${checkpoint.checkpointId}.json`)
    writeFileSync(targetPath, JSON.stringify(checkpoint, null, 2))
    this.localOpsSinceCheckpoint = 0
    this.status = { ...this.status, lastCheckpointAtUtc: checkpoint.createdAtUtc }

    const checkpointFiles = readdirSync(info.checkpointsPath)
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => ({
        file: entry,
        checkpoint: safeParseJson<SyncCheckpoint>(readFileSync(join(info.checkpointsPath, entry), 'utf8'))
      }))
      .filter((entry): entry is { file: string; checkpoint: SyncCheckpoint } => Boolean(entry.checkpoint))
      .sort((left, right) => compareCheckpoints(left.checkpoint, right.checkpoint))
    if (checkpointFiles.length > 6) {
      checkpointFiles.slice(0, checkpointFiles.length - 6).forEach((entry) => {
        rmSync(join(info.checkpointsPath, entry.file), { force: true })
      })
    }
  }

  private async createRecoveryBackup(reason: string, info: SyncFolderConfig): Promise<void> {
    mkdirSync(this.recoveryPath, { recursive: true })
    const stamp = now().replace(/[-:TZ.]/g, '').slice(0, 17)
    const recoveryDir = join(this.recoveryPath, `${stamp}-${randomUUID().slice(0, 8)}`)
    mkdirSync(recoveryDir, { recursive: true })

    await backupDatabase(join(recoveryDir, 'stickban.db'))
    writeFileSync(
      join(recoveryDir, 'metadata.json'),
      JSON.stringify(
        {
          createdAtUtc: now(),
          reason,
          deviceId: this.status.deviceId,
          folderPath: info.folderPath,
          syncRootPath: info.syncRootPath
        },
        null,
        2
      )
    )
  }
}
