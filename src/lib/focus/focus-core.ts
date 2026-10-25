// ============================================================
// 专注时长核心逻辑（纯函数，便于单元测试）
// ============================================================

export const MIN_MINUTES = 1
export const MAX_MINUTES = 240

export interface FocusPreset {
  label: string
  minutes: number
  kind: 'focus' | 'break'
  hint: string
}

/** 常用时长：番茄 25 / 深度 45 / 冲刺 60，短休 5、长休 15 */
export const FOCUS_PRESETS: FocusPreset[] = [
  { label: '5', minutes: 5, kind: 'break', hint: '短休' },
  { label: '15', minutes: 15, kind: 'break', hint: '长休' },
  { label: '25', minutes: 25, kind: 'focus', hint: '一颗番茄' },
  { label: '45', minutes: 45, kind: 'focus', hint: '深度专注' },
  { label: '60', minutes: 60, kind: 'focus', hint: '整点冲刺' },
  { label: '90', minutes: 90, kind: 'focus', hint: '超长档' },
]

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return MIN_MINUTES
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)))
}

/** 正计时每 30 分钟提醒一次 */
export const STOPWATCH_REMIND_SECONDS = 30 * 60

/**
 * 正计时是否刚好跨过一个提醒点（prev 还没到、next 到了/过了）。
 * 用区间判断而不是 next % N === 0，避免渲染或定时器丢拍时整点被跳过。
 */
export function crossedStopwatchReminder(
  prevSeconds: number,
  nextSeconds: number,
  intervalSeconds: number = STOPWATCH_REMIND_SECONDS
): boolean {
  if (intervalSeconds <= 0) return false
  if (nextSeconds <= prevSeconds) return false
  return Math.floor(nextSeconds / intervalSeconds) > Math.floor(prevSeconds / intervalSeconds)
}

/**
 * 调整时长。默认 1 分钟细调；按住加速键（Shift / 长按）时以 5 分钟递进。
 */
export function adjustMinutes(current: number, delta: number, fine = true): number {
  const step = fine ? Math.sign(delta) : Math.sign(delta) * 5
  return clampMinutes(current + step)
}

/**
 * 把秒数格式化成计时器文本。
 * 小于一小时用 MM:SS，超过一小时用 H:MM:SS。
 */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/** 剩余秒数 → 进度 0..1（用于环形进度） */
export function countdownProgress(plannedMinutes: number, remainingSeconds: number): number {
  const total = plannedMinutes * 60
  if (total <= 0) return 0
  const used = total - remainingSeconds
  return Math.min(1, Math.max(0, used / total))
}

/**
 * 正计时的目标进度：没设目标时返回 null（环形显示为呼吸态）。
 * 超过目标时返回 >1 的值，调用方可以据此换成"超额"配色。
 */
export function stopwatchProgress(elapsedSeconds: number, targetMinutes: number): number | null {
  if (targetMinutes <= 0) return null
  return Math.max(0, elapsedSeconds / (targetMinutes * 60))
}

/** 正计时超过目标后的补时文本，例如 +03:12 */
export function overtimeLabel(elapsedSeconds: number, targetMinutes: number): string | null {
  if (targetMinutes <= 0) return null
  const target = targetMinutes * 60
  if (elapsedSeconds <= target) return null
  return `+${formatClock(elapsedSeconds - target)}`
}
