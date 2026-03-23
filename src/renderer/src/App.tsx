import { useEffect, useMemo, useState } from 'react'
import {
  CloudOff,
  GripVertical,
  Minus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Square,
  Trash2,
  X
} from 'lucide-react'
import type { BoardSummary, CardDraft, CardRecord, ColumnRecord } from '@shared/types'
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
    loading,
    saving,
    error,
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
    closeWindow
  } = useBoardStore()
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingBoardTitle, setEditingBoardTitle] = useState('')
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<{ columnId: string; boardId: string } | null>(null)
  const [dragOverColumnPosition, setDragOverColumnPosition] = useState<{
    columnId: string
    position: 'left' | 'right'
  } | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (editingBoardId && !boards.some((board) => board.id === editingBoardId)) {
      setEditingBoardId(null)
      setEditingBoardTitle('')
    }
  }, [boards, editingBoardId])

  const orderedColumns = useMemo(
    () => activeBoard?.columns.slice().sort((a, b) => a.position - b.position) ?? [],
    [activeBoard]
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

  const handleDragStart = (taskId: string, columnId: string): void => {
    setDraggedTask({ taskId, columnId })
  }

  const handleDragOver = (event: React.DragEvent, columnId: string): void => {
    event.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (): void => {
    setDragOverColumn(null)
  }

  const handleDrop = (event: React.DragEvent, targetColumnId: string): void => {
    event.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || draggedTask.columnId === targetColumnId) {
      setDraggedTask(null)
      return
    }

    const targetColumn = orderedColumns.find((column) => column.id === targetColumnId)
    if (!targetColumn) {
      setDraggedTask(null)
      return
    }

    void moveCard(draggedTask.taskId, targetColumnId, targetColumn.cards.length)
    setDraggedTask(null)
  }

  const handleDragEnd = (): void => {
    setDraggedTask(null)
    setDragOverColumn(null)
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
    const targetIndex = orderedColumns.findIndex((column) => column.id === targetColumnId)

    if (targetIndex === -1) {
      setDraggedColumn(null)
      return
    }

    const nextIndex = targetIndex + (insertAfter ? 1 : 0)
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
      <header
        className={cn(
          'flex h-14 shrink-0 items-center justify-between gap-4 bg-card px-4',
          platform !== 'win32' && 'border-b border-border',
          platform === 'win32' && 'pr-[140px]'
        )}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <StickbanMark />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Stickban</span>
          </div>

          <div className="h-5 w-px shrink-0 bg-border" />

          <div
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
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
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <CloudOff className="h-3 w-3" />
            <span>Local</span>
          </div>

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
            key={column.id}
            onAddCard={(draft) => void createCard(column.id, draft)}
            onColumnDragEnd={handleColumnDragEnd}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragStart={handleColumnDragStart}
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
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onEditCard={setEditingCard}
            onRenameColumn={(columnId, draft) => void updateColumn(columnId, { title: draft })}
          />
        ))}

        <AddColumnPanel onAdd={(title) => void createColumn(activeBoard.id, { title })} />
      </main>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {totalCards} tasks across {orderedColumns.length} columns
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('h-1.5 w-1.5 rounded-full', saving ? 'bg-amber-500' : 'bg-emerald-500')} />
          <span>{saving ? 'Saving changes locally' : 'All changes saved locally'}</span>
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
  onAddCard,
  onColumnDragEnd,
  onColumnDragLeave,
  onColumnDragOver,
  onColumnDragStart,
  onColumnDrop,
  onDeleteCard,
  onDeleteColumn,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
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
  onAddCard: (draft: CardDraft) => void
  onColumnDragEnd: () => void
  onColumnDragLeave: () => void
  onColumnDragOver: (event: React.DragEvent, columnId: string) => void
  onColumnDragStart: (columnId: string, boardId: string) => void
  onColumnDrop: (event: React.DragEvent, targetColumnId: string, targetBoardId: string) => void
  onDeleteCard: (cardId: string) => void
  onDeleteColumn: (column: ColumnRecord) => void
  onDragEnd: () => void
  onDragLeave: () => void
  onDragOver: (event: React.DragEvent, columnId: string) => void
  onDragStart: (taskId: string, columnId: string) => void
  onDrop: (event: React.DragEvent, targetColumnId: string) => void
  onEditCard: (card: CardRecord) => void
  onRenameColumn: (columnId: string, title: string) => void
}): JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isEditingColumn, setIsEditingColumn] = useState(false)
  const [columnTitle, setColumnTitle] = useState(column.title)

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

  return (
    <div
      draggable
      onDragEnd={onColumnDragEnd}
      onDragLeave={onColumnDragLeave}
      onDragOver={(event) => onColumnDragOver(event, column.id)}
      onDragStart={() => onColumnDragStart(column.id, boardId)}
      onDrop={(event) => onColumnDrop(event, column.id, boardId)}
      className={cn(
        'relative flex w-72 shrink-0 flex-col rounded-xl border border-border bg-column p-3 transition-all duration-200',
        dragOverColumn === column.id && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20',
        draggedColumnId === column.id && 'opacity-60'
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

      <div className="mb-3 flex items-center justify-between gap-2">
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
        className="flex flex-1 flex-col gap-2 overflow-y-auto"
        onDragLeave={onDragLeave}
        onDragOver={(event) => onDragOver(event, column.id)}
        onDrop={(event) => onDrop(event, column.id)}
      >
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
            editingDisabled={addingDisabled}
            key={card.id}
            onDelete={() => onDeleteCard(card.id)}
            onDragEnd={onDragEnd}
            onDragStart={() => onDragStart(card.id, column.id)}
            onEdit={() => onEditCard(card)}
          />
        ))}

        {isAdding ? (
          <div className="rounded-lg border border-primary/30 bg-card p-3 shadow-card">
            <Input
              autoFocus
              placeholder="Task title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mb-2 h-8 border-0 bg-transparent p-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
            <textarea
              className="min-h-[72px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              value={description}
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!title.trim()) {
                    return
                  }
                  onAddCard({ title, description })
                  setTitle('')
                  setDescription('')
                  setIsAdding(false)
                }}
              >
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
  editingDisabled,
  onDelete,
  onDragEnd,
  onDragStart,
  onEdit
}: {
  card: CardRecord
  draggedTaskId: string | null
  editingDisabled: boolean
  onDelete: () => void
  onDragEnd: () => void
  onDragStart: () => void
  onEdit: () => void
}): JSX.Element {
  return (
    <div
      draggable={!editingDisabled}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      className={cn(
        'group relative cursor-grab rounded-lg border border-border bg-card p-3 transition-all duration-150 active:cursor-grabbing',
        'hover:border-border/80 hover:shadow-card-hover shadow-card',
        draggedTaskId === card.id && 'opacity-50 shadow-card-drag'
      )}
    >
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
