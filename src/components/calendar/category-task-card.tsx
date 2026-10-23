'use client'

import { cn } from '@/lib/utils'
import { formatDisplayDate, formatWeekday, todayStr } from '@/lib/utils/date'
import { PERIOD_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { MoveToCategoryMenu } from './move-to-category-menu'
import type { Task } from '@/types'
import { Clock, AlertCircle, Repeat, Bell, ListChecks } from 'lucide-react'
import { PERIOD_CLASS } from '@/lib/period-style'
interface CategoryTaskCardProps {
  task: Task
  onClick: (task: Task) => void
  showMoveMenu?: boolean
}

export function CategoryTaskCard({ task, onClick, showMoveMenu = false }: CategoryTaskCardProps) {
  const isDone = task.status === 'done'
  const isOverdue =
    task.status !== 'done' &&
    task.status !== 'cancelled' &&
    !!task.task_date &&
    task.task_date < todayStr()

  const doneSubitems = task.subitems?.filter((s) => s.is_completed).length ?? 0
  const totalSubitems = task.subitems?.length ?? 0

  return (
    <button
      onClick={() => onClick(task)}
      className={cn(
        'surface w-full p-3 text-left surface-interactive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDone && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Tag color strip */}
        {task.tag?.color && (
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: task.tag.color }}
          />
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Title + status */}
          <div className="flex items-start gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-body font-medium text-foreground',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
            <span
              className={cn(
                'shrink-0 rounded-sm px-1.5 py-0.5 text-micro font-medium',
                task.status === 'done' &&
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                task.status === 'in_progress' &&
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                task.status === 'todo' && 'bg-muted text-muted-foreground'
              )}
            >
              {task.status === 'todo' ? '待办' : task.status === 'in_progress' ? '进行中' : '完成'}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
            {task.task_date && (
              <span className="tabular-nums">
                {formatDisplayDate(task.task_date)}{' '}
                {formatWeekday(task.task_date)}
              </span>
            )}
            {task.period && (
              <span
                className={cn(
                  PERIOD_CLASS[task.period],
                  'period-chip rounded-full px-1.5 py-0 text-micro'
                )}
              >
                {PERIOD_LABELS[task.period]}
              </span>
            )}
            {task.estimated_minutes != null && (
              <span className="inline-flex items-center gap-0.5 tabular-nums">
                <Clock className="h-3 w-3" />
                {task.estimated_minutes}分钟
              </span>
            )}
          </div>

          {/* Indicators row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro">
            {/* Priority */}
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                PRIORITY_COLORS[task.priority]
              )}
            >
              <AlertCircle className="h-3 w-3" />
              {PRIORITY_LABELS[task.priority]}
            </span>

            {/* Overdue indicator */}
            {isOverdue && (
              <span className="font-medium text-red-500">已延期</span>
            )}

            {/* Recurrence */}
            {task.recurrence_rule && (
              <Repeat className="h-3 w-3 text-muted-foreground" />
            )}

            {/* Reminder */}
            {task.reminder_at && (
              <Bell className="h-3 w-3 text-muted-foreground" />
            )}

            {/* Subtask progress */}
            {totalSubitems > 0 && (
              <span className="inline-flex items-center gap-0.5 tabular-nums text-muted-foreground">
                <ListChecks className="h-3 w-3" />
                {doneSubitems}/{totalSubitems}
              </span>
            )}
          </div>

          {/* Move to category (mobile-friendly) */}
          {showMoveMenu && !isDone && (
            <div className="mt-1">
              <MoveToCategoryMenu task={task} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
