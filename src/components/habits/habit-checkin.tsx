'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { CheckCircle2, Circle, Flame, Pencil, Trash2, Plus, Minus, Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HabitCheckinProps {
  compact?: boolean
}

const DEBOUNCE_MS = 600

export function HabitCheckin({ compact = false }: HabitCheckinProps) {
  const { user } = useAuth()
  const { habits, habitLogs } = useRepos()
  const queryClient = useQueryClient()
  const today = useToday()

  const [editLog, setEditLog] = useState<HabitLog | null>(null)
  const [deleteLog, setDeleteLog] = useState<HabitLog | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  // Per-habit save state: idle | saving | saved | error
  const [saveStates, setSaveStates] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  // Per-habit input values (for direct text entry)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  // === Draft/persist separation ===
  // draftValuesRef: local draft values that accumulate during rapid wheel/click,
  // independent of the query cache. Display shows draft ?? persisted.
  const draftValuesRef = useRef<Record<string, number>>({})
  // Bump this counter to trigger re-renders when draft changes
  const [, setDraftVersion] = useState(0)

  // Debounce timers
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Wheel throttle timestamps
  const wheelThrottle = useRef<Record<string, number>>({})
  // Save version per habit for race-condition protection
  const saveVersionRef = useRef<Record<string, number>>({})

  const { data: habitList = [], isLoading, isError: habitsError, error: habitsQueryError } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habits.getAll(user!.id),
    enabled: !!user,
    // Don't retry on 4xx errors (RLS, auth) to avoid flooding
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('PGRST')) return false
      return failureCount < 2
    },
  })

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['habitLogs', today],
    queryFn: () => habitLogs.getByDate(user!.id, today),
    enabled: !!user,
  })

  const invalidateLogs = () => {
    queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
    queryClient.invalidateQueries({ queryKey: ['habits'] })
  }

  const getLogForHabit = (habitId: string) =>
    todayLogs.find((l) => l.habit_id === habitId)

  // Compute active habits EARLY — must be before any useMemo/useCallback that reads it
  const activeHabits = habitList.filter((h) => !h.archived_at)

  // Stable refs for use in callbacks (avoids recreating wheel/click handlers)
  const getLogForHabitRef = useRef(getLogForHabit)
  useEffect(() => {
    getLogForHabitRef.current = getLogForHabit
  })

  // Stable ref for debouncedSave so createWheelHandler doesn't depend on it
  const debouncedSaveRef = useRef<((habitId: string, value: number, targetValue: number) => void) | null>(null)

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

  // ---- Boolean toggle ----
  const toggleBoolean = useCallback(
    async (habit: Habit) => {
      if (!user || savingIds.has(habit.id)) return
      setSavingIds((prev) => new Set(prev).add(habit.id))
      try {
        const existing = getLogForHabitRef.current(habit.id)
        if (existing?.is_completed) {
          await habitLogs.update(user.id, existing.id, { is_completed: false, value: 0 })
        } else if (existing) {
          await habitLogs.update(user.id, existing.id, {
            is_completed: true,
            value: habit.target_value,
          })
        } else {
          await habitLogs.create(user.id, {
            habit_id: habit.id,
            log_date: today,
            value: habit.target_value,
            is_completed: true,
          })
        }
        invalidateLogs()
        toast.success(existing?.is_completed ? '已取消打卡' : '打卡成功')
      } catch {
        toast.error('操作失败')
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev)
          next.delete(habit.id)
          return next
        })
      }
    },
    [user, habitLogs, today, savingIds]
  )

  // ---- Core save function ----
  const saveValue = useCallback(
    async (habitId: string, value: number, targetValue: number) => {
      if (!user) return
      const sane = Math.max(0, value)
      const existing = getLogForHabitRef.current(habitId)
      const isCompleted = sane >= targetValue
      if (existing) {
        await habitLogs.update(user.id, existing.id, { value: sane, is_completed: isCompleted })
      } else {
        await habitLogs.create(user.id, {
          habit_id: habitId,
          log_date: today,
          value: sane,
          is_completed: isCompleted,
        })
      }
      // Invalidate queries after save (only fires on debounced final save, not per-notch)
      invalidateLogs()
    },
    [user, habitLogs, today]
  )

  // ---- Debounced auto-save with race-condition protection ----
  const debouncedSave = useCallback(
    (habitId: string, value: number, targetValue: number) => {
      // Clear existing timer
      if (debounceTimers.current[habitId]) {
        clearTimeout(debounceTimers.current[habitId])
      }

      // Increment save version for race-condition protection
      const version = (saveVersionRef.current[habitId] || 0) + 1
      saveVersionRef.current[habitId] = version

      // Set timer — save only fires after user stops adjusting for DEBOUNCE_MS
      debounceTimers.current[habitId] = setTimeout(async () => {
        // Check if a newer save was queued while we were waiting
        if (saveVersionRef.current[habitId] !== version) return

        setSaveStates((prev) => ({ ...prev, [habitId]: 'saving' }))
        try {
          await saveValue(habitId, value, targetValue)
          // Only clear draft if the saved value matches current draft
          // (if user kept scrolling, draft is newer and should stay)
          clearDraftIfMatch(habitId, value)
          setSaveStates((prev) => ({ ...prev, [habitId]: 'saved' }))
          // Clear saved state after 1.5s
          setTimeout(() => {
            setSaveStates((prev) => {
              const next = { ...prev }
              if (next[habitId] === 'saved') next[habitId] = 'idle'
              return next
            })
          }, 1500)
        } catch {
          // Save failed but draft value stays — user doesn't lose input
          setSaveStates((prev) => ({ ...prev, [habitId]: 'error' }))
        }
      }, DEBOUNCE_MS)
    },
    [saveValue, clearDraftIfMatch]
  )
  // Keep ref in sync so createWheelHandler can use it without depending on it
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave
  })

  // ---- Wheel handler (draft accumulation, no per-notch save) ----
  // Only depends on [today] — stable across renders (today changes once/day)
  // Uses refs for all mutable values so callbacks never go stale
  const createWheelHandler = useCallback(
    (habit: Habit) => {
      return (e: WheelEvent) => {
        e.preventDefault()
        const now = Date.now()
        const last = wheelThrottle.current[habit.id] || 0
        // 80ms throttle to handle trackpad high-frequency events
        if (now - last < 80) return
        wheelThrottle.current[habit.id] = now

        // Read base value: prefer draft (accumulated locally), fall back to persisted
        const key = `${habit.id}-${today}`
        const draftVal = draftValuesRef.current[key]
        const existing = getLogForHabitRef.current(habit.id)
        const baseValue = draftVal !== undefined ? draftVal : (existing?.value ?? 0)

        const delta = e.deltaY < 0 ? 1 : e.deltaY > 0 ? -1 : 0
        if (delta === 0) return
        const newValue = Math.max(0, baseValue + delta)

        // Update local draft immediately (UI updates without save)
        draftValuesRef.current[key] = newValue
        setDraftVersion((v) => v + 1)

        // Debounced save via ref (stable — doesn't recreate wheel handler)
        debouncedSaveRef.current?.(habit.id, newValue, habit.target_value)
      }
    },
    [today]
  )

  // ---- Pre-compute wheel handler map ----
  // Note: activeHabits is computed early (above) to avoid TDZ errors
  const wheelHandlers = useMemo(() => {
    const map: Record<string, (e: WheelEvent) => void> = {}
    for (const habit of activeHabits) {
      map[`${habit.id}-${today}`] = createWheelHandler(habit)
    }
    return map
    // activeHabits is stable (derived from useQuery data with structural sharing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitList, today, createWheelHandler])

  // ---- +/- button adjust (draft accumulation + debounce) ----
  const adjustValue = useCallback(
    (habit: Habit, delta: number) => {
      const key = `${habit.id}-${today}`
      const draftVal = draftValuesRef.current[key]
      const existing = getLogForHabitRef.current(habit.id)
      const baseValue = draftVal !== undefined ? draftVal : (existing?.value ?? 0)
      const newValue = Math.max(0, baseValue + delta)

      // Update draft
      draftValuesRef.current[key] = newValue
      setDraftVersion((v) => v + 1)

      // Debounced save
      debouncedSave(habit.id, newValue, habit.target_value)
    },
    [debouncedSave, today]
  )

  // ---- Direct input save (immediate: user explicitly confirmed via Enter/blur) ----
  const handleInputSave = useCallback(
    async (habit: Habit) => {
      if (!user) return
      const key = `${habit.id}-${today}`
      const raw = inputValues[key]
      if (raw === undefined || raw === '') return
      const val = parseFloat(raw)
      if (isNaN(val) || val < 0) {
        toast.error('请输入有效数值')
        return
      }
      // Clear any pending debounced save for this habit
      if (debounceTimers.current[habit.id]) {
        clearTimeout(debounceTimers.current[habit.id])
      }
      // Bump save version to cancel any in-flight debounced save
      saveVersionRef.current[habit.id] = (saveVersionRef.current[habit.id] || 0) + 1

      setSaveStates((prev) => ({ ...prev, [habit.id]: 'saving' }))
      try {
        await saveValue(habit.id, val, habit.target_value)
        // Clear draft and input
        clearDraftIfMatch(habit.id, val)
        setInputValues((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        setSaveStates((prev) => ({ ...prev, [habit.id]: 'saved' }))
        setTimeout(() => {
          setSaveStates((prev) => {
            const next = { ...prev }
            if (next[habit.id] === 'saved') next[habit.id] = 'idle'
            return next
          })
        }, 1500)
      } catch {
        setSaveStates((prev) => ({ ...prev, [habit.id]: 'error' }))
        toast.error('保存失败')
      }
    },
    [user, saveValue, clearDraftIfMatch, inputValues, today]
  )

  // ---- Edit/Delete log ----
  const handleEditLog = (log: HabitLog) => {
    setEditLog(log)
    setEditValue(String(log.value))
  }

  const saveEditLog = useCallback(async () => {
    if (!user || !editLog) return
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      toast.error('请输入有效数值')
      return
    }
    try {
      const habit = habitList.find((h) => h.id === editLog.habit_id)
      const isCompleted = habit ? val >= habit.target_value : editLog.is_completed
      await habitLogs.update(user.id, editLog.id, { value: val, is_completed: isCompleted })
      setEditLog(null)
      invalidateLogs()
      toast.success('已更新')
    } catch {
      toast.error('更新失败')
    }
  }, [user, habitLogs, editLog, editValue, habitList])

  const confirmDeleteLog = useCallback(async () => {
    if (!user || !deleteLog) return
    try {
      await habitLogs.delete(user.id, deleteLog.id)
      setDeleteLog(null)
      invalidateLogs()
      toast.success('已删除')
    } catch {
      toast.error('删除失败')
    }
  }, [user, habitLogs, deleteLog])

  // Retry failed save with latest draft value
  const retrySave = useCallback(
    (habit: Habit) => {
      const key = `${habit.id}-${today}`
      const draftVal = draftValuesRef.current[key]
      const existing = getLogForHabitRef.current(habit.id)
      const valueToSave = draftVal !== undefined ? draftVal : (existing?.value ?? 0)
      setSaveStates((prev) => ({ ...prev, [habit.id]: 'idle' }))
      debouncedSave(habit.id, valueToSave, habit.target_value)
    },
    [debouncedSave, today]
  )

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout)
    }
  }, [])

  if (isLoading) {
    return (
      <div className={cn('space-y-2', compact && 'space-y-1')}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (habitsError) {
    return (
      <div className="surface space-y-2 border-destructive/30 p-6 text-center">
        <p className="text-body text-destructive">加载习惯数据失败</p>
        <p className="text-micro text-muted-foreground">
          {habitsQueryError instanceof Error
            ? habitsQueryError.message.slice(0, 100)
            : '请检查网络连接后刷新重试'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['habits'] })}
        >
          重试
        </Button>
      </div>
    )
  }

  if (activeHabits.length === 0) {
    if (compact) return null
    return (
      <div className="surface flex flex-col items-center gap-2 px-4 py-10 text-center">
        <Flame className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-body">还没有习惯</p>
        <p className="text-caption text-muted-foreground">去创建第一个，从今天开始</p>
      </div>
    )
  }

  const completedCount = activeHabits.filter((h) => getLogForHabit(h.id)?.is_completed).length
  const completionPct =
    activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0

  return (
    <>
      <div className="surface overflow-hidden">
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-border px-4',
            compact ? 'py-2.5' : 'py-3'
          )}
        >
          <div className="flex items-baseline gap-2">
            <span className={compact ? 'text-caption font-medium' : 'text-section'}>今日习惯</span>
            <span className="text-micro tabular-nums text-muted-foreground">
              {completedCount}/{activeHabits.length} 已完成
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary ui-transition"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-micro tabular-nums text-muted-foreground">{completionPct}%</span>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {activeHabits.map((habit) => {
            const log = getLogForHabit(habit.id)
            const isChecked = log?.is_completed ?? false
            const persistedValue = log?.value ?? 0
            const type = habit.measurement_type as MeasurementType
            const effectiveType = type === 'duration' ? 'minutes' : type
            const habitKey = `${habit.id}-${today}`
            const inputVal = inputValues[habitKey]
            const saveState = saveStates[habit.id] || 'idle'
            const isSaving = savingIds.has(habit.id)
            const unitLabel = getUnitForType(effectiveType, habit)

            // Display value: draft (local) takes precedence over persisted
            const displayValue = getDisplayValue(habit.id, persistedValue)
            const hasDraft = displayValue !== persistedValue
            const progressPct =
              habit.target_value > 0
                ? Math.min(100, Math.round((displayValue / habit.target_value) * 100))
                : 0

            // Stable wheel handler from pre-computed memo map
            const wheelHandlerKey = `${habit.id}-${today}`
            const wheelHandler = wheelHandlers[wheelHandlerKey]

            return (
              <li
                key={habit.id}
                className={cn(
                  'group flex min-h-11 gap-2 px-4 py-3 ui-transition hover:bg-surface-2',
                  effectiveType === 'boolean'
                    ? 'items-center'
                    : 'flex-col sm:flex-row sm:items-center sm:gap-3'
                )}
              >
                {/* 名称 + 今日状态 */}
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium">{habit.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {effectiveType === 'boolean' ? (
                        <span
                          className={cn(
                            'text-micro',
                            isChecked ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {isChecked ? '今日已完成' : '今日未完成'}
                        </span>
                      ) : (
                        <>
                          <span className="text-micro tabular-nums text-muted-foreground">
                            {displayValue} / {habit.target_value}
                            {unitLabel ? ` ${unitLabel}` : ''}
                          </span>
                          <span className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full rounded-full bg-primary ui-transition"
                              style={{ width: `${progressPct}%` }}
                            />
                          </span>
                          {displayValue >= habit.target_value && habit.target_value > 0 && (
                            <span className="text-micro text-primary">已达标</span>
                          )}
                        </>
                      )}
                      <SaveStatus
                        state={isSaving ? 'saving' : saveState}
                        hasDraft={hasDraft}
                      />
                    </div>
                  </div>
                </div>

                {/* 计量控件 + 操作 */}
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  {effectiveType === 'boolean' ? (
                    <Button
                      data-testid="habit-checkin-toggle"
                      variant={isChecked ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 shrink-0 px-3 text-caption"
                      onClick={() => toggleBoolean(habit)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isChecked ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                      <span>{isChecked ? '已完成' : '打卡'}</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <MinuteControl
                        habit={habit}
                        inputVal={inputVal}
                        displayValue={displayValue}
                        persistedValue={persistedValue}
                        effectiveType={effectiveType}
                        saveState={saveState}
                        onInputChange={(v) => setInputValues((prev) => ({ ...prev, [habitKey]: v }))}
                        onInputSave={() => handleInputSave(habit)}
                        onAdjust={(delta) => adjustValue(habit, delta)}
                        onWheel={wheelHandler}
                        onRetry={() => retrySave(habit)}
                      />

                      <div className="flex items-center gap-0.5">
                        {log && (
                          <>
                            <Button
                              variant="ghost" size="icon-sm"
                              onClick={() => handleEditLog(log)}
                              aria-label="编辑打卡记录"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost" size="icon-sm"
                              onClick={() => setDeleteLog(log)}
                              aria-label="删除打卡记录"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Edit log dialog */}
      <Dialog open={!!editLog} onOpenChange={() => setEditLog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>修改打卡记录</DialogTitle>
            <DialogDescription>
              修改 {editLog?.log_date} 的记录值
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="text"
              inputMode="decimal"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="输入数值"
              autoFocus
              className="w-full"
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

// ============================================================
// Sub-components
// ============================================================

/** 保存状态：始终用 text-micro + 状态色展示，不依赖 toast */
function SaveStatus({
  state,
  hasDraft,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error'
  hasDraft?: boolean
}) {
  if (state === 'saving') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-micro text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        保存中
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-micro text-success">
        <Check className="h-3 w-3" />
        已保存
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-micro text-destructive">
        <AlertCircle className="h-3 w-3" />
        保存失败
      </span>
    )
  }
  if (hasDraft) {
    return <span className="inline-flex shrink-0 items-center gap-1 text-micro text-muted-foreground">待保存</span>
  }
  return null
}

/** Stable minute/value control with wheel support */
function MinuteControl({
  habit,
  inputVal,
  displayValue,
  persistedValue,
  effectiveType,
  saveState,
  onInputChange,
  onInputSave,
  onAdjust,
  onWheel,
  onRetry,
}: {
  habit: Habit
  inputVal: string | undefined
  displayValue: number
  persistedValue: number
  effectiveType: string
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onInputChange: (v: string) => void
  onInputSave: () => void
  onAdjust: (delta: number) => void
  onWheel: (e: WheelEvent) => void
  onRetry: () => void
}) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')

  // Attach wheel listener (stable: onWheel identity only changes when today changes)
  useEffect(() => {
    const el = wheelRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const step = getStepForType(effectiveType, habit)
  const unit = getUnitForType(effectiveType, habit)
  const showValue = inputVal !== undefined ? inputVal : displayValue
  const hasDraft = displayValue !== persistedValue

  const commitEdit = () => {
    const val = parseFloat(editText)
    if (!isNaN(val) && val >= 0) {
      onInputChange(String(val))
      onInputSave()
    }
    setIsEditing(false)
    setEditText('')
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditText('')
  }

  // Fragment 渲染：子元素由父级 flex 行统一排布
  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8"
        onClick={() => onAdjust(-step)}
        disabled={displayValue <= 0}
        aria-label={`减少 ${step}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      {/* 值显示 / 输入（支持滚轮）— 失败态点击重试 */}
      <div ref={wheelRef} className="relative flex w-12 items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className={cn(
              'h-8 w-full rounded-md border bg-background text-center text-body font-medium tabular-nums outline-none',
              saveState === 'error' ? 'border-destructive' : 'border-ring'
            )}
            aria-label="输入数值"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (saveState === 'error') {
                onRetry()
              } else {
                setIsEditing(true)
                setEditText(String(showValue))
              }
            }}
            className={cn(
              'h-8 w-full cursor-text rounded-md border bg-background text-center text-body font-medium tabular-nums ui-transition',
              hasDraft && 'border-warning/50 bg-warning/10',
              saveState === 'error'
                ? 'border-destructive text-destructive hover:border-destructive/80'
                : 'border-border hover:bg-surface-2'
            )}
            aria-label={`当前值 ${showValue}${hasDraft ? '（未保存）' : ''}，点击编辑`}
            title={saveState === 'error' ? '保存失败，点击重试' : hasDraft ? '未保存的更改' : undefined}
          >
            {showValue}
          </button>
        )}
      </div>

      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8"
        onClick={() => onAdjust(step)}
        aria-label={`增加 ${step}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>

      {/* 单位：固定宽度，避免行内跳动 */}
      <span className="w-8 select-none truncate text-center text-micro text-muted-foreground">
        {unit || ''}
      </span>
    </>
  )
}

// ---- Helpers ----

function getStepForType(effectiveType: string, habit: Habit): number {
  switch (effectiveType) {
    case 'minutes':
      return 1
    case 'hours':
      return 0.5
    case 'count':
      return 1
    case 'numeric':
      if (habit.unit === '小时' || habit.unit === 'h') return 0.5
      if (habit.target_value <= 10) return 1
      if (habit.target_value <= 100) return 5
      return 10
    default:
      return 1
  }
}

function getUnitForType(effectiveType: string, habit: Habit): string | undefined {
  switch (effectiveType) {
    case 'minutes':
      return '分钟'
    case 'hours':
      return '小时'
    case 'count':
      return '次'
    case 'numeric':
      return habit.unit || undefined
    default:
      return undefined
  }
}
