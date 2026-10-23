'use client'

import { calculateMonthlyReviewSummary } from '@/lib/utils/review-stats'
import type { DailyReview } from '@/types'
import { Star, Smile, Zap, TrendingUp, Flame, CalendarCheck } from 'lucide-react'

interface ReviewSummaryProps {
  reviews: DailyReview[]
  year: number
  month: number
}

/** 0~max 的横向分段细条 */
function SegmentMeter({ value, max, label }: { value: number; max: number; label: string }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max))
  return (
    <div
      className="flex h-1.5 items-center gap-0.5"
      role="img"
      aria-label={`${label} ${filled}/${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  )
}

/** 0~100 的连续细条 */
function BarMeter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.round(Math.min(Math.max((value / max) * 100, 0), 100))
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${label} ${pct}%`}
    >
      <div className="h-full rounded-full bg-primary ui-transition" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ReviewSummary({ reviews, year, month }: ReviewSummaryProps) {
  const summary = calculateMonthlyReviewSummary(reviews, year, month)

  const stats = [
    {
      label: '已评价',
      value: `${summary.reviewedDays}/${summary.totalDays}`,
      sub: '天',
      icon: CalendarCheck,
      meter: (
        <BarMeter
          value={summary.reviewedDays}
          max={Math.max(summary.totalDays, 1)}
          label="已评价天数"
        />
      ),
    },
    {
      label: '平均评分',
      value: summary.avgScore != null ? summary.avgScore.toFixed(1) : '—',
      sub: '/10',
      icon: Star,
      meter: (
        <SegmentMeter value={summary.avgScore ?? 0} max={10} label="平均评分" />
      ),
    },
    {
      label: '平均完成度',
      value: summary.avgCompletion != null ? `${Math.round(summary.avgCompletion)}%` : '—',
      sub: '',
      icon: TrendingUp,
      meter: <BarMeter value={summary.avgCompletion ?? 0} max={100} label="平均完成度" />,
    },
    {
      label: '平均心情',
      value: summary.avgMood != null ? summary.avgMood.toFixed(1) : '—',
      sub: '/5',
      icon: Smile,
      meter: <SegmentMeter value={summary.avgMood ?? 0} max={5} label="平均心情" />,
    },
  ]

  const streakStats = [
    {
      label: '当前连续',
      value: summary.currentStreak,
      icon: Flame,
    },
    {
      label: '最长连续',
      value: summary.longestStreak,
      icon: Zap,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-caption text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-display tabular-nums">{s.value}</span>
              {s.sub && <span className="text-micro text-muted-foreground">{s.sub}</span>}
            </div>
            <div className="mt-2">{s.meter}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-surface-2 px-3 py-2">
        {streakStats.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <s.icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-caption text-foreground/70">{s.label}</span>
            <span className="text-caption font-semibold tabular-nums text-foreground">{s.value}</span>
            <span className="text-caption text-foreground/60">天</span>
          </div>
        ))}
      </div>
    </div>
  )
}
