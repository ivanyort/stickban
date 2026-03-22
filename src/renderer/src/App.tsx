import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BoardRecord, CardDraft, CardRecord, ColumnRecord } from '@shared/types'
import { useBoardStore } from './store'

function App(): JSX.Element {
  const { board, alwaysOnTop, loading, saving, error, editingCard, initialize, createCard, updateCard, moveCard, setEditingCard, toggleAlwaysOnTop } =
    useBoardStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-board text-ink">
        <div className="rounded-3xl bg-surface px-6 py-4 text-sm font-medium shadow-card">
          Loading Stickban...
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-board p-6 text-ink">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-card">
          <h1 className="text-lg font-semibold">Stickban could not load the board</h1>
          <p className="mt-2 text-sm text-slate-600">{error ?? 'Unexpected application state.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_32%),linear-gradient(180deg,_#eef2ff_0%,_#f8fafc_100%)] text-ink">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-600">Stickban</p>
            <h1 className="mt-1 text-2xl font-semibold">{board.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Local-first board with SQLite persistence, drag and drop, and zero remote dependencies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {saving ? 'Saving changes...' : 'Local-only MVP'}
            </span>
            <button
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                alwaysOnTop
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
              onClick={() => void toggleAlwaysOnTop()}
              type="button"
            >
              {alwaysOnTop ? 'Always on top: on' : 'Always on top: off'}
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-auto mt-4 max-w-[1500px] px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={(event) => {
          const source = getDragLocation(board, event.active.id.toString())
          const target = getOverLocation(board, event.over?.id?.toString() ?? null)

          if (!source || !target) {
            return
          }

          const targetIndex =
            source.columnId === target.columnId
              ? normalizeSameColumnIndex(board, source.columnId, source.cardId, target.index)
              : target.index

          void moveCard(source.cardId, target.columnId, targetIndex)
        }}
        sensors={sensors}
      >
        <main className="mx-auto flex max-w-[1500px] gap-5 overflow-x-auto px-6 py-6">
          {board.columns
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <BoardColumn
                column={column}
                key={column.id}
                onAddCard={(draft) => void createCard(column.id, draft)}
                onEditCard={setEditingCard}
              />
            ))}
        </main>
      </DndContext>

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
  column,
  onAddCard,
  onEditCard
}: {
  column: ColumnRecord
  onAddCard: (draft: CardDraft) => void
  onEditCard: (card: CardRecord) => void
}): JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <section className="flex min-w-[320px] max-w-[320px] flex-col">
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-card backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">{column.title}</h2>
            <p className="text-xs text-slate-500">{column.cards.length} cards</p>
          </div>
          <button
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => setIsAdding((value) => !value)}
            type="button"
          >
            {isAdding ? 'Cancel' : 'Add card'}
          </button>
        </div>

        {isAdding ? (
          <form
            className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!title.trim()) {
                return
              }

              onAddCard({ title, description })
              setTitle('')
              setDescription('')
              setIsAdding(false)
            }}
          >
            <input
              className="mb-2 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-400"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Card title"
              value={title}
            />
            <textarea
              className="min-h-[88px] w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              value={description}
            />
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                type="submit"
              >
                Save card
              </button>
            </div>
          </form>
        ) : null}

        <div
          className={`min-h-[240px] rounded-2xl border border-dashed p-2 transition ${
            isOver ? 'border-blue-400 bg-blue-50/60' : 'border-transparent'
          }`}
          ref={setNodeRef}
        >
          <SortableContext
            items={column.cards.map((card) => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {column.cards.map((card) => (
                <SortableCard
                  card={card}
                  key={card.id}
                  onEdit={() => onEditCard(card)}
                />
              ))}
            </div>
          </SortableContext>

          {column.cards.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              Drop a card here or create a new one.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function SortableCard({
  card,
  onEdit
}: {
  card: CardRecord
  onEdit: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <article
      className={`cursor-grab rounded-2xl border border-white bg-surface p-4 shadow-card transition hover:-translate-y-0.5 ${
        isDragging ? 'opacity-70' : ''
      }`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
          <p className="mt-2 line-clamp-4 text-sm text-slate-600">
            {card.description || 'No description yet.'}
          </p>
        </div>
        <button
          className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          type="button"
        >
          Edit
        </button>
      </div>
    </article>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Edit card</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{card.title}</h2>
          </div>
          <button
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({ title, description })
          }}
        >
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <input
            className="mb-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="min-h-[180px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />

          <div className="mt-5 flex justify-end gap-3">
            <button
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              type="submit"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getDragLocation(board: BoardRecord, activeId: string): { cardId: string; columnId: string } | null {
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === activeId)
    if (card) {
      return { cardId: card.id, columnId: column.id }
    }
  }

  return null
}

function getOverLocation(
  board: BoardRecord,
  overId: string | null
): { columnId: string; index: number } | null {
  if (!overId) {
    return null
  }

  const directColumn = board.columns.find((column) => column.id === overId)
  if (directColumn) {
    return { columnId: directColumn.id, index: directColumn.cards.length }
  }

  for (const column of board.columns) {
    const index = column.cards.findIndex((item) => item.id === overId)
    if (index !== -1) {
      return { columnId: column.id, index }
    }
  }

  return null
}

function normalizeSameColumnIndex(
  board: BoardRecord,
  columnId: string,
  cardId: string,
  targetIndex: number
): number {
  const column = board.columns.find((item) => item.id === columnId)
  if (!column) {
    return targetIndex
  }

  const fromIndex = column.cards.findIndex((item) => item.id === cardId)
  if (fromIndex === -1) {
    return targetIndex
  }

  const reordered = arrayMove(column.cards, fromIndex, targetIndex)
  return reordered.findIndex((item) => item.id === cardId)
}

export default App
