'use client'

import { useMemo } from 'react'
import type { Task, Tag } from '@/types'
import { TaskListItem } from './task-list-item'
import { todayStr, toDateStr } from '@/lib/utils/date'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpcomingTasksProps {
  tasks: Task[]
  tags: Tag[]
  activeTaskId?: string | null
  onTaskClick: (task: Task) => void
  maxPreview?: number
}

interface UpcomingGroup {
  label: string
  tasks: Task[]
}

export function UpcomingTasks({
  tasks,
  tags,
  activeTaskId,
  onTaskClick,
  maxPreview = 3,
}: UpcomingTasksProps) {
  const today = todayStr()

  const groups = useMemo((): UpcomingGroup[] => {
    const future = tasks
      .filter((t) => t.task_date && t.task_date > today && t.status !== 'cancelled')
      .sort((a, b) => a.task_date!.localeCompare(b.task_date!))

    const tomorrow = todayPlusDays(1)
    const nextWeek = todayPlusDays(7)

    const tomorrowTasks = future.filter((t) => t.task_date === tomorrow)
    const weekTasks = future.filter((t) => t.task_date! > tomorrow && t.task_date! <= nextWeek)
    const laterTasks = future.filter((t) => t.task_date! > nextWeek)

    const result: UpcomingGroup[] = []
    if (tomorrowTasks.length > 0) result.push({ label: '明天', tasks: tomorrowTasks })
    if (weekTasks.length > 0) result.push({ label: '未来 7 天', tasks: weekTasks })
    if (laterTasks.length > 0) result.push({ label: '更晚', tasks: laterTasks })
    return result
  }, [tasks, today])

  if (groups.length === 0) return null

  return (
    <section className="space-y-3">
      <h3 className="px-2 text-micro font-medium uppercase tracking-wider text-muted-foreground">
        接下来
      </h3>
      {groups.map((group) => (
        <div key={group.label} className="space-y-0.5">
          <div className="flex items-center gap-2 px-2 pb-0.5">
            <span className="text-caption text-muted-foreground">{group.label}</span>
            <span className="text-micro tabular-nums text-muted-foreground">
              {group.tasks.length}
            </span>
          </div>
          {group.tasks.slice(0, maxPreview).map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              tags={tags}
              isActive={task.id === activeTaskId}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {group.tasks.length > maxPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-muted-foreground"
            >
              <span className="text-caption">查看全部 {group.tasks.length} 项</span>
              <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
            </Button>
          )}
        </div>
      ))}
    </section>
  )
}

function todayPlusDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}
