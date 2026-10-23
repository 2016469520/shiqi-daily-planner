'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { todayStr, format } from '@/lib/utils/date'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'
import type { DailyReview } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewCalendarProps {
  currentMonth: Date
  reviews: DailyReview[]
  selectedDate: string | null
  onMonthChange: (date: Date) => void
  onDateSelect: (date: string) => void
}

export function ReviewCalendar({
  currentMonth,
  reviews,
  selectedDate,
  onMonthChange,
  onDateSelect,
}: ReviewCalendarProps) {
  const today = todayStr()

  const reviewMap = useMemo(() => {
    const map = new Map<string, DailyReview>()
    for (const r of reviews) {
      map.set(r.review_date, r)
    }
    return map
  }, [reviews])

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [currentMonth])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const isFutureDate = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return dateStr > today
  }

  return (
    <div className="surface p-3 sm:p-4">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="上个月"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-baseline gap-2">
          <span className="text-section tabular-nums">
            {format(currentMonth, 'yyyy年M月')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-micro text-muted-foreground"
            onClick={() => onMonthChange(new Date())}
          >
            本月
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="下个月"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <div key={d} className="py-1 text-micro text-muted-foreground">
            {d}
          </div>
        ))}

        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const review = reviewMap.get(dateStr)
            const isSelected = dateStr === selectedDate
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const isFuture = isFutureDate(day)
            const hasReview = !!review

            return (
              <button
                key={`${wi}-${di}`}
                onClick={() => !isFuture && onDateSelect(dateStr)}
                disabled={isFuture}
                aria-label={`${dateStr}${hasReview ? '，已有评价' : ''}`}
                aria-pressed={isSelected}
                title={
                  hasReview
                    ? `${dateStr} · 评分 ${review?.score ?? '—'}/10 · 心情 ${review?.mood ?? '—'}/5`
                    : dateStr
                }
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-md border border-transparent p-1 ui-transition',
                  'hover:bg-surface-2',
                  !isCurrentMonth && 'opacity-40',
                  hasReview && 'bg-primary/[0.08]',
                  isSelected && 'border-primary/40 ring-1 ring-primary/40',
                  isTodayDate && !isSelected && 'border-primary/20',
                  isFuture && 'cursor-default opacity-30 hover:bg-transparent'
                )}
              >
                <span
                  className={cn(
                    'text-caption tabular-nums',
                    isTodayDate ? 'font-semibold text-primary' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <span
                  className={cn(
                    'h-1 w-1 rounded-full',
                    hasReview ? 'bg-primary' : 'bg-transparent'
                  )}
                />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
