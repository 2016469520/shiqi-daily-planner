// ============================================================
// Review statistics calculation utilities
// Pure functions, independent of UI framework
// ============================================================

import type { DailyReview } from '@/types'
import { todayStr } from '@/lib/utils/date'

// ---------- Review Streak ----------

export interface ReviewStreakResult {
  current: number
  longest: number
}

/**
 * Calculate the current and longest consecutive streak of review days.
 * A "review day" is any day with a review record.
 */
export function calculateReviewStreak(reviews: DailyReview[]): ReviewStreakResult {
  if (reviews.length === 0) return { current: 0, longest: 0 }

  const today = todayStr()
  const dates = [...new Set(reviews.map((r) => r.review_date))].sort()

  // Calculate longest streak
  let longest = 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    if (dateDiffInDays(dates[i], dates[i - 1]) === 1) {
      streak++
    } else {
      if (streak > longest) longest = streak
      streak = 1
    }
  }
  if (streak > longest) longest = streak

  // Calculate current streak (must end today or yesterday)
  const newest = dates[dates.length - 1]
  const daysFromToday = dateDiffInDays(today, newest)

  if (daysFromToday > 1) {
    return { current: 0, longest }
  }

  let current = 1
  for (let i = dates.length - 1; i > 0; i--) {
    if (dateDiffInDays(dates[i], dates[i - 1]) === 1) {
      current++
    } else {
      break
    }
  }

  return { current, longest: Math.max(longest, current) }
}

// ---------- Monthly Summary ----------

export interface MonthlyReviewSummary {
  totalDays: number
  reviewedDays: number
  avgScore: number | null
  avgCompletion: number | null
  avgMood: number | null
  avgEnergy: number | null
  currentStreak: number
  longestStreak: number
}

/**
 * Calculate monthly review summary statistics.
 * @param reviews - All reviews in the month (or wider range)
 * @param year - e.g., 2026
 * @param month - 1-12
 */
export function calculateMonthlyReviewSummary(
  reviews: DailyReview[],
  year: number,
  month: number
): MonthlyReviewSummary {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const monthReviews = reviews.filter((r) => r.review_date.startsWith(monthStr))

  const reviewedDays = monthReviews.length

  const avg = (arr: number[]): number | null =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const avgScore = avg(monthReviews.filter((r) => r.score != null).map((r) => r.score!))
  const avgCompletion = avg(
    monthReviews.filter((r) => r.subjective_completion != null).map((r) => r.subjective_completion!)
  )
  const avgMood = avg(monthReviews.filter((r) => r.mood != null).map((r) => r.mood!))
  const avgEnergy = avg(monthReviews.filter((r) => r.energy != null).map((r) => r.energy!))

  const daysInMonth = new Date(year, month, 0).getDate()
  const streak = calculateReviewStreak(reviews)

  return {
    totalDays: daysInMonth,
    reviewedDays,
    avgScore,
    avgCompletion,
    avgMood,
    avgEnergy,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  }
}

// ---------- Review Filters ----------

export interface ReviewFilterOptions {
  month?: string // 'YYYY-MM'
  scoreMin?: number
  scoreMax?: number
  mood?: number // 1-5, specific mood value
  hasTextOnly?: boolean // Only reviews with summary text
}

export function filterReviews(
  reviews: DailyReview[],
  options: ReviewFilterOptions
): DailyReview[] {
  let result = [...reviews]

  if (options.month) {
    result = result.filter((r) => r.review_date.startsWith(options.month!))
  }

  if (options.scoreMin != null) {
    result = result.filter((r) => r.score != null && r.score >= options.scoreMin!)
  }

  if (options.scoreMax != null) {
    result = result.filter((r) => r.score != null && r.score <= options.scoreMax!)
  }

  if (options.mood != null) {
    result = result.filter((r) => r.mood === options.mood)
  }

  if (options.hasTextOnly) {
    result = result.filter((r) => r.summary && r.summary.trim().length > 0)
  }

  // Default: sorted by date descending
  result.sort((a, b) => b.review_date.localeCompare(a.review_date))

  return result
}

// ---------- Helpers ----------

function dateDiffInDays(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00')
  const d2 = new Date(b + 'T00:00:00')
  const diffMs = d1.getTime() - d2.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
