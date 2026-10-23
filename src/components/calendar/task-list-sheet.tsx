'use client'

import { useMemo } from 'react'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { PERIOD_LABELS } from '@/lib/constants'
import { setTaskCompletion } from '@/lib/tasks/task-completion'
import { cn } from '@/lib/utils'
import type { Task, Period } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { CheckCircle2, Circle, Clock, Inbox } from 'lucide-react'

interface TaskListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  period: Period
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TaskListSheet({
  open,
  onOpenChange,
  date,
  period,
  tasks,
  onTaskClick,
}: TaskListSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { user } = useAuth()
  const repos = useRepos()
  const queryClient = useQueryClient()

  const dateDisplay = useMemo(() => {
    const d = new Date(date + 'T00:00:00')
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  }, [date])

  const toggleMutation = useMutation({
    mutationFn: async (task: Task) => setTaskCompletion(repos, user!.id, task, task.status !== 'done'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return a.order_index - b.order_index
    }),
    [tasks]
  )

  const content = (
    <div className="space-y-1.5 py-2">
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground/60" />
          <p className="text-body text-muted-foreground">暂无事项</p>
          <p className="text-caption text-muted-foreground/70">这一时段还没有安排</p>
        </div>
      )}
      {sorted.map((task) => (
        <div
          key={task.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            onOpenChange(false)
            // Small delay to let sheet close before opening detail
            setTimeout(() => onTaskClick?.(task), 150)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenChange(false)
              setTimeout(() => onTaskClick?.(task), 150)
            }
          }}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2.5 surface-interactive',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            task.status === 'done'
              ? 'bg-surface-2'
              : 'bg-card'
          )}
        >
          {/* Toggle complete button — separate from click */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMutation.mutate(task)
            }}
            className="shrink-0"
            title={task.status === 'done' ? '标记未完成' : '标记完成'}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.tag?.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: task.tag.color }}
                />
              )}
              <span
                className={cn(
                  'truncate text-body',
                  task.status === 'done' && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </span>
            </div>
            {task.start_time && (
              <div className="mt-0.5 flex items-center gap-1 text-caption tabular-nums text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.start_time}
                {task.end_time && ` - ${task.end_time}`}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const title = `${dateDisplay} — ${PERIOD_LABELS[period]}`
  const description = `共 ${tasks.length} 项，已完成 ${tasks.filter((t) => t.status === 'done').length} 项`

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <p className="text-caption text-muted-foreground">{description}</p>
        </DrawerHeader>
        <div className="px-4 pb-8">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
