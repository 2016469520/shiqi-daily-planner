'use client'

import { type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import type { Task, Period } from '@/types'

// ---------- Sortable Task Item ----------

interface SortableTaskItemProps {
  task: Task
  children: (props: {
    dragHandle: ReactNode
    isDragging: boolean
  }) => ReactNode
}

export function SortableTaskItem({ task, children }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const dragHandle = (
    <button
      className="flex h-full w-5 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
      tabIndex={-1}
      aria-label={`拖拽排序: ${task.title}`}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandle, isDragging })}
    </div>
  )
}

// ---------- Period Drop Zone ----------

interface PeriodDropZoneProps {
  period: Period
  taskIds: string[]
  children: ReactNode
  isOver?: boolean
  className?: string
}

export function PeriodDropZone({
  period,
  taskIds,
  children,
  isOver,
  className,
}: PeriodDropZoneProps) {
  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <div
        data-droppable-period={period}
        className={cn(
          'rounded-lg transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-primary/25'
        )}
      >
        <div className={cn('space-y-1.5', className)}>
          {children}
        </div>
      </div>
    </SortableContext>
  )
}

// ---------- DnD Context Wrapper ----------

interface TaskDragContextProps {
  children: ReactNode
  onDragEnd: (event: DragEndEvent) => void
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
}

export function TaskDragContext({
  children,
  onDragEnd,
  onDragStart,
  onDragOver,
}: TaskDragContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {children}
    </DndContext>
  )
}

// ---------- Drag Overlay Content ----------

export function TaskDragOverlay({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        'surface acg-shadow flex items-center gap-2.5 px-3 py-2.5',
        task.status === 'done' ? 'opacity-70' : ''
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={cn(
        'truncate text-body font-medium',
        task.status === 'done' && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </span>
    </div>
  )
}
