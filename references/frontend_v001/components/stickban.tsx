"use client"

import { useState, useRef, useCallback } from "react"
import { Pin, PinOff, Plus, GripVertical, MoreHorizontal, CloudOff, Pencil, Trash2, Minus, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  note?: string
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

const initialColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    tasks: [
      { id: "1", title: "Review Q2 roadmap", note: "Check with product team" },
      { id: "2", title: "Update dependencies" },
      { id: "3", title: "Design system audit", note: "Focus on spacing tokens" },
    ],
  },
  {
    id: "progress",
    title: "In Progress",
    tasks: [
      { id: "4", title: "Build Stickban UI", note: "Desktop-first approach" },
      { id: "5", title: "API integration" },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      { id: "6", title: "Project kickoff" },
      { id: "7", title: "Initial wireframes", note: "Approved by stakeholders" },
    ],
  },
]

export function Stickban() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [boardTitle, setBoardTitle] = useState("My Board")
  const [editingBoardTitle, setEditingBoardTitle] = useState(false)
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const boardTitleRef = useRef<HTMLInputElement>(null)

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const handleMaximize = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsMaximized(true)
    } else {
      document.exitFullscreen()
      setIsMaximized(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    setShowExitConfirm(true)
  }, [])

  const handleDragStart = (taskId: string, columnId: string) => {
    setDraggedTask({ taskId, columnId })
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask) return

    const { taskId, columnId: sourceColumnId } = draggedTask

    if (sourceColumnId === targetColumnId) {
      setDraggedTask(null)
      return
    }

    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }))

      const sourceColumn = newColumns.find((col) => col.id === sourceColumnId)
      const targetColumn = newColumns.find((col) => col.id === targetColumnId)

      if (!sourceColumn || !targetColumn) return prev

      const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return prev

      const [task] = sourceColumn.tasks.splice(taskIndex, 1)
      targetColumn.tasks.push(task)

      return newColumns
    })

    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
    }

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    )

    setNewTaskTitle("")
    setAddingToColumn(null)
  }

  const deleteTask = (columnId: string, taskId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          : col
      )
    )
  }

  const startEditingTask = (columnId: string, taskId: string, currentTitle: string) => {
    setEditingTask({ taskId, columnId })
    setEditingTaskTitle(currentTitle)
  }

  const saveTaskEdit = () => {
    if (!editingTask || !editingTaskTitle.trim()) {
      setEditingTask(null)
      return
    }

    setColumns((prev) =>
      prev.map((col) =>
        col.id === editingTask.columnId
          ? {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === editingTask.taskId
                  ? { ...t, title: editingTaskTitle.trim() }
                  : t
              ),
            }
          : col
      )
    )

    setEditingTask(null)
    setEditingTaskTitle("")
  }

  // Minimized dock view
  if (isMinimized) {
    return (
      <div className="flex h-screen items-end justify-center bg-background/50 p-8">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-primary-foreground"
              strokeWidth="2"
              stroke="currentColor"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="6" rx="1" />
              <rect x="3" y="15" width="7" height="6" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Stickban</p>
            <p className="text-xs text-muted-foreground">
              {columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks
            </p>
          </div>
          <div className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Click to restore
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">Exit Stickban?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your tasks are saved locally and will be here when you return.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => window.close()}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* App Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          {/* App Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-primary-foreground"
                strokeWidth="2"
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="6" rx="1" />
                <rect x="3" y="15" width="7" height="6" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Stickban
            </span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-border" />

          {/* Board Title */}
          {editingBoardTitle ? (
            <Input
              ref={boardTitleRef}
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={() => setEditingBoardTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingBoardTitle(false)
                if (e.key === "Escape") setEditingBoardTitle(false)
              }}
              className="h-7 w-40 border-transparent bg-transparent px-1 text-sm font-medium focus:border-border focus:bg-background"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setEditingBoardTitle(true)
                setTimeout(() => boardTitleRef.current?.focus(), 0)
              }}
              className="rounded px-1 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {boardTitle}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Offline Status */}
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <CloudOff className="h-3 w-3" />
            <span>Local</span>
          </div>

          {/* Always on Top Toggle */}
          <Button
            variant={alwaysOnTop ? "default" : "ghost"}
            size="sm"
            onClick={() => setAlwaysOnTop(!alwaysOnTop)}
            className={cn(
              "gap-1.5 text-xs",
              alwaysOnTop && "bg-primary text-primary-foreground hover:bg-primary/90"
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

          {/* Divider */}
          <div className="h-5 w-px bg-border" />

          {/* Window Controls (Windows Style) */}
          <div className="flex items-center">
            <button
              onClick={handleMinimize}
              className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <main className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-column-bg p-3 transition-all duration-200",
              dragOverColumn === column.id && "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
            )}
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                  {column.tasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAddingToColumn(column.id)
                  setNewTaskTitle("")
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tasks */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {column.tasks.length === 0 && !addingToColumn && (
                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 py-8 text-center">
                  <p className="text-xs text-muted-foreground">No tasks yet</p>
                  <button
                    onClick={() => {
                      setAddingToColumn(column.id)
                      setNewTaskTitle("")
                    }}
                    className="mt-1 text-xs font-medium text-primary hover:underline"
                  >
                    Add your first task
                  </button>
                </div>
              )}

              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable={editingTask?.taskId !== task.id}
                  onDragStart={() => handleDragStart(task.id, column.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group relative cursor-grab rounded-lg border border-border bg-card p-3 transition-all duration-150 active:cursor-grabbing",
                    "hover:border-border/80 hover:shadow-[var(--card-shadow-hover)]",
                    "[box-shadow:var(--card-shadow)]",
                    draggedTask?.taskId === task.id &&
                      "opacity-50 shadow-[var(--card-shadow-drag)]"
                  )}
                >
                  {/* Drag Handle */}
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  </div>

                  <div className="pl-3">
                    {editingTask?.taskId === task.id ? (
                      <Input
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={saveTaskEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTaskEdit()
                          if (e.key === "Escape") {
                            setEditingTask(null)
                            setEditingTaskTitle("")
                          }
                        }}
                        className="h-auto border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm font-medium leading-snug text-card-foreground">
                        {task.title}
                      </p>
                    )}
                    {task.note && !editingTask?.taskId && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {task.note}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => startEditingTask(column.id, task.id, task.title)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTask(column.id, task.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Quick Add Card */}
              {addingToColumn === column.id && (
                <div className="rounded-lg border border-primary/30 bg-card p-3 shadow-[var(--card-shadow)]">
                  <Input
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask(column.id)
                      if (e.key === "Escape") {
                        setAddingToColumn(null)
                        setNewTaskTitle("")
                      }
                    }}
                    className="mb-2 h-8 border-0 bg-transparent p-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => addTask(column.id)}
                      className="h-7 px-3 text-xs"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingToColumn(null)
                        setNewTaskTitle("")
                      }}
                      className="h-7 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Card Button (at bottom) */}
            {addingToColumn !== column.id && column.tasks.length > 0 && (
              <button
                onClick={() => {
                  setAddingToColumn(column.id)
                  setNewTaskTitle("")
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add card
              </button>
            )}
          </div>
        ))}
      </main>

      {/* Status Bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks across{" "}
            {columns.length} columns
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>All changes saved locally</span>
        </div>
      </footer>
    </div>
  )
}
