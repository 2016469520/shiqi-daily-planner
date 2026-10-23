'use client'

import { useMemo } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { HomeFocusTimer } from '@/components/focus/focus-timer'
import { Skeleton } from '@/components/ui/skeleton'
import { todayStr, toDateStr } from '@/lib/utils/date'
import { Timer, Flame, TrendingUp, Target, Clock } from 'lucide-react'

/** 统一的空状态 */
function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-body">{title}</p>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function FocusPage() {
  const { user } = useAuth()
  const { focusSessions: fsRepo } = useRepos()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['focus', 'all'],
    queryFn: async () => {
      const end = todayStr()
      const d = new Date()
      d.setDate(d.getDate() - 30)
      const start = toDateStr(d)
      return fsRepo.getByDateRange(user!.id, { start, end })
    },
    enabled: !!user,
  })

  const stats = useMemo(() => {
    const today = todayStr()
    /** completed_at / created_at 是 UTC ISO 时间戳，按本地日期归组 */
    const localDay = (iso?: string | null): string =>
      iso ? toDateStr(new Date(iso)) : ''
    const todaySessions = sessions.filter((s) => localDay(s.created_at) === today && s.status === 'completed')
    const completedSessions = sessions.filter((s) => s.status === 'completed')

    const todayMinutes = todaySessions.reduce((sum, s) => sum + Math.floor(s.actual_seconds / 60), 0)
    const todayCount = todaySessions.length
    const totalMinutes = completedSessions.reduce((sum, s) => sum + Math.floor(s.actual_seconds / 60), 0)
    const totalCount = completedSessions.length
    const avgMinutes = totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0
    const maxMinutes = completedSessions.length > 0
      ? Math.max(...completedSessions.map((s) => Math.floor(s.actual_seconds / 60)))
      : 0

    // Weekly stats (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = toDateStr(weekAgo)
    const weekCompleted = completedSessions.filter((s) => localDay(s.completed_at) >= weekStr)
    const weekMinutes = weekCompleted.reduce((sum, s) => sum + Math.floor(s.actual_seconds / 60), 0)

    // Monthly stats (last 30 days)
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthCompleted = completedSessions.filter((s) => localDay(s.completed_at) >= toDateStr(monthAgo))
    const monthMinutes = monthCompleted.reduce((sum, s) => sum + Math.floor(s.actual_seconds / 60), 0)

    // Streak
    let streak = 0
    const checkDate = new Date()
    while (true) {
      const dateStr = toDateStr(checkDate)
      const hasSession = completedSessions.some((s) => localDay(s.completed_at) === dateStr)
      if (hasSession) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      todayMinutes,
      todayCount,
      totalMinutes,
      totalCount,
      avgMinutes,
      maxMinutes,
      weekMinutes,
      monthMinutes,
      streak,
    }
  }, [sessions])

  // Recent 7-day trend
  const trend = useMemo(() => {
    const days: { date: string; minutes: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = toDateStr(d)
      const daySessions = sessions.filter(
        (s) => s.status === 'completed' && s.completed_at && toDateStr(new Date(s.completed_at)) === dateStr
      )
      const mins = daySessions.reduce((sum, s) => sum + Math.floor(s.actual_seconds / 60), 0)
      days.push({ date: dateStr, minutes: mins })
    }
    return days
  }, [sessions])

  const maxTrendMin = Math.max(...trend.map((d) => d.minutes), 1)
  const weekTrendTotal = trend.reduce((sum, d) => sum + d.minutes, 0)

  if (!user) return null

  const completedList = sessions.filter((s) => s.status === 'completed')

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="min-w-0">
        <h1 className="text-display">专注</h1>
        <p className="mt-1 text-caption text-muted-foreground">番茄钟计时与专注统计</p>
      </div>

      {/* Timer section */}
      <div className="mx-auto max-w-md">
        <HomeFocusTimer />
      </div>

      {/* Stats overview */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Timer}
              label="今日专注"
              value={`${stats.todayMinutes} 分钟`}
              sub={`${stats.todayCount} 次`}
            />
            <StatCard
              icon={Flame}
              label="连续天数"
              value={`${stats.streak} 天`}
            />
            <StatCard
              icon={Target}
              label="本周专注"
              value={`${stats.weekMinutes} 分钟`}
            />
            <StatCard
              icon={TrendingUp}
              label="平均时长"
              value={`${stats.avgMinutes} 分钟`}
              sub={`最长 ${stats.maxMinutes} 分钟`}
            />
          </div>

          {/* 7-day trend */}
          <div className="surface p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-section">最近 7 天趋势</h2>
              <span className="text-micro tabular-nums text-muted-foreground">
                {weekTrendTotal} 分钟
              </span>
            </div>

            {weekTrendTotal === 0 ? (
              <EmptyState
                icon={Timer}
                title="最近 7 天还没有专注"
                hint="完成一次专注后，这里会出现趋势"
              />
            ) : (
              <div className="mt-4 flex h-32 items-end gap-2">
                {trend.map((day) => {
                  const height = maxTrendMin > 0 ? (day.minutes / maxTrendMin) * 100 : 0
                  const d = new Date(day.date + 'T00:00:00')
                  const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`
                  return (
                    <div key={day.date} className="flex h-full flex-1 flex-col items-center gap-1">
                      <span className="text-micro tabular-nums text-muted-foreground">
                        {day.minutes > 0 ? `${day.minutes}分` : ''}
                      </span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full min-h-1 rounded-t-sm bg-gradient-to-t from-primary/70 via-primary/50 to-period-afternoon/40 ui-transition"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.date}：${day.minutes} 分钟`}
                        />
                      </div>
                      <span className="text-micro tabular-nums text-muted-foreground">
                        {dayLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="surface p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-section">最近专注记录</h2>
              <span className="text-micro tabular-nums text-muted-foreground">
                累计 {stats.totalCount} 次 · {stats.totalMinutes} 分钟
              </span>
            </div>

            {completedList.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="还没有专注记录"
                hint="开始第一次专注，记录你的时间"
              />
            ) : (
              <div className="mt-3 space-y-1.5">
                {completedList.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-caption">
                        {s.title || (s.mode === 'short_break' ? '短休息' : s.mode === 'long_break' ? '长休息' : '专注')}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-micro tabular-nums text-muted-foreground">
                      <span>{Math.floor(s.actual_seconds / 60)} 分钟</span>
                      <span>{s.completed_at ? new Date(s.completed_at).toLocaleDateString('zh-CN') : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-caption text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </div>
      <div className="mt-2 text-display tabular-nums">{value}</div>
      {sub && <p className="mt-0.5 text-micro text-muted-foreground">{sub}</p>}
    </div>
  )
}
