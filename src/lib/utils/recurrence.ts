import type { RecurrenceRule, RecurrenceException } from '@/types'
import { addDays, parseISO, format, isBefore, isAfter } from 'date-fns'

/**
 * Check if a date falls on a weekday (Mon-Fri)
 */
function isWeekdayStr(dateStr: string): boolean {
  const d = parseISO(dateStr)
  const day = d.getDay()
  return day >= 1 && day <= 5
}

/**
 * Get the Nth weekday of a month (e.g., 2nd Tuesday)
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date | null {
  // n positive = Nth from start, n negative = Nth from end
  const d = new Date(year, month, 1)
  let count = 0
  const targetDay = weekday === 7 ? 0 : weekday // Convert ISO (1=Mon..7=Sun) to JS (0=Sun..6=Sat)

  if (n > 0) {
    while (d.getMonth() === month) {
      if (d.getDay() === targetDay) {
        count++
        if (count === n) return d
      }
      d.setDate(d.getDate() + 1)
    }
  } else {
    d.setMonth(month + 1, 0) // Last day of month
    while (d.getMonth() === month) {
      if (d.getDay() === targetDay) {
        count--
        if (count === n) return d
      }
      d.setDate(d.getDate() - 1)
    }
  }
  return null
}

/**
 * Check if a given date matches a recurrence rule.
 * This is a simplified implementation; rrule will be used for complex cases.
 */
export function dateMatchesRecurrence(
  dateStr: string,
  startDateStr: string,
  rule: RecurrenceRule,
  exceptions: RecurrenceException[] = []
): boolean {
  const date = parseISO(dateStr)
  const startDate = parseISO(startDateStr)

  // Check for exceptions (skips)
  const exception = exceptions.find((e) => e.exception_date === dateStr)
  if (exception?.action === 'skip') return false

  // Check date is not before start
  if (isBefore(date, startDate)) return false

  // Check end date
  if (rule.endDate && isAfter(date, parseISO(rule.endDate))) return false

  const interval = rule.interval || 1

  switch (rule.frequency) {
    case 'daily': {
      const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays % interval === 0
    }

    case 'weekdays': {
      const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && isWeekdayStr(dateStr) && diffDays % (interval || 1) === 0
    }

    case 'weekly': {
      if (!rule.byWeekday || rule.byWeekday.length === 0) {
        // Same day of week as start
        const diffWeeks = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
        return diffWeeks >= 0 && diffWeeks % interval === 0 && date.getDay() === startDate.getDay()
      }
      // Specific weekdays
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert to ISO
      if (!rule.byWeekday.includes(dayOfWeek)) return false
      const diffWeeks = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      return diffWeeks >= 0 && diffWeeks % interval === 0
    }

    case 'monthly': {
      if (rule.byMonthDay) {
        return date.getDate() === rule.byMonthDay
          && monthDiff(startDate, date) % interval === 0
      }
      if (rule.bySetPos && rule.byWeekday) {
        const nthDate = getNthWeekdayOfMonth(
          date.getFullYear(),
          date.getMonth(),
          rule.byWeekday[0],
          rule.bySetPos
        )
        if (!nthDate) return false
        return format(nthDate, 'yyyy-MM-dd') === dateStr
          && monthDiff(startDate, date) % interval === 0
      }
      // Same day of month as start
      return date.getDate() === startDate.getDate()
        && monthDiff(startDate, date) % interval === 0
    }

    case 'yearly': {
      return date.getMonth() === startDate.getMonth()
        && date.getDate() === startDate.getDate()
        && (date.getFullYear() - startDate.getFullYear()) % interval === 0
    }

    default:
      return false
  }
}

/**
 * Get all recurrence dates within a range
 */
export function getRecurrenceDates(
  startDateStr: string,
  rule: RecurrenceRule,
  rangeStart: string,
  rangeEnd: string,
  exceptions: RecurrenceException[] = []
): string[] {
  const dates: string[] = []
  const start = parseISO(startDateStr)
  const rStart = parseISO(rangeStart)
  const rEnd = parseISO(rangeEnd)
  const limitDate = rule.endDate ? parseISO(rule.endDate) : null
  const maxCount = rule.count ?? Infinity

  // Start from the recurrence start date, iterate forward
  let current = start
  let safety = 0
  const maxIterations = 5000 // Safety limit for infinite recurrences

  while (safety < maxIterations) {
    const currentStr = format(current, 'yyyy-MM-dd')

    // Stop if past range end
    if (isAfter(current, rEnd)) break
    // Stop if past end date
    if (limitDate && isAfter(current, limitDate)) break
    // Stop if we have enough
    if (dates.length >= maxCount) break

    if (
      !isBefore(current, rStart) &&
      dateMatchesRecurrence(currentStr, startDateStr, rule, exceptions)
    ) {
      dates.push(currentStr)
    }

    current = addDays(current, 1)
    safety++
  }

  return dates
}

function monthDiff(d1: Date, d2: Date): number {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
}
