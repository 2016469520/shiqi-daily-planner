'use client'

import { useState } from 'react'
import { parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { RefreshCw, Calendar, Hash, X } from 'lucide-react'
import type { RecurrenceRule } from '@/types'

const FREQUENCY_LABELS: Record<string, string> = {
  none: '不重复',
  daily: '每天',
  weekdays: '每个工作日',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

/** 胶囊分段项：选中用 acg-pill，未选中为幽灵文字 */
const pillClass = (selected: boolean) =>
  cn(
    'h-7 rounded-full px-2.5 text-caption ui-transition',
    selected
      ? 'acg-pill font-semibold'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  )

interface RecurrenceEditorProps {
  value: RecurrenceRule | null | undefined
  onChange: (rule: RecurrenceRule | null) => void
  /** 任务日期（yyyy-MM-dd）：选「每周」时默认落在这一天所在的星期几 */
  baseDate?: string
}

/** 把日期换成 ISO 星期（1=周一 … 7=周日） */
function isoWeekday(dateStr?: string): number {
  const date = dateStr ? parseISO(dateStr) : new Date()
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function RecurrenceEditor({ value, onChange, baseDate }: RecurrenceEditorProps) {
  const frequency = value?.frequency || 'none'
  const [endType, setEndType] = useState<'none' | 'count' | 'date'>(
    value?.count ? 'count' : value?.endDate ? 'date' : 'none'
  )

  const handleFrequencyChange = (freq: string | null) => {
    if (!freq) return
    if (freq === 'none') {
      onChange(null)
      return
    }

    const base: RecurrenceRule = {
      frequency: freq as RecurrenceRule['frequency'],
      interval: value?.interval || 1,
    }

    // Preserve and set appropriate defaults
    if (freq === 'weekly' && !base.byWeekday) {
      // 默认沿用任务当天的星期几，而不是写死周一
      base.byWeekday = [isoWeekday(baseDate)]
    }
    if (freq === 'monthly') {
      base.byMonthDay = value?.byMonthDay || 1
    }

    if (value?.endDate) base.endDate = value.endDate
    if (value?.count) base.count = value.count

    onChange(base)
  }

  const handleIntervalChange = (interval: number) => {
    if (!value) return
    onChange({ ...value, interval: Math.max(1, interval) })
  }

  const handleWeekdayToggle = (day: number) => {
    if (!value) return
    const current = value.byWeekday || []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort()
    onChange({ ...value, byWeekday: next.length > 0 ? next : undefined })
  }

  const handleMonthDayChange = (day: number) => {
    if (!value) return
    onChange({ ...value, byMonthDay: Math.min(31, Math.max(1, day)) })
  }

  const handleSetPosChange = (pos: number) => {
    if (!value) return
    onChange({
      ...value,
      bySetPos: pos || undefined,
      byWeekday: pos ? (value.byWeekday || [1]) : undefined,
    })
  }

  const handleEndCount = (count: number) => {
    if (!value) return
    const next = { ...value }
    delete next.endDate
    next.count = count > 0 ? count : undefined
    onChange(next)
  }

  const handleEndDate = (date: string) => {
    if (!value) return
    const next = { ...value }
    delete next.count
    next.endDate = date || undefined
    onChange(next)
  }

  if (!value) {
    return (
      <div className="space-y-2">
        <Label className="text-caption text-muted-foreground">重复</Label>
        <Select value="none" onValueChange={handleFrequencyChange}>
          <SelectTrigger className="w-full rounded-md">
            <SelectValue placeholder="不重复" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {key !== 'none' && <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />}
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          重复规则
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-caption text-muted-foreground"
          onClick={() => onChange(null)}
        >
          <X className="h-3 w-3" aria-hidden="true" />
          移除
        </Button>
      </div>

      {/* Frequency */}
      <Select value={frequency} onValueChange={handleFrequencyChange}>
        <SelectTrigger className="w-full rounded-md">
          <SelectValue>{FREQUENCY_LABELS[frequency] || frequency}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FREQUENCY_LABELS)
            .filter(([key]) => key !== 'none')
            .map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Interval */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-caption text-muted-foreground">间隔</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-muted-foreground">每</span>
          <Input
            type="number"
            min={1}
            max={99}
            value={value.interval || 1}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
            className="w-16 text-center tabular-nums"
            aria-label="重复间隔"
          />
          <span className="text-caption text-muted-foreground">
            {frequency === 'daily' || frequency === 'weekdays'
              ? '天'
              : frequency === 'weekly'
                ? '周'
                : frequency === 'monthly'
                  ? '月'
                  : '年'}
          </span>
        </div>
      </div>

      {/* Weekly: day selection */}
      {frequency === 'weekly' && (
        <div className="space-y-2">
          <Label className="text-caption text-muted-foreground">重复日</Label>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_OPTIONS.map(({ value: day, label }) => (
              <button
                key={day}
                type="button"
                onClick={() => handleWeekdayToggle(day)}
                aria-pressed={(value.byWeekday || []).includes(day)}
                className={pillClass((value.byWeekday || []).includes(day))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly: day selection */}
      {frequency === 'monthly' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="shrink-0 text-caption text-muted-foreground">每月</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-caption text-muted-foreground">第</span>
              <Input
                type="number"
                min={1}
                max={31}
                value={value.byMonthDay || 1}
                onChange={(e) => handleMonthDayChange(parseInt(e.target.value) || 1)}
                className="w-14 text-center tabular-nums"
                aria-label="每月第几天"
              />
              <span className="text-caption text-muted-foreground">天</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground">或</span>
            <Select
              value={value.bySetPos ? String(value.bySetPos) : ''}
              onValueChange={(v) => handleSetPosChange(v ? parseInt(v) : 0)}
            >
              <SelectTrigger className="w-36 rounded-md">
                <SelectValue placeholder="选择第几个星期几" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不使用</SelectItem>
                <SelectItem value="1">第1个</SelectItem>
                <SelectItem value="2">第2个</SelectItem>
                <SelectItem value="3">第3个</SelectItem>
                <SelectItem value="4">第4个</SelectItem>
                <SelectItem value="-1">最后一个</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* End condition */}
      <div className="space-y-2 border-t border-border pt-3">
        <Label className="text-caption text-muted-foreground">结束条件</Label>
        <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5">
          <button
            type="button"
            aria-pressed={endType === 'none'}
            className={pillClass(endType === 'none')}
            onClick={() => {
              setEndType('none')
              const next = { ...value }
              delete next.count
              delete next.endDate
              onChange(next)
            }}
          >
            永不
          </button>
          <button
            type="button"
            aria-pressed={endType === 'count'}
            className={pillClass(endType === 'count')}
            onClick={() => setEndType('count')}
          >
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" aria-hidden="true" />
              次数
            </span>
          </button>
          <button
            type="button"
            aria-pressed={endType === 'date'}
            className={pillClass(endType === 'date')}
            onClick={() => setEndType('date')}
          >
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              日期
            </span>
          </button>
        </div>

        {endType === 'count' && (
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground">重复</span>
            <Input
              type="number"
              min={1}
              max={999}
              value={value.count != null ? value.count : ''}
              onChange={(e) => handleEndCount(parseInt(e.target.value) || 0)}
              className="w-20 text-center tabular-nums"
              placeholder="次数"
              aria-label="重复次数"
            />
            <span className="text-caption text-muted-foreground">次</span>
          </div>
        )}

        {endType === 'date' && (
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground">截止</span>
            <Input
              type="date"
              value={value.endDate || ''}
              onChange={(e) => handleEndDate(e.target.value)}
              aria-label="重复截止日期"
            />
          </div>
        )}
      </div>
    </div>
  )
}
