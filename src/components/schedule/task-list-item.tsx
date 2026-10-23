'use client'

import { cn } from '@/lib/utils'
import { PERIOD_LABELS, PRIORITY_LABELS } from '@/lib/constants'
import type { Task, Tag } from '@/types'
import { useRepos } from '@/providers/repo-provider'
import { setTaskCompletion } from '@/lib/tasks/task-completion'
import { useAuth } from '@/providers/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  AlertCircle,
  Repeat,
  Bell,
  ListChecks,
  Check,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { PERIOD_CLASS } from '@/lib/period-style'

interface TaskListItemProps {
  task: Task
  tags: Tag[]
  isActive?: boolean
  isFocus?: boolean
  onClick: () => void
}
export function TaskListItem({ task, tags, isActive, isFocus, onClick }: TaskListItemProps) {
  const { user } = useAuth()
  const repos = useRepos()
  const queryClient = useQueryClient()
  const [toggling, setToggling] = useState(false)

  const isDone = task.status === 'done'
  const tag = tags.find((t) => t.id === task.tag_id)
  const doneSubitems = task.subitems?.filter((s) => s.is_completed).length ?? 0
  const totalSubitems = task.subitems?.length ?? 0

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || toggling) return
    setToggling(true)
    try {
      const nextDone = !isDone
      const { spawned } = await setTaskCompletion(repos, user.id, task, nextDone)
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
      if (nextDone) {
        toast.success(spawned ? '已完成，下一次已排好' : '已完成', { duration: 1500 })
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      data-testid="task-list-item"
      data-task-id={task.id}
      onClick={onClick}
      className={cn(
        'group surface-interactive flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-2',
        'hover:border-border hover:bg-surface-2',
        isActive && 'border-primary/30 bg-primary/[0.05]',
        isFocus && 'border-warning/25 bg-warning/[0.06]',
        isDone && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        data-testid="task-toggle-complete"
        onClick={handleToggle}
        disabled={toggling}
        aria-label={isDone ? '标记为未完成' : '标记为已完成'}
        className={cn(
          'relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ui-transition',
          'after:absolute after:-inset-1.5 after:content-[""]',
          isDone
            ? 'border-success bg-success text-background'
            : 'border-border-strong group-hover:border-success/60 hover:border-success/60'
        )}
      >
        {toggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isDone ? (
          <Check className="h-3 w-3" />
        ) : null}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        {/* Title */}
        <div
          className={
            isDone
              ? 'text-body font-medium text-muted-foreground line-through'
              : 'text-body font-medium'
          }
        >
          {task.title}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
          {/* Tag */}
          {tag && (
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          )}

          {/* Time */}
          {task.start_time && (
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {task.start_time}
              {task.end_time && ` - ${task.end_time}`}
            </span>
          )}

          {/* Estimated time */}
          {task.estimated_minutes != null && !task.start_time && (
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {task.estimated_minutes}分钟
            </span>
          )}

          {/* Priority (only high/urgent shown in list) */}
          {(task.priority === 'high' || task.priority === 'urgent') && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                task.priority === 'urgent' ? 'text-destructive' : 'text-warning'
              )}
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
        </div>

        {/* Indicators row */}
        {(task.recurrence_rule || task.reminder_at || totalSubitems > 0) && (
          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            {task.recurrence_rule && <Repeat className="h-3 w-3" aria-label="重复" />}
            {task.reminder_at && <Bell className="h-3 w-3" aria-label="提醒" />}
            {totalSubitems > 0 && (
              <span className="inline-flex items-center gap-0.5 tabular-nums">
                <ListChecks className="h-3 w-3" aria-hidden="true" />
                {doneSubitems}/{totalSubitems}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: period badge（无日期的事项不显示时段） */}
      {task.task_date && (
        <div className="shrink-0 pt-0.5">
          <span
            className={cn(
              'period-chip whitespace-nowrap rounded-full px-2 py-0.5 text-micro',
              PERIOD_CLASS[task.period]
            )}
          >
            {PERIOD_LABELS[task.period]}
          </span>
        </div>
      )}
    </div>
  )
}
