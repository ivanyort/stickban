import { app } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import type { UpdateError, UpdateInfoSummary, UpdateStatus } from '../shared/types'

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

function now(): string {
  return new Date().toISOString()
}

function toUpdateSummary(info: UpdateInfo): UpdateInfoSummary {
  return {
    version: info.version,
    releaseName: info.releaseName ?? null,
    releaseDateUtc: info.releaseDate ? new Date(info.releaseDate).toISOString() : null
  }
}

function toFriendlyError(error: unknown): UpdateError {
  if (error instanceof Error) {
    return {
      message: error.message,
      atUtc: now()
    }
  }

  return {
    message: 'Unexpected update error',
    atUtc: now()
  }
}

export class UpdateManager {
  private readonly status: UpdateStatus = {
    supported: process.platform === 'win32' && app.isPackaged,
    phase: process.platform === 'win32' && app.isPackaged ? 'idle' : 'disabled',
    currentVersion: app.getVersion(),
    availableUpdate: null,
    downloadedUpdate: null,
    downloadProgressPercent: null,
    lastCheckedAtUtc: null,
    lastDownloadedAtUtc: null,
    lastError: null
  }

  private initialized = false
  private checkTimer: NodeJS.Timeout | null = null
  private checkInFlight = false
  private downloadInFlight = false

  initialize(): void {
    if (this.initialized || !this.status.supported) {
      return
    }

    this.initialized = true
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.autoRunAppAfterInstall = true

    autoUpdater.on('checking-for-update', () => {
      this.status.phase = 'checking'
      this.status.downloadProgressPercent = null
      this.status.lastCheckedAtUtc = now()
      this.status.lastError = null
    })

    autoUpdater.on('update-available', (info) => {
      this.downloadInFlight = true
      this.status.phase = 'available'
      this.status.availableUpdate = toUpdateSummary(info)
      this.status.downloadedUpdate = null
      this.status.downloadProgressPercent = 0
      this.status.lastCheckedAtUtc = now()
      this.status.lastError = null
    })

    autoUpdater.on('update-not-available', () => {
      this.status.phase = 'up-to-date'
      this.status.availableUpdate = null
      this.status.downloadedUpdate = null
      this.status.downloadProgressPercent = null
      this.status.lastCheckedAtUtc = now()
      this.status.lastError = null
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.downloadInFlight = true
      this.status.phase = 'downloading'
      this.status.downloadProgressPercent = Number(progress.percent.toFixed(1))
      this.status.lastError = null
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.downloadInFlight = false
      this.status.phase = 'downloaded'
      this.status.downloadedUpdate = toUpdateSummary(info)
      this.status.downloadProgressPercent = 100
      this.status.lastDownloadedAtUtc = now()
      this.status.lastError = null
    })

    autoUpdater.on('error', (error) => {
      this.checkInFlight = false
      this.downloadInFlight = false
      this.status.phase = 'error'
      this.status.downloadProgressPercent = null
      this.status.lastError = toFriendlyError(error)
    })

    void this.checkForUpdates()
    this.checkTimer = setInterval(() => {
      void this.checkForUpdates()
    }, UPDATE_CHECK_INTERVAL_MS)
  }

  getStatus(): UpdateStatus {
    return { ...this.status }
  }

  async checkForUpdates(): Promise<UpdateStatus> {
    if (!this.status.supported) {
      return this.getStatus()
    }

    if (this.checkInFlight || this.downloadInFlight || this.status.phase === 'downloaded') {
      return this.getStatus()
    }

    this.checkInFlight = true
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.status.phase = 'error'
      this.status.lastError = toFriendlyError(error)
    } finally {
      this.checkInFlight = false
    }

    return this.getStatus()
  }

  async downloadUpdate(): Promise<UpdateStatus> {
    if (!this.status.supported) {
      return this.getStatus()
    }

    if (this.status.phase === 'downloaded' || this.downloadInFlight) {
      return this.getStatus()
    }

    if (this.status.availableUpdate) {
      try {
        this.downloadInFlight = true
        await autoUpdater.downloadUpdate()
      } catch (error) {
        this.downloadInFlight = false
        this.status.phase = 'error'
        this.status.lastError = toFriendlyError(error)
      }

      return this.getStatus()
    }

    return this.checkForUpdates()
  }

  quitAndInstallUpdate(): void {
    if (!this.status.supported || this.status.phase !== 'downloaded') {
      return
    }

    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true)
    })
  }

  dispose(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }
}
