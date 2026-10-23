'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import type { Task, Tag } from '@/types'
import { todayStr, tomorrowStr } from '@/lib/utils/date'
import { TaskListItem } from './task-list-item'
import { AlertCircle, ChevronDown, ChevronRight, ArrowRight, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface OverdueSectionProps {
  tasks: Task[]
  tags: Tag[]
  activeTaskId?: string | null
  onTaskClick: (task: Task) => void
}

export function OverdueSection({ tasks, tags, activeTaskId, onTaskClick }: OverdueSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const { tasks: taskRepo } = useRepos()
  const queryClient = useQueryClient()
  const today = todayStr()

  const handleMoveToToday = async (task: Task) => {
    if (!user) return
    try {
      await taskRepo.update(user.id, task.id, { task_date: today } as Partial<Task>)
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
      toast.success('已移至今天')
    } catch {
      toast.error('操作失败')
    }
  }

  const handleMoveToTomorrow = async (task: Task) => {
    if (!user) return
    const target = tomorrowStr(today)
    try {
      await taskRepo.update(user.id, task.id, { task_date: target } as Partial<Task>)
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
      toast.success('已移至明天')
    } catch {
      toast.error('操作失败')
    }
  }

  if (tasks.length === 0) return null

  return (
    <section className="surface overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-4 py-3 text-left ui-transition hover:bg-surface-2"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <AlertCircle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="text-section">待处理延期</span>
        <span className="text-micro tabular-nums text-muted-foreground">{tasks.length}</span>
      </button>

      {!collapsed && (
        <div className="space-y-0.5 px-2 pb-2">
          {tasks.map((task) => (
            <div key={task.id}>
              <TaskListItem
                task={task}
                tags={tags}
                isActive={task.id === activeTaskId}
                onClick={() => onTaskClick(task)}
              />
              <div className="flex gap-1 pb-1 pl-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleMoveToToday(task)}
                >
                  <ArrowRight className="mr-0.5 h-3 w-3" aria-hidden="true" />
                  <span className="text-caption">今天</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleMoveToTomorrow(task)}
                >
                  <Calendar className="mr-0.5 h-3 w-3" aria-hidden="true" />
                  <span className="text-caption">明天</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
