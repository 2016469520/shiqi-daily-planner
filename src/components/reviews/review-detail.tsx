'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { DailyReviewForm } from './daily-review-form'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDisplayDate, formatWeekday } from '@/lib/utils/date'
import type { DailyReview } from '@/types'
import {
  Star,
  Smile,
  Zap,
  TrendingUp,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReviewDetailProps {
  review: DailyReview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

/** 横向小方块：1~max */
function BlockMeter({ value, max }: { value: number; max: number }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max))
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${filled}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-1 rounded-full ${i < filled ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  )
}

/** 连续细条：0~100 */
function BarMeter({ value }: { value: number }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 100))
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct}%`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ReviewDetail({
  review,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ReviewDetailProps) {
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { user } = useAuth()
  const { dailyReviews } = useRepos()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => dailyReviews.delete(user!.id, review!.review_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['dailyReview'] })
      toast.success('评价已删除')
      setDeleteOpen(false)
      onOpenChange(false)
    },
    onError: () => {
      toast.error('删除失败，请重试')
    },
  })

  if (!review) return null

  if (editing) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
          <ScrollArea className="h-full p-6">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-section">
                编辑评价 — {formatDisplayDate(review.review_date)}
              </SheetTitle>
            </SheetHeader>
            <DailyReviewForm
              date={review.review_date}
              onSaved={() => {
                setEditing(false)
                queryClient.invalidateQueries({ queryKey: ['reviews'] })
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  const fields = [
    { label: '评分', value: review.score, icon: Star, unit: '/10', max: 10, kind: 'blocks' as const },
    { label: '完成度', value: review.subjective_completion, icon: TrendingUp, unit: '%', max: 100, kind: 'bar' as const },
    { label: '心情', value: review.mood, icon: Smile, unit: '/5', max: 5, kind: 'blocks' as const },
    { label: '精力', value: review.energy, icon: Zap, unit: '/5', max: 5, kind: 'blocks' as const },
  ]

  const textFields = [
    { label: '今日成果', value: review.achievement },
    { label: '未完成事项', value: review.unfinished },
    { label: '遇到的问题', value: review.problems },
    { label: '今日收获', value: review.lessons },
    { label: '明日重点', value: review.tomorrow_focus },
    { label: '自由总结', value: review.summary },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
          <ScrollArea className="h-full p-6">
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  {hasPrevious && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onPrevious}
                      aria-label="上一条评价"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <SheetTitle className="truncate text-section">
                    {formatDisplayDate(review.review_date)}
                  </SheetTitle>
                  {hasNext && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onNext}
                      aria-label="下一条评价"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <span className="shrink-0 text-micro text-muted-foreground">
                  {formatWeekday(review.review_date)}
                </span>
              </div>
            </SheetHeader>

            {/* Score fields */}
            <div className="mb-5 grid grid-cols-2 gap-2">
              {fields.map((f) => (
                <div key={f.label} className="rounded-md bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-caption text-muted-foreground">{f.label}</span>
                    <f.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-0.5">
                    <span className="text-title tabular-nums">
                      {f.value != null ? f.value : '—'}
                    </span>
                    {f.value != null && (
                      <span className="text-micro text-muted-foreground">{f.unit}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    {f.value == null ? (
                      <div className="h-1.5 rounded-full bg-muted" />
                    ) : f.kind === 'bar' ? (
                      <BarMeter value={f.value} />
                    ) : (
                      <BlockMeter value={f.value} max={f.max} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Text fields */}
            <div className="space-y-4">
              {textFields.map((f) =>
                f.value ? (
                  <div key={f.label} className="space-y-1">
                    <div className="text-caption text-muted-foreground">{f.label}</div>
                    <p className="whitespace-pre-wrap text-body">{f.value}</p>
                  </div>
                ) : null
              )}
            </div>

            {/* Created/Updated */}
            <div className="mt-6 space-y-1 border-t border-border pt-4 text-micro text-muted-foreground">
              <div>创建：{new Date(review.created_at).toLocaleString('zh-CN')}</div>
              <div>更新：{new Date(review.updated_at).toLocaleString('zh-CN')}</div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                编辑
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除评价</DialogTitle>
            <DialogDescription>
              确定要删除 {formatDisplayDate(review.review_date)} 的评价吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
