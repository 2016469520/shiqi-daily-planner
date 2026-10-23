'use client'

import { useMemo } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, CheckCircle2, Clock, TrendingUp, Tag, PenLine } from 'lucide-react'
import {
  getCalendarMonthRange,
  format,
  parseISO,
  addDays,
  toDateStr,
} from '@/lib/utils/date'
import { useToday } from '@/hooks/use-today'
import { PERIOD_LABELS } from '@/lib/constants'
import { calculateTagStats, calculateTaskStats, calculateReviewStats } from '@/lib/utils/stats'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Period } from '@/types'
import { PERIOD_ORDER } from '@/lib/period-style'
const PERIOD_TONE: Record<Period, string> = {
  morning: 'p-morning',
  afternoon: 'p-afternoon',
  evening: 'p-evening',
}

/** 统一的空状态 */
function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-body">{title}</p>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
      {action}
    </div>
  )
}

/** 1~max 的横向小方块 */
function BlockMeter({ value, max }: { value: number; max: number }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max))
  return (
    <div className="mt-2 flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn('h-1.5 flex-1 rounded-full', i < filled ? 'bg-primary' : 'bg-muted')}
        />
      ))}
    </div>
  )
}

export default function InsightsPage() {
  const { user } = useAuth()
  const { tasks, tags: tagRepo, habitLogs, dailyReviews } = useRepos()

  const today = useToday()
  // 自然月范围（不含相邻月份的日期）
  const range = useMemo(() => getCalendarMonthRange(today), [today])
  // 最近 7 天（含今天）
  const weekRange = useMemo(
    () => ({ start: toDateStr(addDays(parseISO(today), -6)), end: today }),
    [today]
  )

  const { data: monthTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'month', range.start, range.end],
    queryFn: () => tasks.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const { data: weekTasks = [] } = useQuery({
    queryKey: ['tasks', user?.id, 'week', weekRange.start, weekRange.end],
    queryFn: () => tasks.getByDateRange(user!.id, weekRange),
    enabled: !!user,
  })

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  const { data: monthLogs = [] } = useQuery({
    queryKey: ['habitLogs', 'month', range.start, range.end],
    queryFn: () => habitLogs.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const { data: monthReviews = [] } = useQuery({
    queryKey: ['reviews', 'month', range.start, range.end],
    queryFn: () => dailyReviews.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const taskStats = useMemo(() => calculateTaskStats(monthTasks, today), [monthTasks, today])
  const tagStats = useMemo(() => calculateTagStats(monthTasks, tagList), [monthTasks, tagList])
  const reviewStats = useMemo(() => calculateReviewStats(monthReviews), [monthReviews])

  // 最近 7 天完成趋势
  const dailyTrend = useMemo(() => {
    const days: { date: string; done: number; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dateStr = toDateStr(addDays(parseISO(today), -i))
      const dayTasks = weekTasks.filter((t) => t.task_date === dateStr && t.status !== 'cancelled')
      days.push({
        date: dateStr,
        done: dayTasks.filter((t) => t.status === 'done').length,
        total: dayTasks.length,
      })
    }
    return days
  }, [weekTasks, today])

  const maxDailyTotal = Math.max(...dailyTrend.map((d) => d.total), 1)
  const weekDone = dailyTrend.reduce((sum, d) => sum + d.done, 0)
  const weekTotal = dailyTrend.reduce((sum, d) => sum + d.total, 0)

  if (!user) return null

  const totalTasks = monthTasks.filter((t) => t.status !== 'cancelled').length
  const completionRate = Math.round(taskStats.completionRate * 100)
  const habitCompletionDays = monthLogs.filter((l) => l.is_completed).length
  const reviewDays = monthReviews.length

  const statCards = [
    {
      label: '计划总数',
      value: totalTasks,
      sub: '本月计划事项',
      icon: BarChart3,
    },
    {
      label: '完成率',
      value: `${completionRate}%`,
      sub: `${taskStats.done} 项已完成`,
      icon: CheckCircle2,
    },
    {
      label: '习惯打卡',
      value: habitCompletionDays,
      sub: '本月打卡记录',
      icon: Clock,
    },
    {
      label: '每日评价',
      value: reviewDays,
      sub: '评价天数',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display">统计与复盘</h1>
          <p className="mt-1 text-caption text-muted-foreground">
            {format(new Date(), 'M月')} 数据概览
          </p>
        </div>
        <Link href="/reviews/today" className={cn('shrink-0', buttonVariants())}>
          <PenLine className="h-4 w-4" />
          写今日评价
        </Link>
      </div>

      {tasksLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-caption text-muted-foreground">{card.label}</span>
                <card.icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </div>
              <div className="mt-2 text-display tabular-nums">{card.value}</div>
              <p className="mt-0.5 text-micro text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* 最近 7 天完成趋势 */}
      <div className="surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-section">最近 7 天</h2>
          <span className="text-micro tabular-nums text-muted-foreground">
            完成 {weekDone} / {weekTotal}
          </span>
        </div>

        {weekTotal === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="最近 7 天还没有计划"
            hint="先在今天添加一个计划，趋势会在这里出现"
          />
        ) : (
          <>
            <div className="mt-4 flex h-[148px] items-end justify-between gap-2">
              {dailyTrend.map((day) => {
                const totalH = day.total > 0 ? Math.max(Math.round((day.total / maxDailyTotal) * 96), 8) : 0
                const doneH = day.total > 0 ? Math.round((day.done / day.total) * totalH) : 0
                const d = parseISO(day.date)
                return (
                  <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="text-micro tabular-nums text-muted-foreground">
                      {day.total > 0 ? `${day.done}/${day.total}` : ''}
                    </span>
                    {/* 整列轨道：没有数据的日子也能看出"这一列存在" */}
                    <div className="relative flex w-full max-w-9 flex-1 items-end overflow-hidden rounded-sm bg-surface-2">
                      {day.total > 0 && (
                        <div
                          className="relative w-full rounded-t-sm bg-primary/15"
                          style={{ height: totalH }}
                          title={`${day.date}：完成 ${day.done} / 共 ${day.total}`}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-gradient-to-t from-primary to-primary/70 ui-transition"
                            style={{ height: doneH }}
                          />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-micro tabular-nums',
                        day.date === today ? 'font-semibold text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {format(d, 'M/d')}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-micro text-muted-foreground">
              实心为主色已完成数量，浅色部分为当天计划总量
            </p>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* 时段分布 */}
        <div className="surface p-4">
          <h2 className="text-section">时段分布</h2>
          {taskStats.total === 0 ? (
            <EmptyState
              icon={Clock}
              title="本月还没有计划事项"
              hint="添加计划后，这里会显示三个时段的完成度"
            />
          ) : (
            <div className="mt-3 space-y-3">
              {PERIOD_ORDER.map((period) => {
                const p = taskStats.byPeriod[period]
                const pct = Math.round(p.rate * 100)
                return (
                  <div key={period} className={cn('space-y-1', PERIOD_TONE[period])}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                        <span className="period-dot h-1.5 w-1.5 rounded-full" />
                        {PERIOD_LABELS[period]}
                      </span>
                      <span className="text-micro tabular-nums text-muted-foreground">
                        {p.done}/{p.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="period-bar h-full rounded-full opacity-80 ui-transition"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 标签统计 */}
        <div className="surface p-4">
          <h2 className="text-section">标签统计</h2>
          {tagStats.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="本月还没有带标签的事项"
              hint="给计划加上标签，就能看到分类分布"
            />
          ) : (
            <div className="mt-3 space-y-3">
              {tagStats.slice(0, 6).map((tag) => {
                const maxTotal = tagStats[0].total || 1
                return (
                  <div key={tag.tagId} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.tagColor }}
                        />
                        <span className="truncate text-caption">{tag.tagName}</span>
                      </span>
                      <span className="shrink-0 text-micro tabular-nums text-muted-foreground">
                        {tag.done}/{tag.total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full opacity-70 ui-transition"
                        style={{
                          width: `${Math.max(Math.round((tag.total / maxTotal) * 100), 4)}%`,
                          backgroundColor: tag.tagColor,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 评价趋势 */}
      <div className="surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-section">评价趋势</h2>
          <Link href="/reviews" className="text-micro text-primary hover:underline">
            查看历史评价
          </Link>
        </div>

        {reviewStats.totalReviews === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="本月还没有评价"
            hint="写一篇今天的评价，记录自己的成长"
            action={
              <Link
                href="/reviews/today"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-caption')}
              >
                写今日评价
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-surface-2 p-3">
                <div className="text-caption text-muted-foreground">平均评分</div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-title tabular-nums">
                    {reviewStats.avgScore != null ? reviewStats.avgScore.toFixed(1) : '—'}
                  </span>
                  <span className="text-micro text-muted-foreground">/10</span>
                </div>
                <BlockMeter value={reviewStats.avgScore ?? 0} max={10} />
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <div className="text-caption text-muted-foreground">平均心情</div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-title tabular-nums">
                    {reviewStats.avgMood != null ? reviewStats.avgMood.toFixed(1) : '—'}
                  </span>
                  <span className="text-micro text-muted-foreground">/5</span>
                </div>
                <BlockMeter value={reviewStats.avgMood ?? 0} max={5} />
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <div className="text-caption text-muted-foreground">评价天数</div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-title tabular-nums">{reviewStats.totalReviews}</span>
                  <span className="text-micro text-muted-foreground">天</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted" />
              </div>
            </div>

            {reviewStats.scoreTrend.length > 1 ? (
              <div className="flex h-[72px] items-end gap-1">
                {reviewStats.scoreTrend.map((point) => (
                  <div
                    key={point.date}
                    className="min-w-1 flex-1 rounded-t-sm bg-gradient-to-t from-primary/70 to-period-afternoon/40"
                    style={{ height: Math.max(Math.round((point.value / 10) * 72), 4) }}
                    title={`${point.date}：${point.value}/10`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-micro text-muted-foreground">累计两天的评分后显示趋势</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
