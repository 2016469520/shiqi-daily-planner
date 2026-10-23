'use client'

import type { Task, Tag } from '@/types'
import { TaskListItem } from './task-list-item'
import { Star } from 'lucide-react'

interface TodayFocusProps {
  tasks: Task[]
  tags: Tag[]
  activeTaskId?: string | null
  onTaskClick: (task: Task) => void
}

/**
 * Today Focus: shows up to 3 urgent or high-priority tasks
 * derived from task priority (urgent > high).
 */
export function TodayFocus({ tasks, tags, activeTaskId, onTaskClick }: TodayFocusProps) {
  // Derive focus tasks from priority
  const focusTasks = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => {
      const p = { urgent: 4, high: 3, normal: 2, low: 1 }
      return (p[b.priority] || 0) - (p[a.priority] || 0)
    })
    .slice(0, 3)
    .filter((t) => t.priority === 'urgent' || t.priority === 'high')

  if (focusTasks.length === 0) return null

  return (
    <section className="surface p-4">
      <div className="mb-2 flex items-center gap-2 px-2">
        <Star className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <h3 className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
          今日焦点
        </h3>
        <span className="text-micro tabular-nums text-muted-foreground">
          {focusTasks.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {focusTasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            tags={tags}
            isActive={task.id === activeTaskId}
            isFocus
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </section>
  )
}
