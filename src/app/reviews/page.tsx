'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { ReviewSummary } from '@/components/reviews/review-summary'
import { ReviewCalendar } from '@/components/reviews/review-calendar'
import { ReviewTimeline } from '@/components/reviews/review-timeline'
import { ReviewDetail } from '@/components/reviews/review-detail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { todayStr } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { DailyReview } from '@/types'
import { CalendarDays, List, ClipboardList, PenLine } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ReviewMode = 'calendar' | 'timeline'

function getInitialMode(): ReviewMode {
  if (typeof window === 'undefined') return 'calendar'
  const saved = localStorage.getItem('plan-calendar-review-mode')
  if (saved === 'calendar' || saved === 'timeline') return saved
  return 'calendar'
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const { dailyReviews } = useRepos()
  const router = useRouter()

  const [mode, setMode] = useState<ReviewMode>(getInitialMode)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detailReview, setDetailReview] = useState<DailyReview | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [composeDate, setComposeDate] = useState<string | null>(null)
  const today = todayStr()

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  // Load reviews for a wide range to support month view and stats
  const range = useMemo(() => {
    const start = `${year - 1}-01-01`
    const end = `${year + 1}-12-31`
    return { start, end }
  }, [year])

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', range.start, range.end],
    queryFn: () => dailyReviews.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const handleModeChange = useCallback((newMode: ReviewMode) => {
    setMode(newMode)
    localStorage.setItem('plan-calendar-review-mode', newMode)
  }, [])

  const handleDateSelect = useCallback(
    (date: string) => {
      setSelectedDate(date)
      const review = reviews.find((r) => r.review_date === date)
      if (review) {
        setDetailReview(review)
        setDetailOpen(true)
      } else if (date <= today) {
        // Allow composing review for past dates without a review
        setComposeDate(date)
      }
    },
    [reviews, today]
  )

  const handleTimelineSelect = useCallback((review: DailyReview) => {
    setDetailReview(review)
    setSelectedDate(review.review_date)
    setDetailOpen(true)
  }, [])

  // Find previous/next reviews for navigation in detail view
  const sortedDates = useMemo(() => {
    return [...reviews]
      .sort((a, b) => a.review_date.localeCompare(b.review_date))
      .map((r) => r.review_date)
  }, [reviews])

  const currentIndex = selectedDate ? sortedDates.indexOf(selectedDate) : -1

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevDate = sortedDates[currentIndex - 1]
      const prevReview = reviews.find((r) => r.review_date === prevDate)
      if (prevReview) {
        setSelectedDate(prevDate)
        setDetailReview(prevReview)
      }
    }
  }, [currentIndex, sortedDates, reviews])

  const handleNext = useCallback(() => {
    if (currentIndex < sortedDates.length - 1) {
      const nextDate = sortedDates[currentIndex + 1]
      const nextReview = reviews.find((r) => r.review_date === nextDate)
      if (nextReview) {
        setSelectedDate(nextDate)
        setDetailReview(nextReview)
      }
    }
  }, [currentIndex, sortedDates, reviews])

  if (!user) return null

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display">复盘记录</h1>
          <p className="mt-1 text-caption text-muted-foreground">回顾过去的每一天</p>
        </div>
        <Button className="shrink-0" onClick={() => router.push('/today')}>
          <PenLine className="h-4 w-4" />
          写今日评价
        </Button>
      </div>

      {/* Monthly summary */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <ReviewSummary reviews={reviews} year={year} month={month} />
      )}

      {/* View switch */}
      {!isLoading && reviews.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-section">评价记录</h2>
          <div className="flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 rounded-full px-2.5 text-caption',
                mode === 'calendar' ? 'acg-pill' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => handleModeChange('calendar')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              月历
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 rounded-full px-2.5 text-caption',
                mode === 'timeline' ? 'acg-pill' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => handleModeChange('timeline')}
            >
              <List className="h-3.5 w-3.5" />
              时间线
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : reviews.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-4 py-14 text-center">
          <ClipboardList className="h-7 w-7 text-muted-foreground/60" />
          <div>
            <p className="text-body">还没有评价记录</p>
            <p className="mt-1 text-caption text-muted-foreground">
              每天结束时写下一份评价，记录自己的成长
            </p>
          </div>
        </div>
      ) : mode === 'calendar' ? (
        <ReviewCalendar
          currentMonth={currentMonth}
          reviews={reviews}
          selectedDate={selectedDate}
          onMonthChange={setCurrentMonth}
          onDateSelect={handleDateSelect}
        />
      ) : (
        <ReviewTimeline reviews={reviews} onSelect={handleTimelineSelect} />
      )}

      {/* Detail drawer */}
      <ReviewDetail
        review={detailReview}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < sortedDates.length - 1}
      />

      {/* Compose review for blank date */}
      {composeDate && (
        <ReviewDetail
          review={{
            id: '',
            user_id: user.id,
            review_date: composeDate,
            created_at: '',
            updated_at: '',
          }}
          open={!!composeDate}
          onOpenChange={(o) => { if (!o) setComposeDate(null); }}
        />
      )}
    </div>
  )
}
