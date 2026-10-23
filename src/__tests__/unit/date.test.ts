import { describe, it, expect } from 'vitest'
import { todayStr, navigateDate, getWeekRange, getMonthRange } from '@/lib/utils/date'

describe('date utilities', () => {
  it('todayStr returns YYYY-MM-DD format', () => {
    const result = todayStr()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('navigateDate works for month view', () => {
    const next = navigateDate('2024-01-15', 'month', 1)
    expect(next).toBe('2024-02-15')
    const prev = navigateDate('2024-01-15', 'month', -1)
    expect(prev).toBe('2023-12-15')
  })

  it('navigateDate works for week view', () => {
    const next = navigateDate('2024-01-15', 'week', 1)
    expect(next).toBe('2024-01-22')
  })

  it('navigateDate works for day view', () => {
    const next = navigateDate('2024-01-15', 'day', 1)
    expect(next).toBe('2024-01-16')
  })

  it('getWeekRange returns 7 days', () => {
    const range = getWeekRange('2024-06-15')
    expect(range.days).toHaveLength(7)
  })

  it('getMonthRange covers full month', () => {
    const range = getMonthRange('2024-02-01')
    expect(range.start <= '2024-02-01').toBe(true)
    expect(range.end >= '2024-02-29').toBe(true)
  })
})
