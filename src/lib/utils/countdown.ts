// ============================================================
// Countdown date calculation utilities
// Pure functions — use local dates, not UTC
// ============================================================

import type { Countdown } from '@/types'
import { todayStr, toDateStr } from '@/lib/utils/date'

/**
 * Calculate days remaining for a countdown.
 * Positive = future event, 0 = today, negative = past event.
 * For yearly repeats, calculates the next occurrence.
 */
export function calcDaysRemaining(targetDate: string, isYearly: boolean): number {
  const today = todayStr()
  const target = new Date(targetDate + 'T00:00:00')

  if (isYearly) {
    const todayDate = new Date(today + 'T00:00:00')
    // Set target to this year
    target.setFullYear(todayDate.getFullYear())
    // If already passed this year, use next year
    if (target < todayDate) {
      target.setFullYear(todayDate.getFullYear() + 1)
    }
  }

  const diffMs = target.getTime() - new Date(today + 'T00:00:00').getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Get human-readable display text for days remaining.
 */
export function getDisplayText(days: number): string {
  if (days > 0) return `还有 ${days} 天`
  if (days === 0) return '就是今天'
  return `已过去 ${Math.abs(days)} 天`
}

/**
 * Get the next occurrence date for a yearly countdown.
 */
export function getNextYearlyDate(targetDate: string): string {
  const today = todayStr()
  const target = new Date(targetDate + 'T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')

  target.setFullYear(todayDate.getFullYear())
  if (target < todayDate) {
    target.setFullYear(todayDate.getFullYear() + 1)
  }

  return toDateStr(target)
}

/**
 * Enrich countdown objects with computed fields.
 */
export function enrichCountdown(c: Countdown): Countdown {
  const days = calcDaysRemaining(c.target_date, c.is_yearly)
  return {
    ...c,
    days_remaining: days,
    display_text: getDisplayText(days),
  }
}

/**
 * Sort countdowns: pinned first, then by absolute days remaining (closest first).
 */
export function sortCountdowns(countdowns: Countdown[]): Countdown[] {
  return [...countdowns].sort((a, b) => {
    // Pinned first
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    // Then by sort_order
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    // Then by absolute days remaining (closest first for future, most recent for past)
    const aDays = a.days_remaining ?? 0
    const bDays = b.days_remaining ?? 0
    return Math.abs(aDays) - Math.abs(bDays)
  })
}
