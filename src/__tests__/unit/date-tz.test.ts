import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  todayStr,
  tomorrowStr,
  toDateStr,
  thisWeekendStr,
  nextWeekStr,
  formatWeekday,
} from '@/lib/utils/date'

/**
 * 回归测试：本地日期必须在任何时刻都与「用户看到的日历日期」一致。
 *
 * 历史 bug：代码里用 `new Date().toISOString().slice(0, 10)` 取"今天"，
 * 在 UTC+ 时区（如北京时间）的 00:00–08:00 之间会返回前一天，
 * 导致「明天」快捷项变成今天、新建事项落到昨天、被误判为延期。
 */
function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

afterEach(() => {
  vi.useRealTimers()
})

describe('本地日期（时区安全）', () => {
  it('一天中任意时刻 toDateStr 都等于本地日历日期', () => {
    vi.useFakeTimers()
    for (let hour = 0; hour < 24; hour++) {
      vi.setSystemTime(new Date(2026, 9, 21, hour, 30, 0))
      const now = new Date()
      expect(toDateStr(now)).toBe(localDateString(now))
      expect(todayStr()).toBe('2026-10-21')
    }
  })

  it('凌晨 00:30 的「明天」是本地次日，不是今天', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 21, 0, 30, 0))
    expect(todayStr()).toBe('2026-10-21')
    expect(tomorrowStr()).toBe('2026-10-22')
  })

  it('深夜 23:30 的「明天」仍然是本地次日', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 21, 23, 30, 0))
    expect(tomorrowStr()).toBe('2026-10-22')
  })

  it('月末与年末跨日不出错', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 31, 1, 0, 0))
    expect(tomorrowStr()).toBe('2026-02-01')

    vi.setSystemTime(new Date(2026, 11, 31, 1, 0, 0))
    expect(tomorrowStr()).toBe('2027-01-01')
  })

  it('闰年 2 月 28 日的次日是 29 日', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2028, 1, 28, 2, 0, 0))
    expect(tomorrowStr()).toBe('2028-02-29')
  })

  it('周末 / 下周 快捷日期基于本地日历推进', () => {
    vi.useFakeTimers()
    // 2026-10-21 是周三
    vi.setSystemTime(new Date(2026, 9, 21, 0, 30, 0))
    expect(formatWeekday('2026-10-21')).toBe('周三')
    expect(thisWeekendStr()).toBe('2026-10-24') // 周六
    expect(nextWeekStr()).toBe('2026-10-26') // 下周一

    // 周六当天 → 下一个周六
    vi.setSystemTime(new Date(2026, 9, 24, 9, 0, 0))
    expect(thisWeekendStr()).toBe('2026-10-31')

    // 周一当天 → 下周一
    vi.setSystemTime(new Date(2026, 9, 26, 9, 0, 0))
    expect(nextWeekStr()).toBe('2026-11-02')
  })

  it('tomorrowStr 可以基于任意基准日期推导', () => {
    expect(tomorrowStr('2026-03-31')).toBe('2026-04-01')
    expect(tomorrowStr('2026-12-31')).toBe('2027-01-01')
  })
})
