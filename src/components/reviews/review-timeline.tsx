'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { filterReviews, type ReviewFilterOptions } from '@/lib/utils/review-stats'
import { formatDisplayDate, formatWeekday, format } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { DailyReview } from '@/types'
import { ChevronRight, Filter, X } from 'lucide-react'

const PAGE_SIZE = 20

interface ReviewTimelineProps {
  reviews: DailyReview[]
  onSelect: (review: DailyReview) => void
}

/** 1~max 的横向小方块 */
function BlockMeter({ label, value, max }: { label: string; value: number; max: number }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max))
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-micro text-muted-foreground">{label}</span>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${label} ${filled}/${max}`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn('h-2 w-1 rounded-full', i < filled ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </span>
      <span className="text-micro tabular-nums text-muted-foreground">
        {filled}/{max}
      </span>
    </span>
  )
}

function CompletionMeter({ value }: { value: number }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 100))
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-micro text-muted-foreground">完成度</span>
      <span
        className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`完成度 ${pct}%`}
      >
        <span
          className="block h-full rounded-full bg-primary ui-transition"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-micro tabular-nums text-muted-foreground">{pct}%</span>
    </span>
  )
}

export function ReviewTimeline({ reviews, onSelect }: ReviewTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filters, setFilters] = useState<ReviewFilterOptions>({})
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    const hasFilters = filters.month || filters.scoreMin != null || filters.scoreMax != null || filters.mood != null || filters.hasTextOnly
    if (!hasFilters) {
      // Default: sort by date descending
      return [...reviews].sort((a, b) => b.review_date.localeCompare(a.review_date))
    }
    return filterReviews(reviews, filters)
  }, [reviews, filters])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const hasFilters = filters.month || filters.scoreMin != null || filters.scoreMax != null || filters.mood != null || filters.hasTextOnly

  // Generate month options from available reviews
  const monthOptions = useMemo(() => {
    const months = new Set<string>()
    for (const r of reviews) {
      months.add(r.review_date.slice(0, 7))
    }
    return [...months].sort().reverse()
  }, [reviews])

  const clearFilters = () => {
    setFilters({})
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="sm"
          className="text-caption"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          筛选
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="text-caption" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            清除
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-2 p-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-micro text-muted-foreground">月份</Label>
            <Select
              value={filters.month ?? ''}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, month: v || undefined }))
              }
            >
              <SelectTrigger className="h-8 text-caption">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-micro text-muted-foreground">最低评分</Label>
            <Select
              value={filters.scoreMin?.toString() ?? ''}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, scoreMin: v ? Number(v) : undefined }))
              }
            >
              <SelectTrigger className="h-8 text-caption">
                <SelectValue placeholder="不限" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">不限</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    ≥ {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-micro text-muted-foreground">心情</Label>
            <Select
              value={filters.mood?.toString() ?? ''}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, mood: v ? Number(v) : undefined }))
              }
            >
              <SelectTrigger className="h-8 text-caption">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {'😔😐🙂😊🤩'[n - 1]} {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-0.5">
            <div className="flex items-center gap-2">
              <Switch
                id="has-text"
                checked={filters.hasTextOnly ?? false}
                onCheckedChange={(v) =>
                  setFilters((f) => ({ ...f, hasTextOnly: v || undefined }))
                }
              />
              <Label htmlFor="has-text" className="text-caption">
                仅有总结
              </Label>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Filter className="h-6 w-6 text-muted-foreground/60" />
          <p className="text-body">当前筛选没有匹配记录</p>
          {hasFilters && (
            <Button variant="link" size="sm" className="text-caption" onClick={clearFilters}>
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((review) => (
            <button
              key={review.id}
              onClick={() => onSelect(review)}
              className="group w-full text-left"
            >
              <div className="surface surface-interactive rounded-lg p-3">
                <div className="flex gap-3">
                  {/* 左侧日期 */}
                  <div className="w-12 shrink-0 pt-0.5 text-right">
                    <div className="text-micro tabular-nums text-muted-foreground">
                      {format(review.review_date, 'yyyy')}
                    </div>
                    <div className="text-micro font-medium tabular-nums text-foreground">
                      {format(review.review_date, 'MM/dd')}
                    </div>
                    <div className="mt-0.5 text-micro text-muted-foreground/70">
                      {formatWeekday(review.review_date)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {review.score != null && (
                          <BlockMeter label="评分" value={review.score} max={10} />
                        )}
                        {review.mood != null && (
                          <BlockMeter label="心情" value={review.mood} max={5} />
                        )}
                        {review.energy != null && (
                          <BlockMeter label="精力" value={review.energy} max={5} />
                        )}
                        {review.subjective_completion != null && (
                          <CompletionMeter value={review.subjective_completion} />
                        )}
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground ui-transition group-hover:text-foreground" />
                    </div>

                    {review.achievement && (
                      <p className="line-clamp-1 text-caption text-muted-foreground">
                        <span className="text-foreground/70">成果 · </span>
                        {review.achievement}
                      </p>
                    )}

                    {review.summary && (
                      <p className="line-clamp-2 text-caption text-muted-foreground">
                        {review.summary}
                      </p>
                    )}

                    <span className="sr-only">{formatDisplayDate(review.review_date)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-caption"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                加载更多（{filtered.length - visibleCount} 条）
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
