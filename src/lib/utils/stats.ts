// ============================================================
// Statistics calculation utilities
// Pure functions, independent of UI framework
// ============================================================

import type { Task, Habit, HabitLog, DailyReview, Period } from '@/types'
import { todayStr, parseISO, toDateStr } from '@/lib/utils/date'

// ---------- Streak Calculations ----------

export interface StreakResult {
  current: number
  longest: number
}

/**
 * Calculate the current and longest consecutive streak of completed days.
 * Walks backward through sorted dates to count consecutive completions.
 */
export function calculateStreak(
  logs: { log_date: string; is_completed: boolean }[],
  scheduleRule?: { frequency: string; byWeekday?: number[] }
): StreakResult {
  if (logs.length === 0) return { current: 0, longest: 0 }

  // Sort by date descending
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))
  const today = todayStr()

  // Get completed dates (ascending for calculation)
  const completedDates = sorted
    .filter((l) => l.is_completed)
    .map((l) => l.log_date)
    .sort()

  if (completedDates.length === 0) return { current: 0, longest: 0 }

  // Calculate current streak (must include today or yesterday)
  let current = 0
  const relevantDates = completedDates.reverse() // newest first

  // For current streak, we need the most recent completion to be today or yesterday
  const mostRecent = relevantDates[0]
  const daysFromToday = dateDiffInDays(todayStr(), mostRecent)

  // If the most recent completion is more than 1 day ago (for daily habits),
  // the current streak is 0
  if (!scheduleRule || scheduleRule.frequency === 'daily') {
    if (daysFromToday > 1) {
      current = 0
    } else {
      // Count consecutive from most recent backward
      current = 1
      for (let i = 1; i < relevantDates.length; i++) {
        if (dateDiffInDays(relevantDates[i - 1], relevantDates[i]) === 1) {
          current++
        } else {
          break
        }
      }
    }
  } else if (scheduleRule.frequency === 'weekdays') {
    // For weekday habits, check if today is a weekday
    const todayDate = parseISO(today)
    const todayDay = todayDate.getDay()
    const isWeekday = todayDay >= 1 && todayDay <= 5

    if (!isWeekday && daysFromToday > 2) {
      current = 0
    } else if (isWeekday && daysFromToday > 1) {
      current = 0
    } else {
      current = 1
      for (let i = 1; i < relevantDates.length; i++) {
        const diff = dateDiffInDays(relevantDates[i - 1], relevantDates[i])
        if (diff <= 3) {
          // Allow weekend gaps
          current++
        } else {
          break
        }
      }
    }
  } else {
    // Weekly: check if completed this week
    const diff = daysFromToday
    if (diff > 7) {
      current = 0
    } else {
      current = 1
    }
  }

  // Calculate longest streak
  let longest = 0
  let streak = 1
  const ascDates = [...completedDates].sort()
  for (let i = 1; i < ascDates.length; i++) {
    if (dateDiffInDays(ascDates[i], ascDates[i - 1]) === 1) {
      streak++
    } else {
      if (streak > longest) longest = streak
      streak = 1
    }
  }
  if (streak > longest) longest = streak

  return { current, longest: Math.max(longest, current) }
}

/**
 * Difference in days between two date strings (YYYY-MM-DD).
 */
function dateDiffInDays(a: string, b: string): number {
  const d1 = new Date(a)
  const d2 = new Date(b)
  const diffMs = d1.getTime() - d2.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Get the most recent N dates for display (e.g., last 30 days).
 */
export function getLastNDates(n: number, endDate?: string): string[] {
  const end = endDate || todayStr()
  const dates: string[] = []
  const d = new Date(end)
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(d)
    date.setDate(date.getDate() - i)
    dates.push(toDateStr(date))
  }
  return dates
}

// ---------- Habit Stats ----------

export interface HabitStatsResult {
  habitId: string
  habitName: string
  streak: StreakResult
  weekCompletion: number // 0-1
  monthCompletion: number // 0-1
  totalLogs: number
  completionRate: number // 0-1
}

export function calculateHabitStats(
  habit: Habit,
  logs: HabitLog[]
): HabitStatsResult {
  const today = todayStr()
  const d = new Date(today)

  // This week's range (Mon-Sun)
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
  const weekStartStr = toDateStr(weekStart)

  // This month's range
  const monthStartStr = `${today.slice(0, 7)}-01`

  const weekLogs = logs.filter(
    (l) => l.log_date >= weekStartStr && l.log_date <= today
  )
  const monthLogs = logs.filter(
    (l) => l.log_date >= monthStartStr && l.log_date <= today
  )

  const streak = calculateStreak(logs, habit.schedule_rule)

  // Calculate expected days for week/month
  let expectedWeekDays = 7
  let expectedMonthDays = parseInt(today.slice(8, 10))

  if (habit.schedule_rule?.frequency === 'weekdays') {
    // Count weekdays in week range
    expectedWeekDays = countWeekdaysInRange(weekStartStr, today)
    expectedMonthDays = countWeekdaysInRange(monthStartStr, today)
  } else if (habit.schedule_rule?.frequency === 'weekly') {
    expectedWeekDays = 1
    expectedMonthDays = countWeeksInRange(monthStartStr, today)
  }

  return {
    habitId: habit.id,
    habitName: habit.name,
    streak,
    weekCompletion: expectedWeekDays > 0 ? weekLogs.filter((l) => l.is_completed).length / expectedWeekDays : 0,
    monthCompletion: expectedMonthDays > 0 ? monthLogs.filter((l) => l.is_completed).length / expectedMonthDays : 0,
    totalLogs: logs.length,
    completionRate: logs.length > 0 ? logs.filter((l) => l.is_completed).length / logs.length : 0,
  }
}

function countWeekdaysInRange(start: string, end: string): number {
  let count = 0
  const d = new Date(start)
  const endD = new Date(end)
  while (d <= endD) {
    const day = d.getDay()
    if (day >= 1 && day <= 5) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

function countWeeksInRange(start: string, end: string): number {
  return Math.ceil(dateDiffInDays(end, start) / 7)
}

// ---------- Task Stats ----------

export interface TaskStatsResult {
  total: number
  done: number
  inProgress: number
  todo: number
  cancelled: number
  overdue: number
  completionRate: number
  byPeriod: Record<Period, { total: number; done: number; rate: number }>
  byPriority: Record<string, { total: number; done: number }>
  estimatedVsActual: { totalEstimated: number; totalActual: number }
}

export function calculateTaskStats(tasks: Task[], referenceDate?: string): TaskStatsResult {
  const today = referenceDate || todayStr()
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const cancelled = tasks.filter((t) => t.status === 'cancelled').length
  const overdue = tasks.filter(
    (t) => t.task_date && t.task_date < today && t.status !== 'done' && t.status !== 'cancelled'
  ).length

  const activeTotal = total - cancelled
  const completionRate = activeTotal > 0 ? done / activeTotal : 0

  // By period
  const periods: Period[] = ['morning', 'afternoon', 'evening']
  const byPeriod = {} as TaskStatsResult['byPeriod']
  for (const period of periods) {
    const pt = tasks.filter((t) => t.period === period)
    const pd = pt.filter((t) => t.status === 'done').length
    byPeriod[period] = {
      total: pt.length,
      done: pd,
      rate: pt.length > 0 ? pd / pt.length : 0,
    }
  }

  // By priority
  const byPriority: Record<string, { total: number; done: number }> = {}
  for (const t of tasks) {
    if (!byPriority[t.priority]) byPriority[t.priority] = { total: 0, done: 0 }
    byPriority[t.priority].total++
    if (t.status === 'done') byPriority[t.priority].done++
  }

  // Estimated vs actual
  const withBoth = tasks.filter(
    (t) => t.estimated_minutes != null && t.actual_minutes != null
  )
  const totalEstimated = withBoth.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const totalActual = withBoth.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)

  return {
    total,
    done,
    inProgress,
    todo,
    cancelled,
    overdue,
    completionRate,
    byPeriod,
    byPriority,
    estimatedVsActual: { totalEstimated, totalActual },
  }
}

// ---------- Tag Stats ----------

export interface TagStat {
  tagId: string
  tagName: string
  tagColor: string
  total: number
  done: number
  rate: number
}

export function calculateTagStats(
  tasks: Task[],
  tags: { id: string; name: string; color: string }[]
): TagStat[] {
  const tagMap = new Map<string, { total: number; done: number }>()
  for (const task of tasks) {
    if (!task.tag_id) continue
    if (!tagMap.has(task.tag_id)) {
      tagMap.set(task.tag_id, { total: 0, done: 0 })
    }
    const entry = tagMap.get(task.tag_id)!
    entry.total++
    if (task.status === 'done') entry.done++
  }

  return tags
    .filter((t) => tagMap.has(t.id))
    .map((tag) => {
      const data = tagMap.get(tag.id)!
      return {
        tagId: tag.id,
        tagName: tag.name,
        tagColor: tag.color,
        total: data.total,
        done: data.done,
        rate: data.total > 0 ? data.done / data.total : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

// ---------- Review Stats ----------

export interface ReviewStatsResult {
  totalReviews: number
  avgScore: number | null
  avgMood: number | null
  avgEnergy: number | null
  avgCompletion: number | null
  scoreTrend: { date: string; value: number }[]
}

export function calculateReviewStats(reviews: DailyReview[]): ReviewStatsResult {
  const withScore = reviews.filter((r) => r.score != null)
  const withMood = reviews.filter((r) => r.mood != null)
  const withEnergy = reviews.filter((r) => r.energy != null)
  const withCompletion = reviews.filter((r) => r.subjective_completion != null)

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  // Score trend (last 30 days)
  const sorted = [...reviews].sort((a, b) => a.review_date.localeCompare(b.review_date))
  const scoreTrend = sorted
    .filter((r) => r.score != null)
    .slice(-30)
    .map((r) => ({ date: r.review_date, value: r.score! }))

  return {
    totalReviews: reviews.length,
    avgScore: avg(withScore.map((r) => r.score!)),
    avgMood: avg(withMood.map((r) => r.mood!)),
    avgEnergy: avg(withEnergy.map((r) => r.energy!)),
    avgCompletion: avg(withCompletion.map((r) => r.subjective_completion!)),
    scoreTrend,
  }
}

// ---------- Heatmap Data ----------

export interface HeatmapDay {
  date: string
  value: number
  level: 0 | 1 | 2 | 3 | 4 // 0=none, 4=max
}

export function generateHabitHeatmap(
  logs: HabitLog[],
  days: number,
  targetValue: number
): HeatmapDay[] {
  const dates = getLastNDates(days)
  const logMap = new Map(logs.map((l) => [l.log_date, l]))

  return dates.map((date) => {
    const log = logMap.get(date)
    if (!log || !log.is_completed) return { date, value: 0, level: 0 as const }

    const value = log.value
    const ratio = Math.min(value / Math.max(targetValue, 1), 1)

    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (ratio >= 1) level = 4
    else if (ratio >= 0.75) level = 3
    else if (ratio >= 0.5) level = 2
    else if (ratio > 0) level = 1

    return { date, value, level }
  })
}
