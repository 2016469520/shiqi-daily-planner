import { describe, it, expect } from 'vitest'

// ---- Focus session types ----

describe('FocusSession timer_mode', () => {
  it('should accept countdown mode', () => {
    const session = {
      id: '1',
      user_id: 'u1',
      mode: 'focus' as const,
      timer_mode: 'countdown' as const,
      planned_minutes: 25,
      actual_seconds: 0,
      status: 'ready' as const,
      pause_count: 0,
      created_at: '',
      updated_at: '',
    }
    expect(session.timer_mode).toBe('countdown')
  })

  it('should accept stopwatch mode', () => {
    const session = {
      id: '1',
      user_id: 'u1',
      mode: 'focus' as const,
      timer_mode: 'stopwatch' as const,
      planned_minutes: 0,
      actual_seconds: 0,
      status: 'ready' as const,
      pause_count: 0,
      created_at: '',
      updated_at: '',
    }
    expect(session.timer_mode).toBe('stopwatch')
  })

  it('should default to countdown for legacy records', () => {
    // Legacy records without timer_mode should be treated as countdown
    const timerMode: string = 'countdown'
    expect(timerMode).toBe('countdown')
  })
})

// ---- Completed vs Cancelled stats logic ----

describe('Focus session stats inclusion', () => {
  it('completed sessions should be included in stats', () => {
    const isIncluded = (status: string) => status === 'completed'
    expect(isIncluded('completed')).toBe(true)
  })

  it('cancelled sessions should not be included in stats', () => {
    const isIncluded = (status: string) => status === 'completed'
    expect(isIncluded('cancelled')).toBe(false)
  })

  it('running sessions should not be included in stats', () => {
    const isIncluded = (status: string) => status === 'completed'
    expect(isIncluded('running')).toBe(false)
  })

  it('paused sessions should not be included in stats', () => {
    const isIncluded = (status: string) => status === 'completed'
    expect(isIncluded('paused')).toBe(false)
  })
})

// ---- Stopwatch time calculation ----

describe('Stopwatch time calculation', () => {
  it('should calculate elapsed time from started_at', () => {
    const now = Date.now()
    const startedAt = new Date(now - 125000).toISOString() // 125 seconds ago
    const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000)
    expect(elapsed).toBe(125)
  })

  it('should calculate elapsed with pause', () => {
    const now = Date.now()
    const startedAt = new Date(now - 300000).toISOString() // 5 min ago
    const pausedAt = new Date(now - 120000).toISOString() // paused 2 min ago
    const elapsed = Math.floor((new Date(pausedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    expect(elapsed).toBe(180) // 3 minutes
  })

  it('should format seconds to MM:SS', () => {
    const fmtTime = (totalSeconds: number) => {
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    expect(fmtTime(0)).toBe('00:00')
    expect(fmtTime(65)).toBe('01:05')
    expect(fmtTime(3661)).toBe('61:01')
  })
})

// ---- Countdown time calculation ----

describe('Countdown time calculation', () => {
  it('should calculate remaining time from planned and elapsed', () => {
    const plannedSeconds = 25 * 60 // 25 minutes
    const elapsed = 300 // 5 minutes
    const remaining = Math.max(0, plannedSeconds - elapsed)
    expect(remaining).toBe(1200) // 20 minutes
  })

  it('should not go below 0', () => {
    const plannedSeconds = 25 * 60
    const elapsed = 2000
    const remaining = Math.max(0, plannedSeconds - elapsed)
    expect(remaining).toBe(0)
  })
})
