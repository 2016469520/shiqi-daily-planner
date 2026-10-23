import { describe, it, expect } from 'vitest'
import {
  getTimeBucket,
  groupTasksByTag,
  calculateCategoryCompletion,
} from '@/lib/utils/task-grouping'
import type { Task, Tag } from '@/types'

const REF_DATE = '2026-07-03'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    user_id: 'u1',
    title: 'Test task',
    task_date: REF_DATE,
    period: 'morning',
    priority: 'normal',
    status: 'todo',
    order_index: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag1',
    user_id: 'u1',
    name: '学习',
    color: '#3b82f6',
    icon: 'BookOpen',
    is_default: true,
    is_visible: true,
    sort_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('task grouping', () => {
  describe('getTimeBucket', () => {
    it('assigns done tasks to done bucket', () => {
      const task = makeTask({ status: 'done', task_date: '2026-06-01' })
      expect(getTimeBucket(task, REF_DATE)).toBe('done')
    })

    it('assigns past todo tasks to overdue', () => {
      const task = makeTask({ status: 'todo', task_date: '2026-07-01' })
      expect(getTimeBucket(task, REF_DATE)).toBe('overdue')
    })

    it('assigns today tasks to today bucket', () => {
      const task = makeTask({ status: 'todo', task_date: REF_DATE })
      expect(getTimeBucket(task, REF_DATE)).toBe('today')
    })

    it('assigns tasks within 7 days to next7days', () => {
      const task = makeTask({ status: 'todo', task_date: '2026-07-08' }) // 5 days ahead
      expect(getTimeBucket(task, REF_DATE)).toBe('next7days')
    })

    it('assigns tasks beyond 7 days to later', () => {
      const task = makeTask({ status: 'todo', task_date: '2026-08-01' })
      expect(getTimeBucket(task, REF_DATE)).toBe('later')
    })

    it('assigns tasks without date to undated', () => {
      const task = makeTask({ status: 'todo', task_date: '' })
      expect(getTimeBucket(task, REF_DATE)).toBe('undated')
    })
  })

  describe('groupTasksByTag', () => {
    const tags = [
      makeTag({ id: 'tag-learning', name: '学习', color: '#3b82f6', sort_order: 0 }),
      makeTag({ id: 'tag-work', name: '工作', color: '#f59e0b', sort_order: 1 }),
      makeTag({ id: 'tag-exercise', name: '运动', color: '#10b981', sort_order: 2 }),
    ]

    it('groups tasks by tag', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning', task_date: REF_DATE }),
        makeTask({ id: 't2', tag_id: 'tag-learning', task_date: REF_DATE }),
        makeTask({ id: 't3', tag_id: 'tag-work', task_date: REF_DATE }),
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const learning = groups.find((g) => g.tagId === 'tag-learning')
      const work = groups.find((g) => g.tagId === 'tag-work')

      expect(learning?.total).toBe(2)
      expect(work?.total).toBe(1)
    })

    it('handles uncategorized tasks (no tag_id)', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: undefined, task_date: REF_DATE }),
        makeTask({ id: 't2', tag_id: 'tag-learning', task_date: REF_DATE }),
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const uncat = groups.find((g) => g.tagId === null)

      expect(uncat).toBeDefined()
      expect(uncat?.total).toBe(1)
      expect(uncat?.tagName).toBe('未分类')
    })

    it('excludes cancelled tasks by default', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning', status: 'todo' }),
        makeTask({ id: 't2', tag_id: 'tag-learning', status: 'cancelled' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const learning = groups.find((g) => g.tagId === 'tag-learning')
      expect(learning?.total).toBe(1)
    })

    it('excludes soft-deleted tasks', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning' }),
        makeTask({ id: 't2', tag_id: 'tag-learning', deleted_at: '2026-07-01T00:00:00Z' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const learning = groups.find((g) => g.tagId === 'tag-learning')
      expect(learning?.total).toBe(1)
    })

    it('hides empty categories when hideEmpty is true', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { hideEmpty: true, referenceDate: REF_DATE })
      const work = groups.find((g) => g.tagId === 'tag-work')
      expect(work).toBeUndefined()

      const learning = groups.find((g) => g.tagId === 'tag-learning')
      expect(learning).toBeDefined()
    })

    it('shows empty categories when hideEmpty is false', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { hideEmpty: false, referenceDate: REF_DATE })
      const work = groups.find((g) => g.tagId === 'tag-work')
      expect(work).toBeDefined()
      expect(work?.total).toBe(0)
    })

    it('sorts categories by tag sort_order', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-exercise' }),
        makeTask({ id: 't2', tag_id: 'tag-learning' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { hideEmpty: true, referenceDate: REF_DATE })
      // Uncategorized comes first, then sorted by sort_order
      const tagIds = groups.filter((g) => g.tagId !== null).map((g) => g.tagId)
      expect(tagIds).toEqual(['tag-learning', 'tag-exercise'])
    })

    it('calculates completion rate per category', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning', status: 'done' }),
        makeTask({ id: 't2', tag_id: 'tag-learning', status: 'done' }),
        makeTask({ id: 't3', tag_id: 'tag-learning', status: 'todo' }),
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const learning = groups.find((g) => g.tagId === 'tag-learning')
      expect(learning?.done).toBe(2)
      expect(learning?.total).toBe(3)
      expect(learning?.completionRate).toBeCloseTo(2 / 3)
    })

    it('assigns tasks to correct time buckets within category', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning', task_date: '2026-06-01', status: 'todo' }), // overdue
        makeTask({ id: 't2', tag_id: 'tag-learning', task_date: REF_DATE, status: 'todo' }), // today
        makeTask({ id: 't3', tag_id: 'tag-learning', task_date: '2026-07-10', status: 'todo' }), // next7days
        makeTask({ id: 't4', tag_id: 'tag-learning', task_date: '2026-09-01', status: 'todo' }), // later
        makeTask({ id: 't5', tag_id: 'tag-learning', status: 'done' }), // done
      ]

      const groups = groupTasksByTag(tasks, tags, { referenceDate: REF_DATE })
      const learning = groups.find((g) => g.tagId === 'tag-learning')
      expect(learning?.buckets.overdue).toHaveLength(1)
      expect(learning?.buckets.today).toHaveLength(1)
      expect(learning?.buckets.next7days).toHaveLength(1)
      expect(learning?.buckets.later).toHaveLength(1)
      expect(learning?.buckets.done).toHaveLength(1)
    })
  })

  describe('calculateCategoryCompletion', () => {
    const tags = [
      makeTag({ id: 'tag-learning', name: '学习', color: '#3b82f6' }),
      makeTag({ id: 'tag-work', name: '工作', color: '#f59e0b', sort_order: 1 }),
    ]

    it('calculates completion stats per category', () => {
      const tasks = [
        makeTask({ id: 't1', tag_id: 'tag-learning', status: 'done' }),
        makeTask({ id: 't2', tag_id: 'tag-learning', status: 'todo' }),
      ]

      const stats = calculateCategoryCompletion(tasks, tags)
      const learning = stats.find((s) => s.tagId === 'tag-learning')
      expect(learning?.done).toBe(1)
      expect(learning?.total).toBe(2)
      expect(learning?.completionRate).toBe(0.5)
    })

    it('returns empty for categories with no tasks', () => {
      const tasks: Task[] = []
      const stats = calculateCategoryCompletion(tasks, tags)
      expect(stats).toHaveLength(0)
    })
  })
})
