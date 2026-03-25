import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpCircle,
  Cloud,
  CloudOff,
  Download,
  FolderSync,
  GripVertical,
  Minus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  X
} from 'lucide-react'
import type { BoardSummary, CardDraft, CardRecord, ColumnRecord, UpdateStatus } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { StickbanMark } from '@renderer/components/brand/stickban-mark'
import { cn } from '@renderer/lib/utils'
import { useBoardStore } from './store'

function App(): JSX.Element {
  const {
    boards,
    activeBoardId,
    activeBoard,
    alwaysOnTop,
    isMaximized,
    platform,
    appVersion,
    loading,
    saving,
    error,
    syncStatus,
    syncFolderInfo,
    syncNotices,
    updateStatus,
    editingCard,
    initialize,
    createBoard,
    updateBoard,
    deleteBoard,
    setActiveBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    setEditingCard,
    toggleAlwaysOnTop,
    minimizeWindow,
    toggleMaximizeWindow,
    closeWindow,
    chooseSyncFolder,
    clearSyncFolder,
    syncNow,
    adoptRemoteWorkspace,
    refreshSyncStatus,
    refreshUpdateStatus,
    checkForUpdates,
    downloadUpdate,
    quitAndInstallUpdate,
    refreshWorkspace
  } = useBoardStore()
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingBoardTitle, setEditingBoardTitle] = useState('')
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [taskDragCandidate, setTaskDragCandidate] = useState<{
    taskId: string
    columnId: string
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [draggedTask, setDraggedTask] = useState<{
    taskId: string
    columnId: string
    offsetX: number
    offsetY: number
  } | null>(null)
  const [draggedTaskPointer, setDraggedTaskPointer] = useState<{ x: number; y: number } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverTaskPosition, setDragOverTaskPosition] = useState<{
    columnId: string
    index: number
  } | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<{ columnId: string; boardId: string } | null>(null)
  const [draggedColumnPointer, setDraggedColumnPointer] = useState<{ x: number; y: number } | null>(null)
  const [dragOverColumnPosition, setDragOverColumnPosition] = useState<{
    columnId: string
    position: 'left' | 'right'
  } | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null)
  const cardListRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSyncStatus()
      void refreshUpdateStatus()
      void refreshWorkspace()
    }, 20000)

    return () => window.clearInterval(interval)
  }, [refreshSyncStatus, refreshUpdateStatus, refreshWorkspace])

  useEffect(() => {
    if (editingBoardId && !boards.some((board) => board.id === editingBoardId)) {
      setEditingBoardId(null)
      setEditingBoardTitle('')
    }
  }, [boards, editingBoardId])

  useEffect(() => {
    if (!taskDragCandidate && !draggedTask) {
      return
    }

    const updateTaskDropTarget = (clientX: number, clientY: number, draggingTaskId: string): void => {
      const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null
      const columnList = target?.closest('[data-card-list-column-id]') as HTMLElement | null

      if (!columnList) {
        setDragOverColumn(null)
        setDragOverTaskPosition(null)
        return
      }

      const targetColumnId = columnList.dataset.cardListColumnId
      if (!targetColumnId) {
        setDragOverColumn(null)
        setDragOverTaskPosition(null)
        return
      }

      const cardElements = Array.from(columnList.querySelectorAll<HTMLElement>('[data-task-card="true"]')).filter(
        (element) => element.dataset.taskCardId !== draggingTaskId
      )

      let nextIndex = cardElements.length
      for (let index = 0; index < cardElements.length; index += 1) {
        const rect = cardElements[index].getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        if (clientY < midpoint) {
          nextIndex = index
          break
        }
      }

      setDragOverColumn(targetColumnId)
      setDragOverTaskPosition({ columnId: targetColumnId, index: nextIndex })
    }

    const handlePointerMove = (event: PointerEvent): void => {
      if (taskDragCandidate && !draggedTask) {
        const distance = Math.hypot(event.clientX - taskDragCandidate.startX, event.clientY - taskDragCandidate.startY)
        if (distance < 4) {
          return
        }

        setDraggedTask({
          taskId: taskDragCandidate.taskId,
          columnId: taskDragCandidate.columnId,
          offsetX: taskDragCandidate.offsetX,
          offsetY: taskDragCandidate.offsetY
        })
        setDraggedTaskPointer({ x: event.clientX, y: event.clientY })
        updateTaskDropTarget(event.clientX, event.clientY, taskDragCandidate.taskId)
        return
      }

      if (draggedTask) {
        setDraggedTaskPointer({ x: event.clientX, y: event.clientY })
        updateTaskDropTarget(event.clientX, event.clientY, draggedTask.taskId)
      }
    }

    const handlePointerUp = (): void => {
      if (draggedTask && dragOverTaskPosition) {
        const nextIndex = dragOverTaskPosition.index
        void moveCard(draggedTask.taskId, dragOverTaskPosition.columnId, nextIndex)
      }

      setTaskDragCandidate(null)
      setDraggedTask(null)
      setDraggedTaskPointer(null)
      setDragOverColumn(null)
      setDragOverTaskPosition(null)
    }

    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [taskDragCandidate, draggedTask, dragOverTaskPosition, moveCard])

  useEffect(() => {
    if (!draggedColumn) {
      return
    }

    const handleWindowDragOver = (event: DragEvent): void => {
      setDraggedColumnPointer({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('dragover', handleWindowDragOver)
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver)
    }
  }, [draggedColumn])

  const orderedColumns = useMemo(
    () => activeBoard?.columns.slice().sort((a, b) => a.position - b.position) ?? [],
    [activeBoard]
  )
  const draggedColumnRecord = useMemo(
    () => activeBoard?.columns.find((column) => column.id === draggedColumn?.columnId) ?? null,
    [activeBoard, draggedColumn]
  )
  const draggedTaskRecord = useMemo(
    () => activeBoard?.columns.flatMap((column) => column.cards).find((card) => card.id === draggedTask?.taskId) ?? null,
    [activeBoard, draggedTask]
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-card-foreground shadow-card">
          Loading Stickban...
        </div>
      </div>
    )
  }

  if (!activeBoard || !activeBoardId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-xl border border-destructive/20 bg-card p-6 shadow-card">
          <h1 className="text-lg font-semibold text-card-foreground">Stickban could not load the workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? 'Unexpected application state.'}</p>
        </div>
      </div>
    )
  }

  const totalCards = orderedColumns.reduce((acc, column) => acc + column.cards.length, 0)
  const syncBadgeLabel = syncStatus?.configured
    ? syncStatus.syncing
      ? 'Syncing'
      : syncStatus.pendingLocalOperations > 0
        ? 'Pending sync'
        : 'Cloud sync'
    : 'Local only'
  const syncBadgeIcon = syncStatus?.configured ? Cloud : CloudOff
  const SyncBadgeIcon = syncBadgeIcon
  const lastSyncRelative = syncStatus?.lastSyncedAtUtc ? formatSyncRelative(syncStatus.lastSyncedAtUtc) : null
  const footerStatus = saving
    ? 'Saving changes locally'
    : !syncStatus?.configured
      ? 'All changes saved locally'
      : syncStatus.syncing
        ? 'Saved locally • Syncing cloud changes'
        : syncStatus.pendingLocalOperations > 0
          ? 'Saved locally • Sync pending'
          : `Saved locally • Cloud sync up to date${lastSyncRelative ? ` • ${lastSyncRelative}` : ''}`
  const updateBadge = getUpdateFooterBadge(updateStatus)
  const footerStatusDotClass = saving
    ? 'bg-amber-500'
    : syncStatus?.configured && (syncStatus.syncing || syncStatus.pendingLocalOperations > 0)
      ? 'bg-sky-500'
      : 'bg-emerald-500'

  const startBoardRename = (board: BoardSummary): void => {
    setEditingBoardId(board.id)
    setEditingBoardTitle(board.title)
  }

  const persistBoardRename = (): void => {
    if (!editingBoardId) {
      return
    }

    const targetBoard = boards.find((board) => board.id === editingBoardId)
    if (!targetBoard) {
      setEditingBoardId(null)
      setEditingBoardTitle('')
      return
    }

    const nextTitle = editingBoardTitle.trim()
    if (!nextTitle) {
      setEditingBoardId(null)
      setEditingBoardTitle('')
      return
    }

    if (nextTitle !== targetBoard.title) {
      void updateBoard(editingBoardId, { title: nextTitle })
    }

    setEditingBoardId(null)
    setEditingBoardTitle('')
  }

  const handleDeleteBoard = (board: BoardSummary): void => {
    if (boards.length <= 1) {
      return
    }

    const confirmed = window.confirm(
      `Delete board "${board.title}"? This will permanently remove its columns and cards.`
    )

    if (confirmed) {
      void deleteBoard(board.id)
    }
  }

  const handleTaskPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    taskId: string,
    columnId: string
  ): void => {
    if (event.button !== 0) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('button, input, textarea, [role="menuitem"]')) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    event.preventDefault()
    setTaskDragCandidate({
      taskId,
      columnId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    })
  }

  const handleColumnDragStart = (columnId: string, boardId: string): void => {
    setDraggedColumn({ columnId, boardId })
  }

  const handleColumnDragOver = (event: React.DragEvent, columnId: string): void => {
    event.preventDefault()
    if (!draggedColumn) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const midpoint = rect.left + rect.width / 2
    const position = event.clientX < midpoint ? 'left' : 'right'
    setDragOverColumnPosition({ columnId, position })
  }

  const handleColumnDragLeave = (): void => {
    setDragOverColumnPosition(null)
  }

  const handleColumnDrop = (
    event: React.DragEvent,
    targetColumnId: string,
    targetBoardId: string
  ): void => {
    event.preventDefault()
    setDragOverColumnPosition(null)
    setDragOverBoardId(null)

    if (!draggedColumn) {
      return
    }

    const { columnId: sourceColumnId } = draggedColumn
    const target = event.currentTarget as HTMLElement | null
    const rect = target?.getBoundingClientRect()
    const insertAfter = rect ? event.clientX >= rect.left + rect.width / 2 : false
    const sourceIndex = orderedColumns.findIndex((column) => column.id === sourceColumnId)
    const targetIndex = orderedColumns.findIndex((column) => column.id === targetColumnId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null)
      return
    }

    let nextIndex = targetIndex + (insertAfter ? 1 : 0)
    if (draggedColumn.boardId === targetBoardId && sourceIndex < targetIndex) {
      nextIndex -= 1
    }

    void (async () => {
      await moveColumn({ columnId: sourceColumnId, toBoardId: targetBoardId, toIndex: nextIndex })
      if (activeBoardId !== targetBoardId) {
        await setActiveBoard(targetBoardId)
      }
    })()

    setDraggedColumn(null)
  }

  const handleColumnDragEnd = (): void => {
    setDraggedColumn(null)
    setDragOverColumnPosition(null)
    setDragOverBoardId(null)
    setDraggedColumnPointer(null)
  }

  const handleBoardTabDragOver = (event: React.DragEvent, boardId: string): void => {
    event.preventDefault()
    if (draggedColumn && boardId !== draggedColumn.boardId) {
      setDragOverBoardId(boardId)
    }
  }

  const handleBoardTabDragLeave = (): void => {
    setDragOverBoardId(null)
  }

  const handleBoardTabDrop = (event: React.DragEvent, targetBoardId: string): void => {
    event.preventDefault()
    setDragOverBoardId(null)

    if (!draggedColumn || draggedColumn.boardId === targetBoardId) {
      setDraggedColumn(null)
      return
    }

    const targetBoard = boards.find((board) => board.id === targetBoardId)
    if (!targetBoard) {
      setDraggedColumn(null)
      return
    }

    void (async () => {
      await moveColumn({
        columnId: draggedColumn.columnId,
        toBoardId: targetBoardId,
        toIndex: targetBoard.columnCount
      })
      await setActiveBoard(targetBoardId)
    })()
    setDraggedColumn(null)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {platform === 'win32' ? <div className="pointer-events-none fixed inset-x-0 top-14 z-40 h-px bg-border" /> : null}
      {draggedTaskRecord && draggedTaskPointer ? (
        <TaskDragGhost
          card={draggedTaskRecord}
          offset={draggedTask ? { x: draggedTask.offsetX, y: draggedTask.offsetY } : { x: 24, y: 20 }}
          pointer={draggedTaskPointer}
        />
      ) : null}
      {draggedColumnRecord && draggedColumnPointer ? (
        <ColumnDragGhost column={draggedColumnRecord} pointer={draggedColumnPointer} />
      ) : null}
      <header
        className={cn(
          'relative flex h-14 shrink-0 items-center justify-between gap-4 bg-card px-4',
          platform !== 'win32' && 'border-b border-border',
          platform === 'win32' && 'pr-[140px]'
        )}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
          <div
            className="flex shrink-0 items-center gap-2 pr-2"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <StickbanMark />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Stickban</span>
          </div>

          <div className="h-5 w-px shrink-0 bg-border" />

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {boards.map((board) => (
              <BoardTab
                board={board}
                canDelete={boards.length > 1}
                isColumnDropTarget={dragOverBoardId === board.id}
                editingBoardId={editingBoardId}
                editingTitle={editingBoardTitle}
                isActive={board.id === activeBoardId}
                key={board.id}
                onActivate={() => void setActiveBoard(board.id)}
                onColumnDragLeave={handleBoardTabDragLeave}
                onColumnDragOver={(event) => handleBoardTabDragOver(event, board.id)}
                onColumnDrop={(event) => handleBoardTabDrop(event, board.id)}
                onDelete={() => handleDeleteBoard(board)}
                onEditTitleChange={setEditingBoardTitle}
                onRename={() => startBoardRename(board)}
                onRenameCancel={() => {
                  setEditingBoardId(null)
                  setEditingBoardTitle('')
                }}
                onRenameCommit={persistBoardRename}
              />
            ))}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-dashed border-border text-muted-foreground hover:border-border hover:text-foreground"
              onClick={() => void createBoard({ title: `Board ${boards.length + 1}` })}
              title="Add board"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="relative z-10 flex shrink-0 items-center gap-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSyncPanel((current) => !current)}
            className={cn(
              'rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary/80',
              showSyncPanel && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
          >
            <SyncBadgeIcon className="h-3 w-3" />
            <span>{syncBadgeLabel}</span>
          </Button>

          <Button
            variant={alwaysOnTop ? 'default' : 'ghost'}
            size="sm"
            onClick={() => void toggleAlwaysOnTop()}
            className={cn(
              'gap-1.5 text-xs',
              alwaysOnTop && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {alwaysOnTop ? (
              <>
                <Pin className="h-3.5 w-3.5" />
                <span>Pinned</span>
              </>
            ) : (
              <>
                <PinOff className="h-3.5 w-3.5" />
                <span>Pin</span>
              </>
            )}
          </Button>

          <div className="h-5 w-px bg-border" />

          {platform !== 'win32' ? (
            <div className="flex items-center">
              <button
                onClick={() => void minimizeWindow()}
                className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Minimize"
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => void toggleMaximizeWindow()}
                className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={isMaximized ? 'Restore' : 'Maximize'}
                type="button"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => void closeWindow()}
                className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                title="Close"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="px-4 pt-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        </div>
      ) : null}

      <main className="flex flex-1 gap-4 overflow-x-auto p-4">
        {orderedColumns.map((column) => (
          <BoardColumn
            addingDisabled={Boolean(editingCard)}
            boardId={activeBoard.id}
            column={column}
            draggedColumnId={draggedColumn?.columnId ?? null}
            dragOverColumn={dragOverColumn}
            dragOverColumnPosition={dragOverColumnPosition}
            draggedTaskId={draggedTask?.taskId ?? null}
            dragOverTaskPosition={dragOverTaskPosition}
            key={column.id}
            onAddCard={(draft) => void createCard(column.id, draft)}
            onColumnDragEnd={handleColumnDragEnd}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragStart={handleColumnDragStart}
            onColumnDragPointerMove={setDraggedColumnPointer}
            onColumnDrop={handleColumnDrop}
            onDeleteCard={(cardId) => void deleteCard(cardId)}
            onDeleteColumn={(columnToDelete) => {
              const confirmed = window.confirm(
                columnToDelete.cards.length > 0
                  ? `Delete column "${columnToDelete.title}" and its ${columnToDelete.cards.length} cards?`
                  : `Delete column "${columnToDelete.title}"?`
              )

              if (confirmed) {
                void deleteColumn(columnToDelete.id)
              }
            }}
            draggedTaskColumnId={draggedTask?.columnId ?? null}
            onTaskListRef={(node) => {
              cardListRefs.current[column.id] = node
            }}
            onTaskPointerDown={handleTaskPointerDown}
            onEditCard={setEditingCard}
            onRenameColumn={(columnId, draft) => void updateColumn(columnId, { title: draft })}
          />
        ))}

        <AddColumnPanel onAdd={(title) => void createColumn(activeBoard.id, { title })} />
      </main>

      {showSyncPanel ? (
        <section className="border-t border-border bg-card/95 px-4 py-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Cloud Sync</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stickban writes immutable operation files into a synced folder and rebuilds state from checkpoints plus
                  later operations.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void refreshSyncStatus()} className="gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh status</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => void syncNow()} className="gap-1.5 text-xs">
                  <FolderSync className="h-3.5 w-3.5" />
                  <span>Sync now</span>
                </Button>
                <Button size="sm" onClick={() => void chooseSyncFolder()} className="gap-1.5 text-xs">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>{syncStatus?.configured ? 'Change folder' : 'Choose folder'}</span>
                </Button>
                {syncStatus?.configured ? (
                  <Button size="sm" variant="ghost" onClick={() => void clearSyncFolder()} className="text-xs">
                    Disconnect
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SyncMetric label="Mode" value={syncStatus?.configured ? syncStatus.providerHint ?? 'Synced folder' : 'Local only'} />
              <SyncMetric
                label="Pending local ops"
                value={String(syncStatus?.pendingLocalOperations ?? 0)}
              />
              <SyncMetric
                label="Last sync"
                value={syncStatus?.lastSyncedAtUtc ? formatSyncMoment(syncStatus.lastSyncedAtUtc) : 'Not yet'}
              />
              <SyncMetric
                label="Last checkpoint"
                value={syncStatus?.lastCheckpointAtUtc ? formatSyncMoment(syncStatus.lastCheckpointAtUtc) : 'Not yet'}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border/80 bg-background/80 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Folder
                </div>
                <div className="mt-2 text-sm text-foreground">
                  {syncFolderInfo?.folderPath ?? 'No synced folder configured yet.'}
                </div>
                {syncFolderInfo?.syncRootPath ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Remote root: {syncFolderInfo.syncRootPath}
                  </div>
                ) : null}
                {syncStatus?.lastError ? (
                  <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {syncStatus.lastError}
                  </div>
                ) : null}
                {syncStatus?.bootstrapConflict ? (
                  <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-xs text-amber-900">
                    <div className="font-semibold">Remote workspace detected</div>
                    <div className="mt-1">{syncStatus.bootstrapConflict.reason}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-700/20 bg-white/60 text-amber-900 hover:bg-white"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Use the remote workspace from "${syncStatus.bootstrapConflict?.providerHint}" and discard the current local data on this machine?`
                          )
                          if (confirmed) {
                            void adoptRemoteWorkspace()
                          }
                        }}
                      >
                        Use remote and discard local
                      </Button>
                      <Button size="sm" variant="ghost" className="text-amber-900" onClick={() => void clearSyncFolder()}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/80 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Device
                </div>
                <div className="mt-2 text-sm text-foreground">{syncStatus?.deviceId ?? 'Unavailable'}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {syncStatus?.configured
                    ? 'This device appends operation files locally and imports new files from the synced folder.'
                    : 'Choose a folder that is already synchronized by OneDrive, Dropbox, Google Drive Desktop, or iCloud Drive.'}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Notices
                </div>
                <div className="text-xs text-muted-foreground">
                  Merge and checkpoint events from the immutable sync log
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {syncNotices.length > 0 ? (
                  syncNotices.map((notice) => (
                    <div
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs',
                        notice.level === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive',
                        notice.level === 'warning' && 'border-amber-400/20 bg-amber-400/10 text-amber-900',
                        notice.level === 'info' && 'border-border bg-card text-card-foreground'
                      )}
                      key={notice.id}
                    >
                      <div className="font-medium">{notice.message}</div>
                      <div className="mt-1 text-[11px] opacity-75">{formatSyncDate(notice.createdAtUtc)}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                    No sync notices yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background/80 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    App update
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">{getUpdateHeadline(updateStatus)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{getUpdateDescription(updateStatus)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => void checkForUpdates()} className="gap-1.5 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Check now</span>
                  </Button>
                  {updateStatus?.phase === 'available' || updateStatus?.phase === 'error' ? (
                    <Button size="sm" variant="outline" onClick={() => void downloadUpdate()} className="gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download update</span>
                    </Button>
                  ) : null}
                  {updateStatus?.phase === 'downloaded' ? (
                    <Button size="sm" onClick={() => void quitAndInstallUpdate()} className="gap-1.5 text-xs">
                      <ArrowUpCircle className="h-3.5 w-3.5" />
                      <span>Restart to update</span>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SyncMetric label="Current version" value={updateStatus?.currentVersion ?? appVersion} />
                <SyncMetric
                  label="Available version"
                  value={updateStatus?.availableUpdate?.version ?? updateStatus?.downloadedUpdate?.version ?? 'None'}
                />
                <SyncMetric
                  label="Last check"
                  value={updateStatus?.lastCheckedAtUtc ? formatSyncMoment(updateStatus.lastCheckedAtUtc) : 'Not yet'}
                />
                <SyncMetric
                  label="Download"
                  value={
                    updateStatus?.phase === 'downloading' && updateStatus.downloadProgressPercent !== null
                      ? `${updateStatus.downloadProgressPercent}%`
                      : updateStatus?.phase === 'downloaded'
                        ? 'Ready to install'
                        : 'Idle'
                  }
                />
              </div>

              {updateStatus?.lastError ? (
                <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {updateStatus.lastError.message}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {totalCards} tasks across {orderedColumns.length} columns
          </span>
          <span>Version {appVersion}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {updateBadge ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{updateBadge}</span> : null}
          <div className={cn('h-1.5 w-1.5 rounded-full', footerStatusDotClass)} />
          <span>{footerStatus}</span>
        </div>
      </footer>

      {editingCard ? (
        <CardEditor
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(draft) => void updateCard(editingCard.id, draft)}
        />
      ) : null}
    </div>
  )
}

function formatSyncDate(value: string): string {
  return new Date(value).toLocaleString()
}

function formatSyncRelative(value: string): string {
  const deltaMs = Date.now() - new Date(value).getTime()
  if (deltaMs < 0) {
    return 'just now'
  }

  const seconds = Math.floor(deltaMs / 1000)
  if (seconds < 10) {
    return 'just now'
  }
  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} d ago`
  }

  return formatSyncDate(value)
}

function formatSyncMoment(value: string): string {
  return `${formatSyncRelative(value)} • ${formatSyncDate(value)}`
}

function getUpdateHeadline(status: UpdateStatus | null): string {
  if (!status?.supported) {
    return 'Automatic updates are available only in packaged Windows builds.'
  }

  switch (status.phase) {
    case 'checking':
      return 'Checking for updates'
    case 'available':
      return `Update ${status.availableUpdate?.version ?? ''} found`
    case 'downloading':
      return `Downloading update${status.downloadProgressPercent !== null ? ` (${status.downloadProgressPercent}%)` : ''}`
    case 'downloaded':
      return `Update ${status.downloadedUpdate?.version ?? status.availableUpdate?.version ?? ''} is ready to install`
    case 'up-to-date':
      return 'Stickban is up to date'
    case 'error':
      return 'Update check failed'
    default:
      return 'Automatic app updates'
  }
}

function getUpdateDescription(status: UpdateStatus | null): string {
  if (!status?.supported) {
    return 'Dev builds and non-Windows packaged builds do not run the GitHub Releases updater flow.'
  }

  if (status.phase === 'downloaded') {
    return 'The installer package is already cached locally. Restart the app to finish the update.'
  }

  if (status.phase === 'available' || status.phase === 'downloading') {
    return 'Stickban downloads Windows releases from GitHub in the background and keeps your current session usable.'
  }

  return 'Stickban checks public GitHub Releases on startup and periodically during the session.'
}

function getUpdateFooterBadge(status: UpdateStatus | null): string | null {
  if (!status?.supported) {
    return null
  }

  if (status.phase === 'downloaded') {
    return 'Update ready'
  }

  if (status.phase === 'downloading') {
    return status.downloadProgressPercent !== null ? `Updating ${status.downloadProgressPercent}%` : 'Updating'
  }

  return null
}

function SyncMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/80 px-3 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function BoardTab({
  board,
  canDelete,
  isColumnDropTarget,
  editingBoardId,
  editingTitle,
  isActive,
  onActivate,
  onColumnDragLeave,
  onColumnDragOver,
  onColumnDrop,
  onDelete,
  onEditTitleChange,
  onRename,
  onRenameCancel,
  onRenameCommit
}: {
  board: BoardSummary
  canDelete: boolean
  isColumnDropTarget: boolean
  editingBoardId: string | null
  editingTitle: string
  isActive: boolean
  onActivate: () => void
  onColumnDragLeave: () => void
  onColumnDragOver: (event: React.DragEvent) => void
  onColumnDrop: (event: React.DragEvent) => void
  onDelete: () => void
  onEditTitleChange: (value: string) => void
  onRename: () => void
  onRenameCancel: () => void
  onRenameCommit: () => void
}): JSX.Element {
  const isEditing = editingBoardId === board.id

  return (
    <div
      onDragLeave={onColumnDragLeave}
      onDragOver={onColumnDragOver}
      onDrop={onColumnDrop}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 transition-colors',
        isColumnDropTarget && 'border-primary/60 bg-primary/10 text-foreground ring-2 ring-primary/20',
        isActive
          ? 'border-border bg-card text-foreground shadow-card'
          : 'border-transparent bg-secondary/70 text-muted-foreground hover:border-border/60 hover:text-foreground'
      )}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {isEditing ? (
        <Input
          autoFocus
          className="h-6 w-28 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
          onBlur={onRenameCommit}
          onChange={(event) => onEditTitleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onRenameCommit()
            }

            if (event.key === 'Escape') {
              onRenameCancel()
            }
          }}
          value={editingTitle}
        />
      ) : (
        <button
          className="max-w-36 truncate px-1 text-sm font-medium"
          onClick={onActivate}
          type="button"
        >
          {board.title}
        </button>
      )}

      {!isEditing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={!canDelete}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

function BoardColumn({
  addingDisabled,
  boardId,
  column,
  draggedColumnId,
  dragOverColumn,
  dragOverColumnPosition,
  draggedTaskId,
  draggedTaskColumnId,
  dragOverTaskPosition,
  onAddCard,
  onColumnDragEnd,
  onColumnDragLeave,
  onColumnDragOver,
  onColumnDragStart,
  onColumnDragPointerMove,
  onColumnDrop,
  onDeleteCard,
  onDeleteColumn,
  onTaskListRef,
  onTaskPointerDown,
  onEditCard,
  onRenameColumn
}: {
  addingDisabled: boolean
  boardId: string
  column: ColumnRecord
  draggedColumnId: string | null
  dragOverColumn: string | null
  dragOverColumnPosition: { columnId: string; position: 'left' | 'right' } | null
  draggedTaskId: string | null
  draggedTaskColumnId: string | null
  dragOverTaskPosition: { columnId: string; index: number } | null
  onAddCard: (draft: CardDraft) => void
  onColumnDragEnd: () => void
  onColumnDragLeave: () => void
  onColumnDragOver: (event: React.DragEvent, columnId: string) => void
  onColumnDragStart: (columnId: string, boardId: string) => void
  onColumnDragPointerMove: (pointer: { x: number; y: number } | null) => void
  onColumnDrop: (event: React.DragEvent, targetColumnId: string, targetBoardId: string) => void
  onDeleteCard: (cardId: string) => void
  onDeleteColumn: (column: ColumnRecord) => void
  onTaskListRef: (node: HTMLDivElement | null) => void
  onTaskPointerDown: (event: React.PointerEvent<HTMLDivElement>, taskId: string, columnId: string) => void
  onEditCard: (card: CardRecord) => void
  onRenameColumn: (columnId: string, title: string) => void
}): JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isEditingColumn, setIsEditingColumn] = useState(false)
  const [columnTitle, setColumnTitle] = useState(column.title)
  const columnRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setColumnTitle(column.title)
  }, [column.title, boardId])

  const persistColumnTitle = (): void => {
    const nextTitle = columnTitle.trim()

    if (!nextTitle) {
      setColumnTitle(column.title)
      setIsEditingColumn(false)
      return
    }

    if (nextTitle !== column.title) {
      onRenameColumn(column.id, nextTitle)
    }

    setColumnTitle(nextTitle)
    setIsEditingColumn(false)
  }

  const submitNewCard = (): void => {
    if (!title.trim()) {
      return
    }

    onAddCard({ title, description })
    setTitle('')
    setDescription('')
    setIsAdding(false)
  }

  return (
    <div
      ref={columnRef}
      onDragLeave={onColumnDragLeave}
      onDragOver={(event) => onColumnDragOver(event, column.id)}
      onDrop={(event) => onColumnDrop(event, column.id, boardId)}
      className={cn(
        'relative flex w-72 shrink-0 flex-col rounded-xl border border-border bg-column p-3 transition-all duration-200',
        dragOverColumn === column.id && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20',
        draggedColumnId === column.id && 'scale-[0.985] opacity-35'
      )}
    >
      {dragOverColumnPosition?.columnId === column.id ? (
        <div
          className={cn(
            'absolute bottom-3 top-3 z-20 w-1 rounded-full bg-primary',
            dragOverColumnPosition.position === 'left' ? '-left-2' : '-right-2'
          )}
        />
      ) : null}

      <div
        draggable={!isEditingColumn}
        onDragEnd={onColumnDragEnd}
        onDragStart={(event) => {
          const transparentPixel = document.createElement('canvas')
          transparentPixel.width = 1
          transparentPixel.height = 1
          event.dataTransfer?.setDragImage(transparentPixel, 0, 0)
          onColumnDragPointerMove({ x: event.clientX, y: event.clientY })
          const columnElement = columnRef.current
          if (columnElement) {
            const rect = columnElement.getBoundingClientRect()
            onColumnDragPointerMove({
              x: event.clientX - (event.clientX - rect.left) + 24,
              y: event.clientY - (event.clientY - rect.top) + 20
            })
          }
          onColumnDragStart(column.id, boardId)
        }}
        className="mb-3 flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-2">
          {isEditingColumn ? (
            <Input
              autoFocus
              className="h-7 w-32 border-transparent bg-transparent px-1 text-sm font-semibold shadow-none focus-visible:border-border focus-visible:bg-background"
              onBlur={persistColumnTitle}
              onChange={(event) => setColumnTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  persistColumnTitle()
                }

                if (event.key === 'Escape') {
                  setColumnTitle(column.title)
                  setIsEditingColumn(false)
                }
              }}
              value={columnTitle}
            />
          ) : (
            <button
              className="truncate text-left text-sm font-semibold text-foreground"
              onClick={() => setIsEditingColumn(true)}
              type="button"
            >
              {column.title}
            </button>
          )}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {column.cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex h-7 w-7 items-center justify-center text-muted-foreground/70">
            <GripVertical className="h-4 w-4" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setIsEditingColumn(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteColumn(column)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsAdding(true)
              setTitle('')
              setDescription('')
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={onTaskListRef}
        data-card-list-column-id={column.id}
        className="flex flex-1 flex-col gap-2 overflow-y-auto"
      >
        {column.cards.length > 0 &&
        dragOverTaskPosition?.columnId === column.id &&
        dragOverTaskPosition.index === 0 ? (
          <div className="relative h-0 shrink-0">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-primary" />
          </div>
        ) : null}

        {column.cards.length === 0 && !isAdding ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 py-8 text-center">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            <button
              onClick={() => {
                setIsAdding(true)
                setTitle('')
                setDescription('')
              }}
              className="mt-1 text-xs font-medium text-primary hover:underline"
              type="button"
            >
              Add your first task
            </button>
          </div>
        ) : null}

        {column.cards.map((card) => (
          <TaskCard
            card={card}
            draggedTaskId={draggedTaskId}
            dragOverTaskPosition={
              dragOverTaskPosition?.columnId === column.id &&
              dragOverTaskPosition.index > 0 &&
              dragOverTaskPosition.index <
                column.cards.filter((columnCard) => columnCard.id !== draggedTaskId).length
                ? column.cards.filter((columnCard) => columnCard.id !== draggedTaskId).findIndex((columnCard) => columnCard.id === card.id) === dragOverTaskPosition.index
                  ? 'before'
                  : null
                : null
            }
            editingDisabled={addingDisabled}
            key={card.id}
            onDelete={() => onDeleteCard(card.id)}
            onPointerDown={(event) => onTaskPointerDown(event, card.id, column.id)}
            onEdit={() => onEditCard(card)}
          />
        ))}

        {column.cards.length > 0 &&
        dragOverTaskPosition?.columnId === column.id &&
        dragOverTaskPosition.index === column.cards.filter((columnCard) => columnCard.id !== draggedTaskId).length ? (
          <div className="relative h-0 shrink-0">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-primary" />
          </div>
        ) : null}

        {isAdding ? (
          <div className="rounded-lg border border-primary/30 bg-card p-3 shadow-card">
            <Input
              autoFocus
              placeholder="Task title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submitNewCard()
                }
              }}
              className="mb-2 h-8 border-0 bg-transparent p-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
            <textarea
              className="min-h-[72px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submitNewCard()
                }
              }}
              placeholder="Optional details"
              value={description}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={submitNewCard}>
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setTitle('')
                  setDescription('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {!isAdding && column.cards.length > 0 ? (
        <button
          onClick={() => {
            setIsAdding(true)
            setTitle('')
            setDescription('')
          }}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
          type="button"
        >
          <Plus className="h-3.5 w-3.5" />
          Add card
        </button>
      ) : null}
    </div>
  )
}

function ColumnDragGhost({
  column,
  pointer
}: {
  column: ColumnRecord
  pointer: { x: number; y: number }
}): JSX.Element {
  return (
    <div
      className="pointer-events-none fixed z-[100] w-72 -translate-x-6 -translate-y-5 rounded-xl border border-border bg-column/95 p-3 shadow-[0_18px_40px_rgba(55,37,15,0.14)] backdrop-blur-[1px]"
      style={{ left: pointer.x, top: pointer.y }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{column.title}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground/70">
          <div className="flex h-7 w-7 items-center justify-center">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex max-h-52 flex-col gap-2 overflow-hidden">
        {column.cards.length === 0 ? (
          <div className="flex min-h-[112px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 py-8 text-center">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            <p className="mt-1 text-xs font-medium text-primary">Add your first task</p>
          </div>
        ) : (
          column.cards.slice(0, 3).map((card) => (
            <div key={card.id} className="rounded-lg border border-border/80 bg-card px-4 py-3 shadow-card">
              <p className="truncate text-sm font-medium text-card-foreground">{card.title}</p>
            </div>
          ))
        )}
      </div>

      {column.cards.length > 0 ? (
        <div className="mt-2 rounded-lg border-2 border-dashed border-border/60 px-4 py-3 text-center text-sm text-muted-foreground">
          + Add card
        </div>
      ) : null}
    </div>
  )
}

function TaskDragGhost({
  card,
  offset,
  pointer
}: {
  card: CardRecord
  offset: { x: number; y: number }
  pointer: { x: number; y: number }
}): JSX.Element {
  return (
    <div
      className="pointer-events-none fixed z-[110] w-[320px] rounded-lg border border-border bg-card/95 p-3 shadow-[0_18px_40px_rgba(55,37,15,0.14)] backdrop-blur-[1px]"
      style={{ left: pointer.x - offset.x, top: pointer.y - offset.y }}
    >
      <p className="text-sm font-medium leading-snug text-card-foreground">{card.title}</p>
      {card.description ? (
        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
          {card.description}
        </p>
      ) : null}
    </div>
  )
}

function AddColumnPanel({
  onAdd
}: {
  onAdd: (title: string) => void
}): JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  if (!isAdding) {
    return (
      <button
        className="flex h-16 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-card/70 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
        onClick={() => setIsAdding(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add column
      </button>
    )
  }

  return (
    <div className="h-fit w-72 shrink-0 rounded-xl border border-border bg-card p-3 shadow-card">
      <Input
        autoFocus
        className="h-9"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && title.trim()) {
            onAdd(title.trim())
            setTitle('')
            setIsAdding(false)
          }

          if (event.key === 'Escape') {
            setTitle('')
            setIsAdding(false)
          }
        }}
        placeholder="Column title"
        value={title}
      />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (!title.trim()) {
              return
            }
            onAdd(title.trim())
            setTitle('')
            setIsAdding(false)
          }}
        >
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setTitle('')
            setIsAdding(false)
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

function TaskCard({
  card,
  draggedTaskId,
  dragOverTaskPosition,
  editingDisabled,
  onDelete,
  onPointerDown,
  onEdit
}: {
  card: CardRecord
  draggedTaskId: string | null
  dragOverTaskPosition: 'before' | null
  editingDisabled: boolean
  onDelete: () => void
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onEdit: () => void
}): JSX.Element {
  return (
    <div
      data-task-card="true"
      data-task-card-id={card.id}
      onPointerDown={editingDisabled ? undefined : onPointerDown}
      className={cn(
        'group relative cursor-grab rounded-lg border border-border bg-card p-3 transition-all duration-150 active:cursor-grabbing',
        'hover:border-border/80 hover:shadow-card-hover shadow-card',
        draggedTaskId === card.id && 'opacity-50 shadow-card-drag'
      )}
    >
      {dragOverTaskPosition ? (
        <div
          className="absolute left-0 right-0 -top-1 z-10 h-0.5 rounded-full bg-primary"
        />
      ) : null}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>

      <div className="pl-3">
        <p className="text-sm font-medium leading-snug text-card-foreground">{card.title}</p>
        {card.description ? (
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        ) : null}
      </div>

      <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function CardEditor({
  card,
  onClose,
  onSave
}: {
  card: CardRecord
  onClose: () => void
  onSave: (draft: CardDraft) => void
}): JSX.Element {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Edit card</p>
            <h2 className="mt-2 text-xl font-semibold text-card-foreground">{card.title}</h2>
          </div>
          <Button variant="outline" onClick={onClose} type="button">
            Close
          </Button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({ title, description })
          }}
        >
          <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
          <Input
            className="mb-4 rounded-2xl px-4 py-3 text-sm"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />

          <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
          <textarea
            className="min-h-[180px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
