'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToday } from '@/hooks/use-today'
import type { Habit, HabitLog, MeasurementType } from '@/types'
import { CheckSquare, ChevronRight, Plus, Minus, Check, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DEBOUNCE_MS = 600

export function HomeHabitsSummary() {
  const { user } = useAuth()
  const { habits: habitRepo, habitLogs: logRepo } = useRepos()
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [editLog, setEditLog] = useState<HabitLog | null>(null)
  const [deleteLog, setDeleteLog] = useState<HabitLog | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveStates, setSaveStates] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})

  // === Draft/persist separation ===
  const draftValuesRef = useRef<Record<string, number>>({})
  const [, setDraftVersion] = useState(0)

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const wheelThrottle = useRef<Record<string, number>>({})
  const saveVersionRef = useRef<Record<string, number>>({})

  const today = useToday()

  const { data: habits = [], isError: habitsError } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitRepo.getAll(user!.id),
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('PGRST')) return false
      return failureCount < 2
    },
  })

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['habitLogs', today],
    queryFn: () => logRepo.getByDate(user!.id, today),
    enabled: !!user,
  })

  const activeHabits = habits.filter((h) => !h.archived_at)

  const getLog = (habitId: string): HabitLog | undefined =>
    todayLogs.find((l) => l.habit_id === habitId)

  // Stable ref for getLog
  const getLogRef = useRef(getLog)
  useEffect(() => {
    getLogRef.current = getLog
  })

  // Stable ref for debouncedSave so createWheelHandler doesn't depend on it
  const debouncedSaveRef = useRef<((habitId: string, value: number, targetValue: number) => void) | null>(null)

  // Cache per-habit wheel handlers so they don't change on every render
  // (wheelHandlersRef removed — using useMemo below instead)

  const invalidateLogs = () => {
    queryClient.invalidateQueries({ queryKey: ['habitLogs', today] })
    queryClient.invalidateQueries({ queryKey: ['habits'] })
  }

  // ---- Draft helpers ----
  const getDisplayValue = useCallback(
    (habitId: string, persistedValue: number) => {
      const key = `${habitId}-${today}`
      const draft = draftValuesRef.current[key]
      return draft !== undefined ? draft : persistedValue
    },
    [today]
  )

  const clearDraftIfMatch = useCallback(
    (habitId: string, savedValue: number) => {
      const key = `${habitId}-${today}`
      if (draftValuesRef.current[key] === savedValue) {
        delete draftValuesRef.current[key]
        setDraftVersion((v) => v + 1)
      }
    },
    [today]
  )

  // ---- Core save ----
  const saveValue = useCallback(
    async (habitId: string, value: number, targetValue: number) => {
      if (!user) return
      const sane = Math.max(0, value)
      const existing = getLogRef.current(habitId)
      const isCompleted = sane >= targetValue
      if (existing) {
        await logRepo.update(user.id, existing.id, { value: sane, is_completed: isCompleted })
      } else {
        await logRepo.create(user.id, {
          habit_id: habitId,
          log_date: today,
          value: sane,
          is_completed: isCompleted,
        })
      }
      invalidateLogs()
    },
    [user, logRepo, today]
  )

  // ---- Boolean toggle ----
  const handleToggle = useCallback(
    async (habit: Habit) => {
      if (!user || togglingIds.has(habit.id)) return
      setTogglingIds((prev) => new Set(prev).add(habit.id))
      try {
        const existing = getLogRef.current(habit.id)
        if (existing?.is_completed) {
          await logRepo.update(user.id, existing.id, { is_completed: false, value: 0 })
        } else if (existing) {
          await logRepo.update(user.id, existing.id, { is_completed: true, value: habit.target_value })
        } else {
          await logRepo.create(user.id, {
            habit_id: habit.id,
            log_date: today,
            value: habit.target_value,
            is_completed: true,
          })
        }
        invalidateLogs()
      } catch {
        toast.error('打卡失败')
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev)
          next.delete(habit.id)
          return next
        })
      }
    },
    [user, logRepo, togglingIds, today]
  )

  // ---- Debounced save with race-condition protection ----
  const debouncedSave = useCallback(
    (habitId: string, value: number, targetValue: number) => {
      if (debounceTimers.current[habitId]) clearTimeout(debounceTimers.current[habitId])

      const version = (saveVersionRef.current[habitId] || 0) + 1
      saveVersionRef.current[habitId] = version

      debounceTimers.current[habitId] = setTimeout(async () => {
        // Check if a newer save was queued
        if (saveVersionRef.current[habitId] !== version) return

        setSaveStates((prev) => ({ ...prev, [habitId]: 'saving' }))
        try {
          await saveValue(habitId, value, targetValue)
          clearDraftIfMatch(habitId, value)
          setSaveStates((prev) => ({ ...prev, [habitId]: 'saved' }))
          setTimeout(() => {
            setSaveStates((prev) => {
              const next = { ...prev }
              if (next[habitId] === 'saved') next[habitId] = 'idle'
              return next
            })
          }, 1500)
        } catch {
          setSaveStates((prev) => ({ ...prev, [habitId]: 'error' }))
        }
      }, DEBOUNCE_MS)
    },
    [saveValue, clearDraftIfMatch]
  )
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave
  })

  // ---- Immediate adjust (draft accumulation + debounce) ----
  const handleAdjust = useCallback(
    (habit: Habit, delta: number) => {
      const key = `${habit.id}-${today}`
      const draftVal = draftValuesRef.current[key]
      const existing = getLogRef.current(habit.id)
      const baseValue = draftVal !== undefined ? draftVal : (existing?.value ?? 0)
      const newValue = Math.max(0, baseValue + delta)

      draftValuesRef.current[key] = newValue
      setDraftVersion((v) => v + 1)

      debouncedSave(habit.id, newValue, habit.target_value)
    },
    [debouncedSave, today]
  )

  // ---- Wheel handler (draft accumulation, no per-notch save) ----
  // Only depends on [today] — stable across renders. Uses refs for all mutable values.
  const createWheelHandler = useCallback(
    (habit: Habit) => {
      return (e: WheelEvent) => {
        e.preventDefault()
        const now = Date.now()
        const last = wheelThrottle.current[habit.id] || 0
        if (now - last < 80) return
        wheelThrottle.current[habit.id] = now

        const key = `${habit.id}-${today}`
        const draftVal = draftValuesRef.current[key]
        const existing = getLogRef.current(habit.id)
        const baseValue = draftVal !== undefined ? draftVal : (existing?.value ?? 0)
        const step = getHomeStep(habit)
        const delta = e.deltaY < 0 ? step : e.deltaY > 0 ? -step : 0
        if (delta === 0) return
        const newValue = Math.max(0, baseValue + delta)

        draftValuesRef.current[key] = newValue
        setDraftVersion((v) => v + 1)

        debouncedSaveRef.current?.(habit.id, newValue, habit.target_value)
      }
    },
    [today]
  )

  // ---- Pre-compute wheel handler map (no ref access during render) ----
  const wheelHandlers = useMemo(() => {
    const map: Record<string, (e: WheelEvent) => void> = {}
    for (const habit of activeHabits) {
      map[`${habit.id}-${today}`] = createWheelHandler(habit)
    }
    return map
    // habits is stable (TanStack Query structural sharing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, today, createWheelHandler])

  // ---- Retry failed save ----
  const retrySave = useCallback(
    (habit: Habit) => {
      const key = `${habit.id}-${today}`
      const draftVal = draftValuesRef.current[key]
      const existing = getLogRef.current(habit.id)
      const valueToSave = draftVal !== undefined ? draftVal : (existing?.value ?? 0)
      setSaveStates((prev) => ({ ...prev, [habit.id]: 'idle' }))
      debouncedSave(habit.id, valueToSave, habit.target_value)
    },
    [debouncedSave, today]
  )

  // ---- Edit/Delete log ----
  const handleEditLog = (log: HabitLog) => {
    setEditLog(log)
    setEditValue(String(log.value))
  }

  const saveEditLog = useCallback(async () => {
    if (!user || !editLog) return
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) { toast.error('请输入有效数值'); return }
    try {
      const habit = habits.find((h) => h.id === editLog.habit_id)
      const isCompleted = habit ? val >= habit.target_value : editLog.is_completed
      await logRepo.update(user.id, editLog.id, { value: val, is_completed: isCompleted })
      setEditLog(null)
      invalidateLogs()
      toast.success('已更新')
    } catch { toast.error('更新失败') }
  }, [user, logRepo, editLog, editValue, habits])

  const confirmDeleteLog = useCallback(async () => {
    if (!user || !deleteLog) return
    try {
      await logRepo.delete(user.id, deleteLog.id)
      setDeleteLog(null)
      invalidateLogs()
      toast.success('已删除')
    } catch { toast.error('删除失败') }
  }, [user, logRepo, deleteLog])

  // Cleanup
  useEffect(() => {
    return () => { Object.values(debounceTimers.current).forEach(clearTimeout) }
  }, [])

  // Silently handle habits query error — don't break the home page
  // The full habits page has its own error boundary for detailed errors
  if (habitsError) {
    return (
      <div className="surface border-destructive/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground">今日习惯</span>
          <span className="text-micro text-destructive">加载失败</span>
        </div>
      </div>
    )
  }

  if (activeHabits.length === 0) {
    return (
      <div className="surface p-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground">今日习惯</span>
          <Link
            href="/habits"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-6 text-caption')}
          >
            添加
          </Link>
        </div>
        <p className="py-2 text-center text-caption text-muted-foreground">暂无习惯，去添加吧</p>
      </div>
    )
  }

  const completedCount = activeHabits.filter((h) => {
    const log = getLog(h.id)
    return log?.is_completed
  }).length
  const completionPct =
    activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0

  return (
    <>
      <div className="surface p-3">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground ui-transition hover:text-foreground"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              今日习惯
              <span className="text-micro tabular-nums text-muted-foreground">
                {completedCount}/{activeHabits.length}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <Link
                href="/habits"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-6 text-caption')}
              >
                全部
              </Link>
              <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', !collapsed && 'rotate-90')} />
            </div>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary ui-transition"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {!collapsed && (
          <div className="space-y-0.5">
            {activeHabits.map((habit) => {
              const log = getLog(habit.id)
              const isDone = log?.is_completed
              const persistedValue = log?.value ?? 0
              const type = (habit.measurement_type as MeasurementType)
              const effectiveType = type === 'duration' ? 'minutes' : type
              const saveState = saveStates[habit.id] || 'idle'
              const displayValue = getDisplayValue(habit.id, persistedValue)

              // Stable wheel handler from pre-computed memo map
              const wheelHandlerKey = `${habit.id}-${today}`
              const wheelHandler = wheelHandlers[wheelHandlerKey]

              return (
                <HomeHabitRow
                  key={habit.id}
                  habit={habit}
                  log={log}
                  isDone={isDone}
                  displayValue={displayValue}
                  persistedValue={persistedValue}
                  effectiveType={effectiveType}
                  saveState={saveState}
                  togglingIds={togglingIds}
                  onToggle={handleToggle}
                  onAdjust={handleAdjust}
                  onWheel={wheelHandler}
                  onEditLog={handleEditLog}
                  onDeleteLog={setDeleteLog}
                  onRetry={() => retrySave(habit)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Edit log dialog */}
      <Dialog open={!!editLog} onOpenChange={() => setEditLog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>修改打卡记录</DialogTitle>
            <DialogDescription>修改 {editLog?.log_date} 的记录值</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              type="text"
              inputMode="decimal"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="输入数值"
              autoFocus
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-body"
              onKeyDown={(e) => { if (e.key === 'Enter') saveEditLog() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLog(null)}>取消</Button>
            <Button onClick={saveEditLog}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete log confirmation */}
      <Dialog open={!!deleteLog} onOpenChange={() => setDeleteLog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除打卡记录</DialogTitle>
            <DialogDescription>
              确定要删除 {deleteLog?.log_date} 的打卡记录吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLog(null)}>取消</Button>
            <Button variant="destructive" onClick={confirmDeleteLog}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---- Home habit row ----

function HomeHabitRow({
  habit, log, isDone, displayValue, persistedValue, effectiveType, saveState, togglingIds,
  onToggle, onAdjust, onWheel, onEditLog, onDeleteLog, onRetry,
}: {
  habit: Habit
  log: HabitLog | undefined
  isDone: boolean | undefined
  displayValue: number
  persistedValue: number
  effectiveType: string
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  togglingIds: Set<string>
  onToggle: (h: Habit) => void
  onAdjust: (h: Habit, delta: number) => void
  onWheel: (e: WheelEvent) => void
  onEditLog: (l: HabitLog) => void
  onDeleteLog: (l: HabitLog) => void
  onRetry: () => void
}) {
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wheelRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const step = getHomeStep(habit)
  const unit = getHomeUnit(effectiveType, habit)
  const hasDraft = displayValue !== persistedValue
  const progressPct =
    habit.target_value > 0
      ? Math.min(100, Math.round((displayValue / habit.target_value) * 100))
      : 0

  return (
    <div
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 ui-transition hover:bg-surface-2',
        isDone && 'opacity-70'
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-caption font-medium">{habit.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {effectiveType !== 'boolean' ? (
            <>
              <span className="text-micro tabular-nums text-muted-foreground">
                {displayValue}/{habit.target_value}
                {unit ? ` ${unit}` : ''}
              </span>
              <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary ui-transition"
                  style={{ width: `${progressPct}%` }}
                />
              </span>
            </>
          ) : (
            <span className={cn('text-micro', isDone ? 'text-primary' : 'text-muted-foreground')}>
              {isDone ? '今日已完成' : '今日未完成'}
            </span>
          )}
          <MiniSaveState state={saveState} hasDraft={hasDraft} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {effectiveType === 'boolean' ? (
          <button
            onClick={() => onToggle(habit)}
            disabled={togglingIds.has(habit.id)}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ui-transition',
              isDone
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-strong hover:border-primary'
            )}
            aria-label={isDone ? '取消打卡' : '打卡'}
          >
            {togglingIds.has(habit.id) ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isDone ? (
              <Check className="h-3 w-3" />
            ) : null}
          </button>
        ) : (
          <>
            {/* +/- 控件 */}
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost" size="icon-sm"
                onClick={() => onAdjust(habit, -step)}
                disabled={displayValue <= 0}
                aria-label={`减少 ${step}`}
              >
                <Minus className="h-3 w-3" />
              </Button>

              {/* Wheel-aware value display — click on error to retry */}
              <div ref={wheelRef} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (saveState === 'error') onRetry()
                  }}
                  className={cn(
                    'inline-flex h-7 min-w-8 items-center justify-center rounded-md border px-1 text-caption font-medium tabular-nums ui-transition',
                    saveState === 'error'
                      ? 'border-destructive text-destructive'
                      : hasDraft
                        ? 'border-warning/50 bg-warning/10'
                        : 'border-border'
                  )}
                  title={saveState === 'error' ? '保存失败，点击重试' : hasDraft ? '未保存的更改' : undefined}
                >
                  {displayValue}
                </button>
              </div>

              <Button
                variant="ghost" size="icon-sm"
                onClick={() => onAdjust(habit, step)}
                aria-label={`增加 ${step}`}
              >
                <Plus className="h-3 w-3" />
              </Button>

              {unit && (
                <span className="shrink-0 text-micro text-muted-foreground">{unit}</span>
              )}
            </div>

            {/* 操作区 */}
            <div className="flex shrink-0 items-center">
              {log && (
                <>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => onEditLog(log)} aria-label="编辑打卡记录">
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => onDeleteLog(log)} aria-label="删除打卡记录">
                    <Trash2 className="h-3 w-3 text-destructive/60" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MiniSaveState({
  state,
  hasDraft,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error'
  hasDraft?: boolean
}) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        保存中
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-success">
        <Check className="h-2.5 w-2.5" />
        已保存
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-destructive">
        <AlertCircle className="h-2.5 w-2.5" />
        保存失败
      </span>
    )
  }
  if (hasDraft) {
    return <span className="text-micro text-muted-foreground">待保存</span>
  }
  return null
}

// ---- Helpers ----

function getHomeStep(habit: Habit): number {
  const type = habit.measurement_type === 'duration' ? 'minutes' : habit.measurement_type
  switch (type) {
    case 'minutes': return 1
    case 'hours': return 0.5
    case 'count': return 1
    case 'numeric':
      if (habit.unit === '小时' || habit.unit === 'h') return 0.5
      if (habit.target_value <= 10) return 1
      if (habit.target_value <= 100) return 5
      return 10
    default: return 1
  }
}

function getHomeUnit(effectiveType: string, habit: Habit): string | undefined {
  switch (effectiveType) {
    case 'minutes': return '分钟'
    case 'hours': return '小时'
    case 'count': return '次'
    case 'numeric': return habit.unit || undefined
    default: return undefined
  }
}
