'use client'

import { useRouter } from 'next/navigation'
import { DailyReviewForm } from '@/components/reviews/daily-review-form'
import { formatDisplayDate, formatWeekday } from '@/lib/utils/date'
import { useToday } from '@/hooks/use-today'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'

export default function ReviewTodayPage() {
  const router = useRouter()
  const today = useToday()

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display">每日总结</h1>
          <p className="mt-1 text-caption text-muted-foreground">
            {formatDisplayDate(today)} {formatWeekday(today)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/reviews')}
        >
          <History className="h-4 w-4" />
          查看历史记录
        </Button>
      </div>

      <DailyReviewForm date={today} />
    </div>
  )
}
