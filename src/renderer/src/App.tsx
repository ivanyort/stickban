import { useEffect, useRef, useState } from 'react'
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
import type { CardDraft, CardRecord, ColumnRecord } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/utils'
import { useBoardStore } from './store'

function App(): JSX.Element {
  const {
    board,
    alwaysOnTop,
    isMaximized,
    platform,
    loading,
    saving,
    error,
    editingCard,
    initialize,
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
  const [boardTitle, setBoardTitle] = useState('My Board')
  const [editingBoardTitle, setEditingBoardTitle] = useState(false)
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const boardTitleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (board) {
      setBoardTitle(board.title)
    }
  }, [board])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-card-foreground shadow-card">
          Loading Stickban...
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-xl border border-destructive/20 bg-card p-6 shadow-card">
          <h1 className="text-lg font-semibold text-card-foreground">Stickban could not load the board</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? 'Unexpected application state.'}</p>
        </div>
      </div>
    )
  }

  const totalCards = board.columns.reduce((acc, column) => acc + column.cards.length, 0)

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

    const targetColumn = board.columns.find((column) => column.id === targetColumnId)
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <header
        className={cn(
          'flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4',
          platform === 'win32' && 'pr-[140px]'
        )}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="6" rx="1" />
                <rect x="3" y="15" width="7" height="6" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Stickban</span>
          </div>

          <div className="h-5 w-px bg-border" />

          {editingBoardTitle ? (
            <Input
              ref={boardTitleRef}
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              onBlur={() => setEditingBoardTitle(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') {
                  setEditingBoardTitle(false)
                }
              }}
              className="h-7 w-40 border-transparent bg-transparent px-1 text-sm font-medium shadow-none focus-visible:border-border focus-visible:bg-background"
              autoFocus
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            />
          ) : (
            <button
              onClick={() => {
                setEditingBoardTitle(true)
                window.setTimeout(() => boardTitleRef.current?.focus(), 0)
              }}
              className="rounded px-1 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              type="button"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              {boardTitle}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
        {board.columns
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((column) => (
            <BoardColumn
              addingDisabled={Boolean(editingCard)}
              column={column}
              dragOverColumn={dragOverColumn}
              draggedTaskId={draggedTask?.taskId ?? null}
              key={column.id}
              onAddCard={(draft) => void createCard(column.id, draft)}
              onDeleteCard={(cardId) => void deleteCard(cardId)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onEditCard={setEditingCard}
            />
          ))}
      </main>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {totalCards} tasks across {board.columns.length} columns
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

function BoardColumn({
  addingDisabled,
  column,
  dragOverColumn,
  draggedTaskId,
  onAddCard,
  onDeleteCard,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onEditCard
}: {
  addingDisabled: boolean
  column: ColumnRecord
  dragOverColumn: string | null
  draggedTaskId: string | null
  onAddCard: (draft: CardDraft) => void
  onDeleteCard: (cardId: string) => void
  onDragEnd: () => void
  onDragLeave: () => void
  onDragOver: (event: React.DragEvent, columnId: string) => void
  onDragStart: (taskId: string, columnId: string) => void
  onDrop: (event: React.DragEvent, targetColumnId: string) => void
  onEditCard: (card: CardRecord) => void
}): JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div
      onDragLeave={onDragLeave}
      onDragOver={(event) => onDragOver(event, column.id)}
      onDrop={(event) => onDrop(event, column.id)}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border border-border bg-column p-3 transition-all duration-200',
        dragOverColumn === column.id && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {column.cards.length}
          </span>
        </div>
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

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
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
