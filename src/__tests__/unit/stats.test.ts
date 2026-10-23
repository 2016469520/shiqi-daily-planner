import { describe, it, expect } from 'vitest'
import {
  calculateStreak,
  calculateTaskStats,
  calculateTagStats,
  generateHabitHeatmap,
} from '@/lib/utils/stats'
import type { HabitLog, Task, DailyReview } from '@/types'
import { calculateReviewStats } from '@/lib/utils/stats'
import { toDateStr } from '@/lib/utils/date'

describe('stats utilities', () => {
  describe('calculateStreak', () => {
    it('returns 0 for empty logs', () => {
      const result = calculateStreak([])
      expect(result.current).toBe(0)
      expect(result.longest).toBe(0)
    })

    it('calculates current daily streak', () => {
      const today = toDateStr()
      const yesterday = toDateStr(new Date(Date.now() - 86400000))
      const twoDaysAgo = toDateStr(new Date(Date.now() - 2 * 86400000))

      const logs = [
        { log_date: today, is_completed: true },
        { log_date: yesterday, is_completed: true },
        { log_date: twoDaysAgo, is_completed: true },
      ]

      const result = calculateStreak(logs)
      expect(result.current).toBe(3)
      expect(result.longest).toBe(3)
    })

    it('resets current streak when there is a gap', () => {
      const today = toDateStr()
      const yesterday = toDateStr(new Date(Date.now() - 86400000))
      const fourDaysAgo = toDateStr(new Date(Date.now() - 4 * 86400000))

      const logs = [
        { log_date: today, is_completed: true },
        { log_date: yesterday, is_completed: true },
        { log_date: fourDaysAgo, is_completed: true },
      ]

      const result = calculateStreak(logs)
      expect(result.current).toBe(2) // Today + Yesterday
      expect(result.longest).toBe(2)
    })

    it('current streak is 0 if most recent is more than 1 day ago', () => {
      const twoDaysAgo = toDateStr(new Date(Date.now() - 2 * 86400000))
      const threeDaysAgo = toDateStr(new Date(Date.now() - 3 * 86400000))

      const logs = [
        { log_date: twoDaysAgo, is_completed: true },
        { log_date: threeDaysAgo, is_completed: true },
      ]

      const result = calculateStreak(logs)
      expect(result.current).toBe(0)
    })

    it('finds longest streak even when current is broken', () => {
      const today = toDateStr()
      const fiveDaysAgo = toDateStr(new Date(Date.now() - 5 * 86400000))
      const sixDaysAgo = toDateStr(new Date(Date.now() - 6 * 86400000))
      const sevenDaysAgo = toDateStr(new Date(Date.now() - 7 * 86400000))
      const eightDaysAgo = toDateStr(new Date(Date.now() - 8 * 86400000))
      const nineDaysAgo = toDateStr(new Date(Date.now() - 9 * 86400000))

      const logs = [
        { log_date: today, is_completed: true },
        // Gap at 1-4 days ago
        { log_date: fiveDaysAgo, is_completed: true },
        { log_date: sixDaysAgo, is_completed: true },
        { log_date: sevenDaysAgo, is_completed: true },
        { log_date: eightDaysAgo, is_completed: true },
        { log_date: nineDaysAgo, is_completed: true },
      ]

      const result = calculateStreak(logs)
      expect(result.current).toBe(1) // Only today
      expect(result.longest).toBe(5) // The historical 5-day streak
    })
  })

  describe('calculateTaskStats', () => {
    // Use fixed dates to avoid timezone-dependent test failures.
    // The function under test uses todayStr() which returns local date;
    // mixing with .toISOString() (UTC) causes off-by-one in non-UTC tz.
    const today = '2026-07-03'
    const futureDate = '2026-08-02'  // 30 days later
    const pastDate = '2026-06-26'    // 7 days earlier

    const tasks: Task[] = [
      { id: '1', user_id: 'u1', title: 'Done task', task_date: today, period: 'morning', priority: 'normal', status: 'done', order_index: 0, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u1', title: 'Todo task', task_date: today, period: 'afternoon', priority: 'high', status: 'todo', order_index: 1, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u1', title: 'In progress', task_date: futureDate, period: 'evening', priority: 'urgent', status: 'in_progress', order_index: 2, created_at: '', updated_at: '' },
      { id: '4', user_id: 'u1', title: 'Cancelled', task_date: today, period: 'morning', priority: 'low', status: 'cancelled', order_index: 3, created_at: '', updated_at: '' },
      { id: '5', user_id: 'u1', title: 'Overdue', task_date: pastDate, period: 'morning', priority: 'normal', status: 'todo', order_index: 0, created_at: '', updated_at: '' },
    ]

    it('counts tasks correctly', () => {
      const stats = calculateTaskStats(tasks, today)
      expect(stats.total).toBe(5)
      expect(stats.done).toBe(1)
      expect(stats.todo).toBe(2) // includes overdue
      expect(stats.inProgress).toBe(1)
      expect(stats.cancelled).toBe(1)
    })

    it('calculates completion rate (excluding cancelled)', () => {
      const stats = calculateTaskStats(tasks, today)
      // 1 done / 4 active = 25%
      expect(stats.completionRate).toBe(0.25)
    })

    it('counts overdue tasks', () => {
      const stats = calculateTaskStats(tasks, today)
      expect(stats.overdue).toBe(1)
    })

    it('breaks down by period', () => {
      const stats = calculateTaskStats(tasks, today)
      expect(stats.byPeriod.morning.total).toBe(3)
      expect(stats.byPeriod.afternoon.total).toBe(1)
      expect(stats.byPeriod.evening.total).toBe(1)
    })

    it('breaks down by priority', () => {
      const stats = calculateTaskStats(tasks, today)
      expect(stats.byPriority.normal.total).toBe(2)
      expect(stats.byPriority.high.total).toBe(1)
      expect(stats.byPriority.urgent.total).toBe(1)
      expect(stats.byPriority.low.total).toBe(1)
    })
  })

  describe('calculateTagStats', () => {
    it('groups tasks by tag', () => {
      const tags = [
        { id: 't1', name: 'Work', color: '#ff0000' },
        { id: 't2', name: 'Health', color: '#00ff00' },
      ]
      const tasks: Task[] = [
        { id: '1', user_id: 'u1', title: 'T1', task_date: '2024-01-01', period: 'morning', priority: 'normal', status: 'done', tag_id: 't1', order_index: 0, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u1', title: 'T2', task_date: '2024-01-01', period: 'morning', priority: 'normal', status: 'todo', tag_id: 't1', order_index: 0, created_at: '', updated_at: '' },
        { id: '3', user_id: 'u1', title: 'T3', task_date: '2024-01-01', period: 'morning', priority: 'normal', status: 'done', tag_id: 't2', order_index: 0, created_at: '', updated_at: '' },
        { id: '4', user_id: 'u1', title: 'T4', task_date: '2024-01-01', period: 'morning', priority: 'normal', status: 'todo', tag_id: undefined, order_index: 0, created_at: '', updated_at: '' },
      ]

      const stats = calculateTagStats(tasks, tags)
      expect(stats).toHaveLength(2)
      const workStat = stats.find((s) => s.tagId === 't1')!
      expect(workStat.total).toBe(2)
      expect(workStat.done).toBe(1)
      expect(workStat.rate).toBe(0.5)

      const healthStat = stats.find((s) => s.tagId === 't2')!
      expect(healthStat.total).toBe(1)
      expect(healthStat.done).toBe(1)
      expect(healthStat.rate).toBe(1)
    })
  })

  describe('calculateReviewStats', () => {
    it('calculates averages', () => {
      const reviews: DailyReview[] = [
        { id: '1', user_id: 'u1', review_date: '2024-01-01', score: 8, mood: 4, energy: 3, subjective_completion: 80, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u1', review_date: '2024-01-02', score: 6, mood: 3, energy: 2, subjective_completion: 60, created_at: '', updated_at: '' },
      ]

      const stats = calculateReviewStats(reviews)
      expect(stats.avgScore).toBe(7)
      expect(stats.avgMood).toBe(3.5)
      expect(stats.avgEnergy).toBe(2.5)
      expect(stats.avgCompletion).toBe(70)
      expect(stats.totalReviews).toBe(2)
    })

    it('handles missing values', () => {
      const reviews: DailyReview[] = [
        { id: '1', user_id: 'u1', review_date: '2024-01-01', created_at: '', updated_at: '' },
      ]

      const stats = calculateReviewStats(reviews)
      expect(stats.avgScore).toBeNull()
      expect(stats.totalReviews).toBe(1)
    })
  })

  describe('generateHabitHeatmap', () => {
    it('generates correct number of days', () => {
      const logs: HabitLog[] = []
      const heatmap = generateHabitHeatmap(logs, 7, 1)
      expect(heatmap).toHaveLength(7)
    })

    it('marks completed days', () => {
      const today = toDateStr()
      const logs: HabitLog[] = [
        { id: '1', user_id: 'u1', habit_id: 'h1', log_date: today, value: 2, is_completed: true, created_at: '', updated_at: '' },
      ]

      const heatmap = generateHabitHeatmap(logs, 7, 1)
      const todayCell = heatmap.find((h) => h.date === today)
      expect(todayCell?.level).toBe(4) // 200% target = max level
      expect(todayCell?.value).toBe(2)
    })

    it('scales levels based on target value', () => {
      const today = toDateStr()
      const logs: HabitLog[] = [
        { id: '1', user_id: 'u1', habit_id: 'h1', log_date: today, value: 5, is_completed: true, created_at: '', updated_at: '' },
      ]

      const heatmap = generateHabitHeatmap(logs, 7, 10)
      const todayCell = heatmap.find((h) => h.date === today)
      expect(todayCell?.level).toBe(2) // 50% of target
    })
  })
})
