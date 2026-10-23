import { describe, it, expect } from 'vitest'
import {
  MAX_MINUTES,
  MIN_MINUTES,
  FOCUS_PRESETS,
  adjustMinutes,
  clampMinutes,
  countdownProgress,
  formatClock,
  overtimeLabel,
  stopwatchProgress,
} from '@/lib/focus/focus-core'

describe('专注时长：细调与边界', () => {
  it('默认按 1 分钟递进（修复只能 5 分钟跳的问题）', () => {
    expect(adjustMinutes(25, 1)).toBe(26)
    expect(adjustMinutes(25, -1)).toBe(24)
    expect(adjustMinutes(1, -1)).toBe(1)
  })

  it('按住加速时按 5 分钟递进', () => {
    expect(adjustMinutes(25, 1, false)).toBe(30)
    expect(adjustMinutes(25, -1, false)).toBe(20)
  })

  it('夹在 1 到 240 分钟之间', () => {
    expect(clampMinutes(0)).toBe(MIN_MINUTES)
    expect(clampMinutes(-10)).toBe(MIN_MINUTES)
    expect(clampMinutes(999)).toBe(MAX_MINUTES)
    expect(clampMinutes(Number.NaN)).toBe(MIN_MINUTES)
    expect(clampMinutes(26.4)).toBe(26)
  })

  it('预设覆盖短休与深度专注，且数值合法', () => {
    expect(FOCUS_PRESETS.length).toBeGreaterThanOrEqual(6)
    expect(FOCUS_PRESETS.every((p) => p.minutes >= MIN_MINUTES && p.minutes <= MAX_MINUTES)).toBe(true)
    expect(FOCUS_PRESETS.some((p) => p.kind === 'break')).toBe(true)
    expect(FOCUS_PRESETS.some((p) => p.minutes === 25)).toBe(true)
  })
})

describe('计时文本', () => {
  it('一小时以内显示 MM:SS', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(59)).toBe('00:59')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(25 * 60)).toBe('25:00')
  })

  it('超过一小时显示 H:MM:SS', () => {
    expect(formatClock(3600)).toBe('1:00:00')
    expect(formatClock(3661)).toBe('1:01:01')
  })

  it('负数按 0 处理', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('进度与超时', () => {
  it('倒计时进度从 0 到 1', () => {
    expect(countdownProgress(25, 25 * 60)).toBe(0)
    expect(countdownProgress(25, 0)).toBe(1)
    expect(countdownProgress(25, 12.5 * 60)).toBeCloseTo(0.5, 5)
    expect(countdownProgress(0, 0)).toBe(0)
  })

  it('正计时没有目标时返回 null（呼吸态）', () => {
    expect(stopwatchProgress(120, 0)).toBeNull()
  })

  it('正计时目标进度可超过 1', () => {
    expect(stopwatchProgress(25 * 60, 25)).toBe(1)
    expect(stopwatchProgress(50 * 60, 25)).toBe(2)
  })

  it('超时文案只在超过目标后出现', () => {
    expect(overtimeLabel(25 * 60, 25)).toBeNull()
    expect(overtimeLabel(25 * 60 + 12, 25)).toBe('+00:12')
    expect(overtimeLabel(25 * 60 + 192, 25)).toBe('+03:12')
    expect(overtimeLabel(100, 0)).toBeNull()
  })
})
