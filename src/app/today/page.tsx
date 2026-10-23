'use client'

import { useMemo } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { DayView } from '@/components/calendar/day-view'
import { DailyReviewForm } from '@/components/reviews/daily-review-form'
import { HabitCheckin } from '@/components/habits/habit-checkin'
import { format, formatWeekday } from '@/lib/utils/date'
import { useToday } from '@/hooks/use-today'
import { PRIORITY_COLORS, PRIORITY_LABELS, PERIOD_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { History, Sun, Moon, Sunrise, AlertCircle, CheckCircle2, CalendarPlus } from 'lucide-react'

function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: '早上好', icon: Sunrise, period: 'morning' }
  if (hour < 18) return { text: '下午好', icon: Sun, period: 'afternoon' }
  return { text: '晚上好', icon: Moon, period: 'evening' }
}

export default function TodayPage() {
  const { user } = useAuth()
  const { tasks: taskRepo } = useRepos()
  const currentDate = useToday()

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['tasks', user?.id, 'today', currentDate],
    queryFn: () => taskRepo.getByDate(user!.id, currentDate),
    enabled: !!user,
  })

  const greeting = useMemo(() => getGreeting(), [])

  const taskStats = useMemo(() => {
    const done = todayTasks.filter((t) => t.status === 'done').length
    const active = todayTasks.filter((t) => t.status !== 'cancelled').length
    const rate = active > 0 ? Math.round((done / active) * 100) : 0
    return { total: active, done, rate }
  }, [todayTasks])

  // Find the highest priority active task
  const topTask = useMemo(() => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
    return todayTasks
      .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
      .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))[0]
  }, [todayTasks])

  if (!user) return null

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* 顶部概览：问候 + 主卡 */}
      <div>
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-2 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <greeting.icon className="h-4 w-4 shrink-0 text-primary/70" />
                {greeting.text}
              </p>
              <h1 className="mt-0.5 truncate text-title text-foreground">
                {format(new Date(), 'yyyy年M月d日')}
                <span className="ml-1.5 text-caption font-normal text-muted-foreground">
                  {formatWeekday(currentDate)}
                </span>
              </h1>
            </div>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-1 text-micro tabular-nums text-muted-foreground">
              今日 {taskStats.total} 项
            </span>
          </div>

          {/* 主卡：完成度 + 优先级最高的事项 */}
          <div className="surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-section tabular-nums text-primary">{taskStats.rate}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption text-muted-foreground">今日完成度</p>
                <p className="text-body font-medium tabular-nums text-foreground">
                  {taskStats.done}
                  <span className="text-muted-foreground"> / {taskStats.total}</span>
                  <span className="ml-1 text-caption font-normal text-muted-foreground">
                    项已完成
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: `${taskStats.rate}%` }}
              />
            </div>

            {topTask ? (
              <div className="mt-3 rounded-md bg-surface-2 px-3 py-2">
                <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
                  <AlertCircle
                    className={cn('h-3.5 w-3.5 shrink-0', PRIORITY_COLORS[topTask.priority])}
                  />
                  <span>优先级最高</span>
                  <span className={cn('font-medium', PRIORITY_COLORS[topTask.priority])}>
                    {PRIORITY_LABELS[topTask.priority]}
                  </span>
                  <span className="ml-auto shrink-0">{PERIOD_LABELS[topTask.period]}</span>
                </div>
                <p
                  className="mt-0.5 truncate text-body font-medium text-foreground"
                  title={topTask.title}
                >
                  {topTask.title}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2.5 rounded-md bg-surface-2 px-3 py-2.5">
                {taskStats.total > 0 ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                ) : (
                  <CalendarPlus className="h-6 w-6 shrink-0 text-muted-foreground/60" />
                )}
                <div className="min-w-0">
                  <p className="text-body text-muted-foreground">
                    {taskStats.total > 0 ? '今天的安排都完成了' : '今天还没有待办'}
                  </p>
                  <p className="text-caption text-muted-foreground/70">
                    {taskStats.total > 0 ? '留一点时间给自己' : '从日历或日程添加第一件事'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DayView currentDate={currentDate} onDateChange={() => {}} embedded />

      <div className="mt-4">
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-8 pt-2 sm:px-6">
          <HabitCheckin compact />
          <DailyReviewForm date={currentDate} />
          <div className="flex justify-end">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
              查看历史评价
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
