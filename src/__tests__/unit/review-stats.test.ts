import { describe, it, expect } from 'vitest'
import {
  calculateReviewStreak,
  calculateMonthlyReviewSummary,
  filterReviews,
} from '@/lib/utils/review-stats'
import type { DailyReview } from '@/types'
import { toDateStr } from '@/lib/utils/date'

function makeReview(overrides: Partial<DailyReview> = {}): DailyReview {
  return {
    id: 'test-id',
    user_id: 'u1',
    review_date: '2026-07-01',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('review stats', () => {
  describe('calculateReviewStreak', () => {
    it('returns 0 for empty reviews', () => {
      const result = calculateReviewStreak([])
      expect(result.current).toBe(0)
      expect(result.longest).toBe(0)
    })

    it('calculates current streak ending today', () => {
      const today = toDateStr()
      const yesterday = toDateStr(new Date(Date.now() - 86400000))
      const twoDaysAgo = toDateStr(new Date(Date.now() - 2 * 86400000))

      const reviews = [
        makeReview({ review_date: today }),
        makeReview({ review_date: yesterday, id: '2' }),
        makeReview({ review_date: twoDaysAgo, id: '3' }),
      ]

      const result = calculateReviewStreak(reviews)
      expect(result.current).toBe(3)
      expect(result.longest).toBe(3)
    })

    it('current streak is 0 when most recent is more than 1 day ago', () => {
      const twoDaysAgo = toDateStr(new Date(Date.now() - 2 * 86400000))

      const reviews = [makeReview({ review_date: twoDaysAgo })]

      const result = calculateReviewStreak(reviews)
      expect(result.current).toBe(0)
    })

    it('finds longest streak even when current is broken', () => {
      const today = toDateStr()
      const fiveDaysAgo = toDateStr(new Date(Date.now() - 5 * 86400000))
      const sixDaysAgo = toDateStr(new Date(Date.now() - 6 * 86400000))
      const sevenDaysAgo = toDateStr(new Date(Date.now() - 7 * 86400000))

      const reviews = [
        makeReview({ review_date: today }),
        // gap at 1-4 days ago
        makeReview({ review_date: fiveDaysAgo, id: '2' }),
        makeReview({ review_date: sixDaysAgo, id: '3' }),
        makeReview({ review_date: sevenDaysAgo, id: '4' }),
      ]

      const result = calculateReviewStreak(reviews)
      expect(result.current).toBe(1)
      expect(result.longest).toBe(3)
    })

    it('handles duplicate dates (only count unique days)', () => {
      const today = toDateStr()
      const yesterday = toDateStr(new Date(Date.now() - 86400000))

      // Two reviews on the same date (should not happen with upsert, but be safe)
      const reviews = [
        makeReview({ review_date: today }),
        makeReview({ review_date: today, id: 'dup' }), // duplicate date
        makeReview({ review_date: yesterday, id: '2' }),
      ]

      const result = calculateReviewStreak(reviews)
      expect(result.current).toBe(2)
    })
  })

  describe('calculateMonthlyReviewSummary', () => {
    it('returns zero stats for empty month', () => {
      const result = calculateMonthlyReviewSummary([], 2026, 7)
      expect(result.reviewedDays).toBe(0)
      expect(result.avgScore).toBeNull()
      expect(result.avgCompletion).toBeNull()
      expect(result.currentStreak).toBe(0)
    })

    it('calculates averages correctly', () => {
      const reviews = [
        makeReview({ review_date: '2026-07-01', score: 8, mood: 4, energy: 3, subjective_completion: 80 }),
        makeReview({ review_date: '2026-07-02', score: 6, mood: 3, energy: 4, subjective_completion: 60, id: '2' }),
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 7)
      expect(result.reviewedDays).toBe(2)
      expect(result.avgScore).toBe(7)
      expect(result.avgMood).toBe(3.5)
      expect(result.avgEnergy).toBe(3.5)
      expect(result.avgCompletion).toBe(70)
    })

    it('handles missing scores (null-safe)', () => {
      const reviews = [
        makeReview({ review_date: '2026-07-01', score: 8 }),
        makeReview({ review_date: '2026-07-02', id: '2' }), // no score
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 7)
      expect(result.avgScore).toBe(8) // Only count those with score
      expect(result.avgMood).toBeNull()
    })

    it('filters by month correctly', () => {
      const reviews = [
        makeReview({ review_date: '2026-06-30', score: 5 }),
        makeReview({ review_date: '2026-07-01', score: 8, id: '2' }),
        makeReview({ review_date: '2026-07-15', score: 7, id: '3' }),
        makeReview({ review_date: '2026-08-01', score: 6, id: '4' }),
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 7)
      expect(result.reviewedDays).toBe(2)
    })

    it('handles year boundary', () => {
      const reviews = [
        makeReview({ review_date: '2025-12-31', score: 7 }),
        makeReview({ review_date: '2026-01-01', score: 8, id: '2' }),
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 1)
      expect(result.reviewedDays).toBe(1)
      expect(result.avgScore).toBe(8)
    })

    it('includes zero in averages (0 is a valid value, not missing)', () => {
      const reviews = [
        makeReview({ review_date: '2026-07-01', subjective_completion: 0 }),
        makeReview({ review_date: '2026-07-02', subjective_completion: 100, id: '2' }),
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 7)
      expect(result.avgCompletion).toBe(50) // (0+100)/2 = 50
      expect(result.reviewedDays).toBe(2)
    })

    it('distinguishes 0 from null (null = not filled, 0 = explicit zero)', () => {
      const reviews = [
        makeReview({ review_date: '2026-07-01', subjective_completion: 0 }),
        makeReview({ review_date: '2026-07-02', id: '2' }), // no completion (null)
        makeReview({ review_date: '2026-07-03', subjective_completion: 30, id: '3' }),
      ]

      const result = calculateMonthlyReviewSummary(reviews, 2026, 7)
      // Only reviews with non-null completion: 0 and 30
      expect(result.avgCompletion).toBe(15) // (0+30)/2 = 15
    })

    it('correct totalDays for different months', () => {
      const result31 = calculateMonthlyReviewSummary([], 2026, 7)
      expect(result31.totalDays).toBe(31)

      const resultFeb = calculateMonthlyReviewSummary([], 2026, 2)
      expect(resultFeb.totalDays).toBe(28)

      const resultLeap = calculateMonthlyReviewSummary([], 2024, 2)
      expect(resultLeap.totalDays).toBe(29)
    })
  })

  describe('filterReviews', () => {
    const reviews = [
      makeReview({ review_date: '2026-06-15', score: 8, mood: 4, summary: 'Good day' }),
      makeReview({ review_date: '2026-07-01', score: 6, mood: 3, id: '2' }),
      makeReview({ review_date: '2026-07-10', score: 9, mood: 5, summary: 'Excellent', id: '3' }),
      makeReview({ review_date: '2026-07-20', score: 4, mood: 2, id: '4' }),
    ]

    it('filters by month', () => {
      const result = filterReviews(reviews, { month: '2026-07' })
      expect(result).toHaveLength(3)
      expect(result[0].review_date).toBe('2026-07-20') // sorted desc
    })

    it('filters by score range', () => {
      const result = filterReviews(reviews, { scoreMin: 7, scoreMax: 9 })
      expect(result).toHaveLength(2)
    })

    it('filters by mood', () => {
      const result = filterReviews(reviews, { mood: 4 })
      expect(result).toHaveLength(1)
      expect(result[0].review_date).toBe('2026-06-15')
    })

    it('filters for reviews with text summary', () => {
      const result = filterReviews(reviews, { hasTextOnly: true })
      expect(result).toHaveLength(2)
    })

    it('combines multiple filters', () => {
      const result = filterReviews(reviews, { month: '2026-07', scoreMin: 8 })
      expect(result).toHaveLength(1)
      expect(result[0].review_date).toBe('2026-07-10')
    })

    it('returns empty array when no matches', () => {
      const result = filterReviews(reviews, { month: '2026-05' })
      expect(result).toHaveLength(0)
    })

    it('empty array input returns empty array', () => {
      const result = filterReviews([], { month: '2026-07' })
      expect(result).toHaveLength(0)
    })
  })
})
