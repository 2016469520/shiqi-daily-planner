'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocus } from '@/hooks/use-focus'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { FocusRing } from './focus-ring'
import {
  Play,
  Pause,
  Square,
  Sparkles,
  Brain,
  Coffee,
  Plus,
  Minus,
  ChevronRight,
  TimerReset,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTagDisplayName } from '@/lib/display-labels'
import { toast } from 'sonner'
import { atmosphereEvents } from '@/lib/atmosphere/bus'
import {
  FOCUS_PRESETS,
  adjustMinutes,
  clampMinutes,
  countdownProgress,
  formatClock,
  overtimeLabel,
  stopwatchProgress,
} from '@/lib/focus/focus-core'

const STOPWATCH_TARGETS = [0, 15, 25, 45, 60]

/** 长按连加/连减的按钮：点按 ±1，Shift 点按 ±5，按住自动加速 */
function StepButton({
  direction,
  onStep,
  className,
}: {
  direction: -1 | 1
  onStep: (fine: boolean) => void
  className?: string
}) {
  const repeatRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (repeatRef.current) {
      clearTimeout(repeatRef.current)
      repeatRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const begin = useCallback(
    (fine: boolean) => {
      onStep(fine)
      let delay = 380
      const loop = () => {
        onStep(true)
        delay = Math.max(55, Math.round(delay * 0.82))
        repeatRef.current = setTimeout(loop, delay)
      }
      repeatRef.current = setTimeout(loop, delay)
    },
    [onStep]
  )

  return (
    <button
      type="button"
      aria-label={direction > 0 ? '增加时长' : '减少时长'}
      onPointerDown={(e) => {
        e.preventDefault()
        begin(!e.shiftKey)
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground ui-transition',
        'hover:border-border-strong hover:bg-surface-2 active:scale-95',
        className
      )}
    >
      {direction > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </button>
  )
}

interface FocusTimerProps {
  /** card：主应用里的完整卡片；widget：桌面浮窗里的紧凑版 */
  variant?: 'card' | 'widget'
}

export function HomeFocusTimer({ variant = 'card' }: FocusTimerProps) {
  const { user } = useAuth()
  const { tags: tagRepo } = useRepos()
  const focus = useFocus()
  const isWidget = variant === 'widget'

  const [minutes, setMinutes] = useState(25)
  const [target, setTarget] = useState(0)
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown')
  const [focusTagId, setFocusTagId] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  const handleStart = useCallback(
    (planned: number, nextMode: 'countdown' | 'stopwatch') => {
      // 角色进入"专注中"状态（真实会话开始，不是演出来的）
      atmosphereEvents.working()
      focus.start({
        planned_minutes: planned,
        timer_mode: nextMode,
        title: focusTagId ? `分类：${getTagDisplayName(tagList, focusTagId)}` : undefined,
        mode: 'focus',
      })
    },
    [focus, focusTagId, tagList]
  )

  const isActive = focus.isRunning || focus.isPaused
  const isPaused = focus.isPaused
  const isStopwatch = focus.timerMode === 'stopwatch'
  // 正计时的目标时长存在 planned_minutes 里，刷新/换窗口后依然能画出进度环
  const effectiveTarget = isStopwatch ? focus.plannedMinutes : 0
  const ringProgress = isStopwatch
    ? stopwatchProgress(focus.elapsedSeconds, effectiveTarget)
    : countdownProgress(focus.plannedMinutes, focus.remainingSeconds)
  const overtime = isStopwatch ? overtimeLabel(focus.elapsedSeconds, effectiveTarget) : null
  const displaySeconds = isStopwatch ? focus.elapsedSeconds : focus.remainingSeconds
  const ringVariant = overtime ? 'overtime' : isStopwatch ? 'break' : 'focus'
  const ringSize = isWidget ? 132 : 184
  const centerTime = formatClock(displaySeconds)

  // 仍在专注中：浮窗与主窗口共用一个会话，这里只做展示与操作
  if (isActive) {
    return (
      <div className={cn('rounded-xl', !isWidget && 'acg-frame')}>
        <div
          className={cn(
            'acg-surface rounded-[inherit] bg-card',
            isWidget ? 'p-2.5' : 'p-4',
            !isPaused && 'acg-shadow'
          )}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-micro',
                isPaused ? 'bg-warning/10 text-foreground/70' : 'acg-pill'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isPaused ? 'bg-warning' : 'bg-primary acg-breathe'
                )}
              />
              {isPaused ? '已暂停' : isStopwatch ? '正计时中' : '专注中'}
            </span>
            <span className="shrink-0 text-micro tabular-nums text-muted-foreground">
              {isStopwatch ? (target > 0 ? `目标 ${target} 分钟` : '自由计时') : `${focus.plannedMinutes} 分钟`}
            </span>
          </div>

          <div className="flex justify-center py-1">
            <FocusRing
              progress={ringProgress}
              variant={ringVariant}
              size={ringSize}
              strokeWidth={isWidget ? 7 : 9}
            >
              <span className="text-display tabular-nums">{centerTime}</span>
              {overtime ? (
                <span className="mt-0.5 text-micro font-medium tabular-nums text-destructive">
                  超出 {overtime}
                </span>
              ) : (
                <span className="mt-0.5 text-micro text-muted-foreground">
                  {isStopwatch ? '已专注' : '剩余'}
                </span>
              )}
              {focus.sessionTitle && !isWidget && (
                <span className="mt-1 max-w-[120px] truncate text-micro text-muted-foreground">
                  {focus.sessionTitle}
                </span>
              )}
            </FocusRing>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            {isPaused ? (
              <Button size="sm" onClick={focus.resume} className="h-8">
                <Play className="h-3.5 w-3.5" />继续
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={focus.pause} className="h-8">
                <Pause className="h-3.5 w-3.5" />暂停
              </Button>
            )}
            {!isStopwatch && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => focus.extend(1)}
                className="h-8"
                title="加 1 分钟"
              >
                <Plus className="h-3.5 w-3.5" />1
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              className="h-8 text-destructive hover:bg-destructive/10"
            >
              <Square className="h-3.5 w-3.5" />结束
            </Button>
          </div>

          <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>结束这次专注？</DialogTitle>
                <DialogDescription>
                  已用时间会记进统计。想继续的话按「取消」回到计时。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowCancelConfirm(false)
                    focus.cancel()
                  }}
                >
                  确认结束
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // 空闲态：选模式与时长
  const body = (
    <div className={cn('acg-surface rounded-[inherit] bg-card', isWidget ? 'p-2.5' : 'p-4')}>
      {/* 模式切换 */}
      <div className="mb-2 flex rounded-full bg-surface-2 p-0.5">
        {(
          [
            { key: 'countdown', label: '倒计时', icon: Brain },
            { key: 'stopwatch', label: '正计时', icon: TimerReset },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-micro ui-transition',
              mode === item.key
                ? 'acg-pill font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-3 w-3" />
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'countdown' ? (
        <>
          {/* 预设 */}
          <div className="mb-2 grid grid-cols-6 gap-1">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                onPointerDown={() => setMinutes(preset.minutes)}
                className={cn(
                  'flex h-9 flex-col items-center justify-center rounded-md text-micro ui-transition',
                  minutes === preset.minutes
                    ? 'border border-primary/30 bg-primary/10 font-semibold text-primary'
                    : 'border border-transparent text-muted-foreground hover:bg-surface-2'
                )}
                title={`${preset.hint}（${preset.minutes} 分钟）`}
              >
                {preset.kind === 'break' ? (
                  <Coffee className="mb-0.5 h-3 w-3 opacity-70" />
                ) : (
                  <Sparkles className="mb-0.5 h-3 w-3 opacity-70" />
                )}
                {preset.minutes}
              </button>
            ))}
          </div>

          {/* 时长微调：±1 分钟，按住连加，Shift 为 ±5 */}
          <div
            className="mb-2 flex items-center justify-center gap-3"
            onWheel={(e) => {
              e.preventDefault()
              setMinutes((prev) => adjustMinutes(prev, e.deltaY < 0 ? 1 : -1))
            }}
          >
            <StepButton direction={-1} onStep={(fine) => setMinutes((prev) => adjustMinutes(prev, -1, fine))} />
            <div className="flex flex-col items-center">
              <input
                data-testid="focus-minutes"
                type="number"
                min={1}
                max={240}
                value={minutes}
                onChange={(e) => {
                  const parsed = Number(e.target.value)
                  if (Number.isNaN(parsed)) return
                  setMinutes(clampMinutes(parsed))
                }}
                className="w-20 bg-transparent text-center text-display tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="专注时长（分钟）"
              />
              <span className="text-micro text-muted-foreground">分钟</span>
            </div>
            <StepButton direction={1} onStep={(fine) => setMinutes((prev) => adjustMinutes(prev, 1, fine))} />
          </div>

          <Slider
            value={[minutes]}
            onValueChange={(value) => {
              const arr = value as number[]
              if (arr.length > 0) setMinutes(clampMinutes(arr[0]))
            }}
            min={1}
            max={240}
            step={1}
            aria-label="专注时长滑块"
            className="mb-3"
            trackClassName="bg-surface-2"
            indicatorClassName="bg-primary"
            thumbClassName="border-primary/60 data-[dragging]:border-primary data-[dragging]:bg-primary"
          />
        </>
      ) : (
        <div className="mb-2 space-y-1.5">
          <p className="text-center text-micro text-muted-foreground">
            从 00:00 开始，先做起来再说
          </p>
          <div className="flex items-center justify-center gap-1">
            {STOPWATCH_TARGETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTarget(value)}
                className={cn(
                  'inline-flex h-8 items-center rounded-full px-2.5 text-micro ui-transition',
                  target === value
                    ? 'acg-pill font-medium'
                    : 'text-muted-foreground hover:bg-surface-2'
                )}
              >
                {value === 0 ? '不设目标' : `${value} 分`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 分类（浮窗里省掉，主窗口保留） */}
      {!isWidget && (
        <Select
          value={focusTagId || 'none'}
          onValueChange={(value) => setFocusTagId(value && value !== 'none' ? value : '')}
        >
          <SelectTrigger className="mb-2 h-8 text-caption">
            <SelectValue placeholder="选择专注分类">
              {focusTagId ? getTagDisplayName(tagList, focusTagId) : '选择专注分类'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不分类</SelectItem>
            {tagList.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        data-testid="focus-start"
        onClick={() => {
          if (mode === 'countdown' && minutes <= 0) {
            toast.error('请输入有效时长')
            return
          }
          handleStart(mode === 'stopwatch' ? target : minutes, mode)
        }}
        className="h-9 w-full"
      >
        <Play className="h-3.5 w-3.5" />
        {mode === 'stopwatch' ? '开始正计时' : `开始专注 · ${minutes} 分钟`}
      </Button>
    </div>
  )

  if (isWidget) {
    return <div className="rounded-xl">{body}</div>
  }

  return (
    <div className="acg-frame rounded-xl">
      <div className="rounded-[inherit] bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-between px-4 pt-3 pb-2"
        >
          <span className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            专注
          </span>
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform',
              !collapsed && 'rotate-90'
            )}
          />
        </button>
        {!collapsed && body}
      </div>
    </div>
  )
}
