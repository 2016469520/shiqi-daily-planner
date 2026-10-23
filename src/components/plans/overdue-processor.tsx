'use client'

import { useMemo } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { todayStr, tomorrowStr } from '@/lib/utils/date'
import { PERIOD_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react'
import type { Task } from '@/types'

interface OverdueProcessorProps {
  className?: string
}

export function OverdueProcessor({ className }: OverdueProcessorProps) {
  const { user } = useAuth()
  const { tasks } = useRepos()
  const queryClient = useQueryClient()
  const today = todayStr()

  const { data = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'overdue', today],
    queryFn: () => tasks.filter(user!.id, { overdue: true, maxResults: 200 }),
    enabled: !!user,
  })

  const overdueTasks = useMemo(
    () => data.filter((t) => !!t.task_date).sort((a, b) => a.task_date!.localeCompare(b.task_date!)),
    [data]
  )

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      tasks.update(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user!.id] })
    },
    onError: () => toast.error('操作失败'),
  })

  const handleRescheduleToday = async (task: Task) => {
    await updateMutation.mutateAsync({
      id: task.id,
      updates: { task_date: today },
    })
    toast.success(`「${task.title}」已移至今天`)
  }

  const handleRescheduleTomorrow = async (task: Task) => {
    const target = tomorrowStr(today)
    await updateMutation.mutateAsync({
      id: task.id,
      updates: { task_date: target },
    })
    toast.success(`「${task.title}」已移至明天`)
  }

  const handleMarkCancelled = async (task: Task) => {
    await updateMutation.mutateAsync({
      id: task.id,
      updates: { status: 'cancelled' },
    })
    toast.success(`「${task.title}」已取消`)
  }

  const handleBulkRescheduleToday = async () => {
    for (const task of overdueTasks) {
      await updateMutation.mutateAsync({
        id: task.id,
        updates: { task_date: today },
      })
    }
    toast.success(`已将 ${overdueTasks.length} 个事项移至今天`)
  }

  const handleBulkCancel = async () => {
    for (const task of overdueTasks) {
      await updateMutation.mutateAsync({
        id: task.id,
        updates: { status: 'cancelled' },
      })
    }
    toast.success(`已取消 ${overdueTasks.length} 个事项`)
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (overdueTasks.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          <h3 className="text-section">过期事项</h3>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-5 text-center">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-body text-muted-foreground">没有过期事项</p>
          <p className="text-caption text-muted-foreground/80">保持得很好，继续按计划推进</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
          <h3 className="text-section">过期事项</h3>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-micro tabular-nums text-destructive">
            {overdueTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-caption"
            onClick={handleBulkRescheduleToday}
            disabled={updateMutation.isPending}
          >
            全部移至今天
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-caption text-destructive hover:text-destructive"
            onClick={handleBulkCancel}
            disabled={updateMutation.isPending}
          >
            全部取消
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {overdueTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-2 ui-transition hover:border-destructive/35 hover:bg-destructive/10"
          >
            {/* Task info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-body font-medium">{task.title}</span>
                <span
                  className={cn(
                    'shrink-0 text-micro',
                    PRIORITY_COLORS[task.priority]
                  )}
                >
                  {task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : ''}
                </span>
              </div>
              <p className="text-caption tabular-nums text-muted-foreground">
                {task.task_date} · {PERIOD_LABELS[task.period]}
                {task.estimated_minutes && ` · ${task.estimated_minutes} 分钟`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-caption"
                onClick={() => handleRescheduleToday(task)}
                title="移至今天"
              >
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                今天
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-caption"
                onClick={() => handleRescheduleTomorrow(task)}
                title="移至明天"
              >
                <Calendar className="h-3 w-3" aria-hidden="true" />
                明天
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleMarkCancelled(task)}
                title="取消"
                aria-label="取消该过期事项"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
