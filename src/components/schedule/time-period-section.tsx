'use client'

import type { Task, Tag } from '@/types'
import { TaskListItem } from './task-list-item'
import { PERIOD_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Sun, Sunset, Moon } from 'lucide-react'

interface TimePeriodSectionProps {
  period: 'morning' | 'afternoon' | 'evening'
  tasks: Task[]
  tags: Tag[]
  activeTaskId?: string | null
  focusTaskIds?: Set<string>
  onTaskClick: (task: Task) => void
}

const periodConfig = {
  morning: { icon: Sun, periodClass: 'p-morning' },
  afternoon: { icon: Sunset, periodClass: 'p-afternoon' },
  evening: { icon: Moon, periodClass: 'p-evening' },
} as const

export function TimePeriodSection({
  period,
  tasks,
  tags,
  activeTaskId,
  focusTaskIds,
  onTaskClick,
}: TimePeriodSectionProps) {
  const config = periodConfig[period]
  const Icon = config.icon

  if (tasks.length === 0) return null

  return (
    <section className={cn('period-rail pl-3', config.periodClass)}>
      <div className="mb-1.5 flex items-center gap-2 pl-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
          {PERIOD_LABELS[period]}
        </h3>
        <span className="text-micro tabular-nums text-muted-foreground">{tasks.length}</span>
        <span aria-hidden="true" className="period-dot ml-0.5 h-1 w-1 rounded-full opacity-70" />
      </div>
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            tags={tags}
            isActive={task.id === activeTaskId}
            isFocus={focusTaskIds?.has(task.id)}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </section>
  )
}
