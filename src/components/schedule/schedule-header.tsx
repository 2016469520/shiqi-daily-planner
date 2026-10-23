'use client'

import { useMemo } from 'react'
import { format, formatWeekday } from '@/lib/utils/date'
import type { Task } from '@/types'
import { Sun, Moon, Sunrise, AlertCircle, Clock, Timer } from 'lucide-react'

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: '早上好', icon: Sunrise }
  if (hour < 18) return { text: '下午好', icon: Sun }
  return { text: '晚上好', icon: Moon }
}

interface ScheduleHeaderProps {
  today: string
  tasks: Task[]
}

/**
 * 今日概览卡：日期 + 完成进度（环 / 条）+ 今日专注时长（来自今日任务的 actual_minutes）。
 * 只使用 data-testid 无关的展示结构，不改变任何数据来源。
 */
export function ScheduleHeader({ today, tasks }: ScheduleHeaderProps) {
  const greeting = useMemo(() => getGreeting(), [])

  const stats = useMemo(() => {
    const activeToday = tasks.filter(
      (t) => t.task_date === today && t.status !== 'cancelled'
    )
    const done = activeToday.filter((t) => t.status === 'done').length
    const total = activeToday.length
    const overdue = tasks.filter(
      (t) => t.task_date && t.task_date < today && t.status !== 'done' && t.status !== 'cancelled'
    ).length
    // 今日已登记的专注时长（专注完成时会累加到任务的 actual_minutes）
    const focusMinutes = activeToday.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)
    // Next upcoming task (closest time today)
    const upcoming = activeToday
      .filter((t) => t.status !== 'done' && t.start_time)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))[0]

    return {
      done,
      total,
      overdue,
      upcoming,
      focusMinutes,
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  }, [tasks, today])

  const remaining = stats.total - stats.done
  const progress = Math.min(100, Math.max(0, stats.rate))
  // r = 15，周长 ≈ 94.25
  const dash = (progress / 100) * 94.25

  return (
    <section className="surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <greeting.icon className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            {greeting.text}
          </p>
          <h1 className="flex flex-wrap items-baseline gap-x-2 text-title">
            {format(new Date(), 'yyyy年M月d日')}
            <span className="text-caption font-normal text-muted-foreground">
              {formatWeekday(today)}
            </span>
          </h1>
          <p className="text-caption text-muted-foreground">
            {stats.total === 0
              ? '今天还没有计划，先加一项吧'
              : remaining > 0
                ? `还有 ${remaining} 项计划需要处理`
                : '今天的计划全部完成了 🎉'}
          </p>
        </div>

        {/* 完成进度环 */}
        <div
          className="relative h-16 w-16 shrink-0"
          role="img"
          aria-label={`今日完成进度 ${progress}%`}
        >
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              strokeWidth="3"
              className="stroke-surface-2"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              strokeWidth="3"
              strokeLinecap={progress > 0 ? 'round' : 'butt'}
              className="stroke-primary"
              strokeDasharray={`${dash} 94.25`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-caption font-semibold tabular-nums">{progress}%</span>
            <span className="text-micro tabular-nums text-muted-foreground">
              {stats.done}/{stats.total}
            </span>
          </div>
        </div>
      </div>

      {/* 进度条 + 辅助信息 */}
      <div className="mt-4 space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-base)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
          <span>
            已完成{' '}
            <span className="font-semibold tabular-nums text-foreground">{stats.done}</span>
            {' / '}
            <span className="tabular-nums">{stats.total}</span>
          </span>

          {stats.overdue > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <AlertCircle className="h-3 w-3 text-warning" aria-hidden="true" />
              <span className="tabular-nums">{stats.overdue}</span> 项延期
            </span>
          )}

          {stats.focusMinutes > 0 && (
            <span className="inline-flex items-center gap-1" title="今日任务累计的专注时长">
              <Timer className="h-3 w-3" aria-hidden="true" />
              专注 <span className="tabular-nums">{stats.focusMinutes}</span> 分钟
            </span>
          )}

          {stats.upcoming && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{stats.upcoming.start_time}</span>
              <span className="truncate" title={stats.upcoming.title}>
                {stats.upcoming.title}
              </span>
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
