import { describe, it, expect } from 'vitest'
import { dateMatchesRecurrence, getRecurrenceDates } from '@/lib/utils/recurrence'
import type { RecurrenceRule } from '@/types'

describe('recurrence', () => {
  const baseRule: RecurrenceRule = { frequency: 'daily', interval: 1 }

  it('daily recurrence matches consecutive days', () => {
    expect(dateMatchesRecurrence('2024-01-02', '2024-01-01', baseRule)).toBe(true)
    expect(dateMatchesRecurrence('2024-01-03', '2024-01-01', baseRule)).toBe(true)
    expect(dateMatchesRecurrence('2023-12-31', '2024-01-01', baseRule)).toBe(false)
  })

  it('respects interval', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 2 }
    expect(dateMatchesRecurrence('2024-01-01', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-01-02', '2024-01-01', rule)).toBe(false)
    expect(dateMatchesRecurrence('2024-01-03', '2024-01-01', rule)).toBe(true)
  })

  it('respects end date', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endDate: '2024-01-03' }
    expect(dateMatchesRecurrence('2024-01-03', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-01-04', '2024-01-01', rule)).toBe(false)
  })

  it('weekdays only matches Mon-Fri', () => {
    const rule: RecurrenceRule = { frequency: 'weekdays', interval: 1 }
    // 2024-01-01 is Monday
    expect(dateMatchesRecurrence('2024-01-01', '2024-01-01', rule)).toBe(true)
    // 2024-01-06 is Saturday
    expect(dateMatchesRecurrence('2024-01-06', '2024-01-01', rule)).toBe(false)
    // 2024-01-07 is Sunday
    expect(dateMatchesRecurrence('2024-01-07', '2024-01-01', rule)).toBe(false)
  })

  it('weekly with specific days', () => {
    // Mon=1, Wed=3, Fri=5 (ISO)
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1, byWeekday: [1, 3, 5] }
    // 2024-01-01 is Monday
    expect(dateMatchesRecurrence('2024-01-01', '2024-01-01', rule)).toBe(true)
    // 2024-01-03 is Wednesday
    expect(dateMatchesRecurrence('2024-01-03', '2024-01-01', rule)).toBe(true)
    // 2024-01-02 is Tuesday
    expect(dateMatchesRecurrence('2024-01-02', '2024-01-01', rule)).toBe(false)
  })

  it('monthly by day works across months', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, byMonthDay: 31 }
    expect(dateMatchesRecurrence('2024-01-31', '2024-01-31', rule)).toBe(true)
    // February has no 31st
    expect(dateMatchesRecurrence('2024-02-29', '2024-01-31', rule)).toBe(false)
  })

  it('getRecurrenceDates respects exceptions', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 }
    const exceptions = [{ id: '1', user_id: 'u1', task_id: 't1', exception_date: '2024-01-02', action: 'skip' as const, created_at: '' }]
    const dates = getRecurrenceDates('2024-01-01', rule, '2024-01-01', '2024-01-05', exceptions)
    expect(dates).not.toContain('2024-01-02')
    expect(dates).toContain('2024-01-03')
  })

  it('handles cross-month monthly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, byMonthDay: 15 }
    expect(dateMatchesRecurrence('2024-01-15', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-02-15', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-03-15', '2024-01-01', rule)).toBe(true)
  })

  it('handles cross-year recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, byMonthDay: 1 }
    expect(dateMatchesRecurrence('2024-12-01', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2025-01-01', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2025-02-01', '2024-01-01', rule)).toBe(true)
  })

  it('handles month-end (31st) across months with different lengths', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, byMonthDay: 31 }
    expect(dateMatchesRecurrence('2024-01-31', '2024-01-31', rule)).toBe(true)
    // February only has 28/29 days, so 31st should not match
    expect(dateMatchesRecurrence('2024-02-29', '2024-01-31', rule)).toBe(false)
    expect(dateMatchesRecurrence('2024-03-31', '2024-01-31', rule)).toBe(true)
  })

  it('handles leap year daily recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 }
    // Feb 28 → Feb 29 in leap year
    expect(dateMatchesRecurrence('2024-02-28', '2024-02-28', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-02-29', '2024-02-28', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-03-01', '2024-02-28', rule)).toBe(true)
  })

  it('handles count-based limit', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, count: 3 }
    const dates = getRecurrenceDates('2024-01-01', rule, '2024-01-01', '2024-01-10')
    expect(dates).toHaveLength(3)
    expect(dates).toEqual(['2024-01-01', '2024-01-02', '2024-01-03'])
  })

  it('handles endDate limit', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endDate: '2024-01-03' }
    const dates = getRecurrenceDates('2024-01-01', rule, '2024-01-01', '2024-01-10')
    expect(dates).toHaveLength(3)
  })

  it('generates recurrence dates within a range', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 }
    const dates = getRecurrenceDates('2024-01-01', rule, '2024-01-01', '2024-01-05')
    expect(dates).toEqual(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'])
  })

  it('handles weekly with multiple specific days', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1, byWeekday: [1, 4] } // Mon and Thu
    const dates = getRecurrenceDates('2024-01-01', rule, '2024-01-01', '2024-01-14')
    // Jan 1 2024 is Monday (day 1), Jan 4 is Thursday (day 4)
    expect(dates).toContain('2024-01-01') // Mon
    expect(dates).toContain('2024-01-04') // Thu
    expect(dates).toContain('2024-01-08') // Mon
    expect(dates).toContain('2024-01-11') // Thu
  })

  it('handles nth weekday of month', () => {
    // 2nd Monday of the month
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      bySetPos: 2,
      byWeekday: [1],
    }
    // Jan 2024: 2nd Monday is Jan 8
    expect(dateMatchesRecurrence('2024-01-08', '2024-01-01', rule)).toBe(true)
    expect(dateMatchesRecurrence('2024-01-01', '2024-01-01', rule)).toBe(false) // 1st Monday
    expect(dateMatchesRecurrence('2024-01-15', '2024-01-01', rule)).toBe(false) // 3rd Monday
    // Feb 2024: 2nd Monday is Feb 12
    expect(dateMatchesRecurrence('2024-02-12', '2024-01-01', rule)).toBe(true)
  })

  it('handles custom interval (every 2 weeks)', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 2 }
    // Start on Monday Jan 1
    expect(dateMatchesRecurrence('2024-01-01', '2024-01-01', rule)).toBe(true)  // week 0
    expect(dateMatchesRecurrence('2024-01-08', '2024-01-01', rule)).toBe(false) // week 1 (skipped)
    expect(dateMatchesRecurrence('2024-01-15', '2024-01-01', rule)).toBe(true)  // week 2
    expect(dateMatchesRecurrence('2024-01-22', '2024-01-01', rule)).toBe(false) // week 3 (skipped)
  })

  it('handles yearly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 1 }
    expect(dateMatchesRecurrence('2024-06-15', '2024-06-15', rule)).toBe(true)
    expect(dateMatchesRecurrence('2025-06-15', '2024-06-15', rule)).toBe(true)
    expect(dateMatchesRecurrence('2025-07-15', '2024-06-15', rule)).toBe(false)
  })
})
