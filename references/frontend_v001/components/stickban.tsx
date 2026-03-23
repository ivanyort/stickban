"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Pin, PinOff, Plus, GripVertical, MoreHorizontal, CloudOff, Pencil, Trash2, Minus, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

interface Board {
  id: string
  title: string
  columns: Column[]
}

const createDefaultColumns = (): Column[] => [
  { id: `col-${Date.now()}-1`, title: "To Do", tasks: [] },
  { id: `col-${Date.now()}-2`, title: "In Progress", tasks: [] },
  { id: `col-${Date.now()}-3`, title: "Done", tasks: [] },
]

const createInitialBoard = (): Board => ({
  id: "board-1",
  title: "My Board",
  columns: [
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
  ],
})

const STORAGE_KEY = "stickban-boards"

export function Stickban() {
  const [boards, setBoards] = useState<Board[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<{ taskId: string; columnId: string } | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  // Column management states
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<{ columnId: string; boardId: string } | null>(null)
  const [dragOverColumnPosition, setDragOverColumnPosition] = useState<{ columnId: string; position: "left" | "right" } | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null)
  
  const boardTitleRef = useRef<HTMLInputElement>(null)
  const columnTitleRef = useRef<HTMLInputElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.boards && parsed.boards.length > 0) {
          setBoards(parsed.boards)
          setActiveBoardId(parsed.activeBoardId || parsed.boards[0].id)
        } else {
          const initial = createInitialBoard()
          setBoards([initial])
          setActiveBoardId(initial.id)
        }
      } catch {
        const initial = createInitialBoard()
        setBoards([initial])
        setActiveBoardId(initial.id)
      }
    } else {
      const initial = createInitialBoard()
      setBoards([initial])
      setActiveBoardId(initial.id)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on changes
  useEffect(() => {
    if (isLoaded && boards.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoardId }))
    }
  }, [boards, activeBoardId, isLoaded])

  const activeBoard = boards.find((b) => b.id === activeBoardId)
  const columns = activeBoard?.columns || []

  const updateActiveBoard = useCallback(
    (updater: (board: Board) => Board) => {
      setBoards((prev) =>
        prev.map((b) => (b.id === activeBoardId ? updater(b) : b))
      )
    },
    [activeBoardId]
  )

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

  const addBoard = useCallback(() => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: `Board ${boards.length + 1}`,
      columns: createDefaultColumns(),
    }
    setBoards((prev) => [...prev, newBoard])
    setActiveBoardId(newBoard.id)
    setEditingBoardId(newBoard.id)
  }, [boards.length])

  const deleteBoard = useCallback(
    (boardId: string) => {
      if (boards.length <= 1) return
      const newBoards = boards.filter((b) => b.id !== boardId)
      setBoards(newBoards)
      if (activeBoardId === boardId) {
        setActiveBoardId(newBoards[0].id)
      }
    },
    [boards, activeBoardId]
  )

  const renameBoardTitle = useCallback(
    (boardId: string, newTitle: string) => {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, title: newTitle } : b))
      )
      setEditingBoardId(null)
    },
    []
  )

  // Column management functions
  const addColumn = useCallback(() => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: "New Column",
      tasks: [],
    }
    updateActiveBoard((board) => ({
      ...board,
      columns: [...board.columns, newColumn],
    }))
    setEditingColumnId(newColumn.id)
  }, [updateActiveBoard])

  const renameColumn = useCallback(
    (columnId: string, newTitle: string) => {
      updateActiveBoard((board) => ({
        ...board,
        columns: board.columns.map((col) =>
          col.id === columnId ? { ...col, title: newTitle || col.title } : col
        ),
      }))
      setEditingColumnId(null)
    },
    [updateActiveBoard]
  )

  const deleteColumn = useCallback(
    (columnId: string) => {
      updateActiveBoard((board) => ({
        ...board,
        columns: board.columns.filter((col) => col.id !== columnId),
      }))
    },
    [updateActiveBoard]
  )

  // Column drag handlers
  const handleColumnDragStart = (columnId: string, boardId: string) => {
    setDraggedColumn({ columnId, boardId })
  }

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (!draggedColumn) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.left + rect.width / 2
    const position = e.clientX < midpoint ? "left" : "right"
    
    setDragOverColumnPosition({ columnId, position })
  }

  const handleColumnDragLeave = () => {
    setDragOverColumnPosition(null)
  }

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string, targetBoardId: string) => {
    e.preventDefault()
    setDragOverColumnPosition(null)
    setDragOverBoardId(null)

    if (!draggedColumn) return

    const { columnId: sourceColumnId, boardId: sourceBoardId } = draggedColumn

    // Calculate drop position BEFORE calling setBoards (e.currentTarget becomes null in callbacks)
    const target = e.currentTarget as HTMLElement | null
    const rect = target?.getBoundingClientRect()
    const insertAfter = rect ? e.clientX >= rect.left + rect.width / 2 : false

    // Moving within same board
    if (sourceBoardId === targetBoardId) {
      if (sourceColumnId === targetColumnId) {
        setDraggedColumn(null)
        return
      }

      setBoards((prev) =>
        prev.map((board) => {
          if (board.id !== targetBoardId) return board

          const newColumns = [...board.columns]
          const sourceIndex = newColumns.findIndex((col) => col.id === sourceColumnId)
          const targetIndex = newColumns.findIndex((col) => col.id === targetColumnId)

          if (sourceIndex === -1 || targetIndex === -1) return board

          const [movedColumn] = newColumns.splice(sourceIndex, 1)
          
          let newTargetIndex = newColumns.findIndex((col) => col.id === targetColumnId)
          if (insertAfter) newTargetIndex += 1
          
          newColumns.splice(newTargetIndex, 0, movedColumn)

          return { ...board, columns: newColumns }
        })
      )
    } else {
      // Moving between boards
      setBoards((prev) => {
        let movedColumn: Column | null = null

        // Remove from source board
        const boardsWithRemoval = prev.map((board) => {
          if (board.id !== sourceBoardId) return board
          movedColumn = board.columns.find((col) => col.id === sourceColumnId) || null
          return {
            ...board,
            columns: board.columns.filter((col) => col.id !== sourceColumnId),
          }
        })

        if (!movedColumn) return prev

        // Add to target board
        return boardsWithRemoval.map((board) => {
          if (board.id !== targetBoardId) return board

          const newColumns = [...board.columns]
          const targetIndex = newColumns.findIndex((col) => col.id === targetColumnId)

          let insertIndex = targetIndex
          if (insertAfter) insertIndex += 1

          newColumns.splice(insertIndex, 0, movedColumn!)

          return { ...board, columns: newColumns }
        })
      })
    }

    setDraggedColumn(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumnPosition(null)
    setDragOverBoardId(null)
  }

  // Board tab drag handlers for column drops
  const handleBoardTabDragOver = (e: React.DragEvent, boardId: string) => {
    e.preventDefault()
    if (draggedColumn && boardId !== draggedColumn.boardId) {
      setDragOverBoardId(boardId)
    }
  }

  const handleBoardTabDragLeave = () => {
    setDragOverBoardId(null)
  }

  const handleBoardTabDrop = (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault()
    setDragOverBoardId(null)

    if (!draggedColumn || draggedColumn.boardId === targetBoardId) {
      setDraggedColumn(null)
      return
    }

    const { columnId: sourceColumnId, boardId: sourceBoardId } = draggedColumn

    setBoards((prev) => {
      let movedColumn: Column | null = null

      // Remove from source board
      const boardsWithRemoval = prev.map((board) => {
        if (board.id !== sourceBoardId) return board
        movedColumn = board.columns.find((col) => col.id === sourceColumnId) || null
        return {
          ...board,
          columns: board.columns.filter((col) => col.id !== sourceColumnId),
        }
      })

      if (!movedColumn) return prev

      // Add to target board at the end
      return boardsWithRemoval.map((board) => {
        if (board.id !== targetBoardId) return board
        return { ...board, columns: [...board.columns, movedColumn!] }
      })
    })

    setDraggedColumn(null)
    setActiveBoardId(targetBoardId)
  }

  // Task drag handlers
  const handleDragStart = (taskId: string, columnId: string) => {
    setDraggedTask({ taskId, columnId })
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedTask) {
      setDragOverColumn(columnId)
    }
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

    updateActiveBoard((board) => {
      const newColumns = board.columns.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }))

      const sourceColumn = newColumns.find((col) => col.id === sourceColumnId)
      const targetColumn = newColumns.find((col) => col.id === targetColumnId)

      if (!sourceColumn || !targetColumn) return board

      const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return board

      const [task] = sourceColumn.tasks.splice(taskIndex, 1)
      targetColumn.tasks.push(task)

      return { ...board, columns: newColumns }
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

    updateActiveBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      ),
    }))

    setNewTaskTitle("")
    setAddingToColumn(null)
  }

  const deleteTask = (columnId: string, taskId: string) => {
    updateActiveBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          : col
      ),
    }))
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

    updateActiveBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
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
      ),
    }))

    setEditingTask(null)
    setEditingTaskTitle("")
  }

  // Loading state or no boards yet
  if (!isLoaded || boards.length === 0 || !activeBoard) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  // Minimized dock view
  if (isMinimized) {
    const totalTasks = boards.reduce(
      (acc, board) => acc + board.columns.reduce((colAcc, col) => colAcc + col.tasks.length, 0),
      0
    )
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
              {totalTasks} tasks in {boards.length} board{boards.length > 1 ? "s" : ""}
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

          {/* Board Tabs */}
          <div className="flex items-center gap-1">
            {boards.map((board) => (
              <div key={board.id} className="group relative flex items-center">
                {editingBoardId === board.id ? (
                  <Input
                    ref={boardTitleRef}
                    defaultValue={board.title}
                    onBlur={(e) => renameBoardTitle(board.id, e.target.value || board.title)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameBoardTitle(board.id, e.currentTarget.value || board.title)
                      }
                      if (e.key === "Escape") {
                        setEditingBoardId(null)
                      }
                    }}
                    className="h-7 w-28 border-primary bg-background px-2 text-xs font-medium"
                    autoFocus
                  />
                ) : (
                  <div
                    onDragOver={(e) => handleBoardTabDragOver(e, board.id)}
                    onDragLeave={handleBoardTabDragLeave}
                    onDrop={(e) => handleBoardTabDrop(e, board.id)}
                    className={cn(
                      "relative flex h-8 items-center rounded-md transition-colors",
                      board.id === activeBoardId
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      dragOverBoardId === board.id && "ring-2 ring-primary ring-offset-1"
                    )}
                  >
                    <button
                      onClick={() => setActiveBoardId(board.id)}
                      className="flex h-full items-center px-3 text-xs font-medium"
                    >
                      <span className="max-w-24 truncate">{board.title}</span>
                    </button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex h-full items-center justify-center pr-2 transition-opacity",
                            board.id === activeBoardId
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20">
                            <MoreHorizontal className="h-3 w-3" />
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingBoardId(board.id)
                            setTimeout(() => boardTitleRef.current?.focus(), 0)
                          }}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Rename
                        </DropdownMenuItem>
                        {boards.length > 1 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteBoard(board.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}

            {/* Add Board Button */}
            <button
              onClick={addBoard}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="New board"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
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
            draggable={editingColumnId !== column.id}
            onDragStart={() => handleColumnDragStart(column.id, activeBoardId)}
            onDragOver={(e) => {
              if (draggedColumn) {
                handleColumnDragOver(e, column.id)
              } else if (draggedTask) {
                handleDragOver(e, column.id)
              }
            }}
            onDragLeave={() => {
              if (draggedColumn) {
                handleColumnDragLeave()
              } else {
                handleDragLeave()
              }
            }}
            onDrop={(e) => {
              if (draggedColumn) {
                handleColumnDrop(e, column.id, activeBoardId)
              } else {
                handleDrop(e, column.id)
              }
            }}
            onDragEnd={() => {
              if (draggedColumn) {
                handleColumnDragEnd()
              } else {
                handleDragEnd()
              }
            }}
            className={cn(
              "relative flex w-72 shrink-0 flex-col rounded-xl border border-border bg-column-bg p-3 transition-all duration-200",
              dragOverColumn === column.id && "border-primary/50 bg-primary/5 ring-2 ring-primary/20",
              draggedColumn?.columnId === column.id && "opacity-50",
              dragOverColumnPosition?.columnId === column.id && dragOverColumnPosition.position === "left" && "ml-4",
              dragOverColumnPosition?.columnId === column.id && dragOverColumnPosition.position === "right" && "mr-4"
            )}
          >
            {/* Drop indicator */}
            {dragOverColumnPosition?.columnId === column.id && (
              <div
                className={cn(
                  "absolute top-0 bottom-0 w-1 bg-primary rounded-full",
                  dragOverColumnPosition.position === "left" ? "-left-2.5" : "-right-2.5"
                )}
              />
            )}

            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Drag handle for column */}
                <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </div>
                
                {editingColumnId === column.id ? (
                  <Input
                    ref={columnTitleRef}
                    defaultValue={column.title}
                    onBlur={(e) => renameColumn(column.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameColumn(column.id, e.currentTarget.value)
                      }
                      if (e.key === "Escape") {
                        setEditingColumnId(null)
                      }
                    }}
                    className="h-6 flex-1 border-primary bg-background px-1.5 text-sm font-semibold"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingColumnId(column.id)
                      setTimeout(() => columnTitleRef.current?.focus(), 0)
                    }}
                    className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                    title="Click to rename"
                  >
                    {column.title}
                  </button>
                )}
                
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                  {column.tasks.length}
                </span>
              </div>
              
              <div className="flex items-center gap-0.5">
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
                
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingColumnId(column.id)
                        setTimeout(() => columnTitleRef.current?.focus(), 0)
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteColumn(column.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                  onDragStart={(e) => {
                    e.stopPropagation()
                    handleDragStart(task.id, column.id)
                  }}
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

        {/* Add Column Button */}
        <button
          onClick={addColumn}
          className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-transparent p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/30 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add column
        </button>
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
