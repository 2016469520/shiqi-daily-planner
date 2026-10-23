'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { getMonthRange, format, parseISO, isToday, isSameMonth } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { CalendarView, Task } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

const MAX_VISIBLE_TASKS = 3

interface MonthViewProps {
  currentDate: string
  onDateClick: (date: string) => void
  onViewChange: (view: CalendarView) => void
  onTaskClick?: (task: Task) => void
}

function getCalendarDays(year: number, month: number, weekStartsOn: 0 | 1 | 6 = 0) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const start = new Date(firstDay)
  const dayOfWeek = start.getDay()
  const diff = (dayOfWeek - weekStartsOn + 7) % 7
  start.setDate(start.getDate() - diff)

  const end = new Date(lastDay)
  const endDiff = (7 - end.getDay() + weekStartsOn - 1) % 7
  end.setDate(end.getDate() + endDiff)

  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

export function MonthView({ currentDate, onDateClick, onViewChange, onTaskClick }: MonthViewProps) {
  const { user } = useAuth()
  const { tasks } = useRepos()

  const range = useMemo(() => {
    const d = parseISO(currentDate)
    return getMonthRange(d)
  }, [currentDate])

  const { data: monthTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'month', range.start, range.end],
    queryFn: () => tasks.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const dateObj = parseISO(currentDate)
  const days = useMemo(
    () => getCalendarDays(dateObj.getFullYear(), dateObj.getMonth()),
    [dateObj]
  )

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const task of monthTasks) {
      if (!task.task_date) continue
      if (!map[task.task_date]) map[task.task_date] = []
      map[task.task_date].push(task)
    }
    return map
  }, [monthTasks])

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-border">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="min-h-[80px] bg-background p-1.5">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Day headers */}
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border bg-background">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-caption font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid：单元格只留底色，网格线由 gap + 容器底色提供（1px） */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 gap-px bg-border">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate[dateStr] || []
          const doneCount = dayTasks.filter((t) => t.status === 'done').length
          const allDone = dayTasks.length > 0 && doneCount === dayTasks.length
          const isCurrentMonth = isSameMonth(day, dateObj)
          const today = isToday(day)
          const overflowCount = dayTasks.length - MAX_VISIBLE_TASKS

          return (
            <button
              key={dateStr}
              onClick={() => {
                onDateClick(dateStr)
                onViewChange('day')
              }}
              className={cn(
                'cal-cell relative flex flex-col gap-1 bg-card p-1.5 text-left min-h-[84px]',
                'ui-transition hover:bg-accent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                !isCurrentMonth && 'text-muted-foreground/60',
                today && 'ring-1 ring-inset ring-primary/40'
              )}
            >
              {/* Date number + 完成统计 */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-caption tabular-nums',
                    today
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : isCurrentMonth
                        ? 'font-medium text-foreground'
                        : 'font-medium text-muted-foreground/50'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    className={cn(
                      'shrink-0 text-micro tabular-nums',
                      allDone
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {doneCount}/{dayTasks.length}
                  </span>
                )}
              </div>

              {/* Task indicators：最多 3 条 + 溢出计数 */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, MAX_VISIBLE_TASKS).map((task) => (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskClick?.(task)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        e.preventDefault()
                        onTaskClick?.(task)
                      }
                    }}
                    className={cn(
                      'min-w-0 cursor-pointer truncate rounded-sm px-1.5 py-0.5 text-caption leading-5 ui-transition',
                      task.status === 'done'
                        ? 'text-muted-foreground/80 line-through'
                        : task.priority === 'urgent'
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/15'
                          : 'bg-surface-2 hover:bg-accent'
                    )}
                    style={{
                      borderLeft: task.tag?.color ? `2px solid ${task.tag.color}` : undefined,
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <span
                    className="block px-1.5 text-caption tabular-nums text-muted-foreground"
                    title={`还有 ${overflowCount} 项`}
                  >
                    +{overflowCount}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
