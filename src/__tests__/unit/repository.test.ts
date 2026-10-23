import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createIndexedDBRepositoryFactory } from '@/lib/repositories/indexeddb-impl'
import { closeDB } from '@/lib/db/indexeddb'
import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import type { Task, Tag, Habit } from '@/types'

const TEST_USER = 'test-user-repo-001'

describe('Repository — IndexedDB Implementation', () => {
  let repos: RepositoryFactory

  beforeAll(() => {
    repos = createIndexedDBRepositoryFactory()
  })

  afterAll(async () => {
    await closeDB()
  })

  describe('TagRepository', () => {
    it('should create and retrieve tags', async () => {
      const tag = await repos.tags.create(TEST_USER, {
        name: '测试标签',
        color: '#ff0000',
        is_default: false,
        is_visible: true,
        sort_order: 0,
      })

      expect(tag.id).toBeDefined()
      expect(tag.name).toBe('测试标签')
      expect(tag.user_id).toBe(TEST_USER)

      const tags = await repos.tags.getAll(TEST_USER)
      expect(tags.length).toBeGreaterThanOrEqual(1)
      expect(tags.find((t) => t.id === tag.id)).toBeDefined()
    })

    it('should update tags', async () => {
      const tag = await repos.tags.create(TEST_USER, {
        name: '原始名称',
        color: '#00ff00',
        is_default: false,
        is_visible: true,
        sort_order: 1,
      })

      const updated = await repos.tags.update(TEST_USER, tag.id, {
        name: '更新名称',
        color: '#0000ff',
      })

      expect(updated.name).toBe('更新名称')
      expect(updated.color).toBe('#0000ff')

      const fetched = await repos.tags.getById(TEST_USER, tag.id)
      expect(fetched?.name).toBe('更新名称')
    })

    it('should delete tags', async () => {
      const tag = await repos.tags.create(TEST_USER, {
        name: '待删除',
        color: '#cccccc',
        is_default: false,
        is_visible: true,
        sort_order: 2,
      })

      await repos.tags.delete(TEST_USER, tag.id)
      const fetched = await repos.tags.getById(TEST_USER, tag.id)
      expect(fetched).toBeNull()
    })

    it('should return null for non-existent tag', async () => {
      const tag = await repos.tags.getById(TEST_USER, 'non-existent-id')
      expect(tag).toBeNull()
    })
  })

  describe('TaskRepository', () => {
    let testTag: Tag

    beforeAll(async () => {
      testTag = await repos.tags.create(TEST_USER, {
        name: '任务测试标签',
        color: '#3b82f6',
        is_default: false,
        is_visible: true,
        sort_order: 0,
      })
    })

    it('should create a task with all fields', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '测试任务',
        description: '这是测试描述',
        task_date: '2024-06-15',
        period: 'morning',
        priority: 'high',
        status: 'todo',
        tag_id: testTag.id,
        estimated_minutes: 30,
        order_index: 0,
      })

      expect(task.id).toBeDefined()
      expect(task.title).toBe('测试任务')
      expect(task.task_date).toBe('2024-06-15')
      expect(task.period).toBe('morning')
      expect(task.user_id).toBe(TEST_USER)
    })

    it('should retrieve tasks by date', async () => {
      await repos.tasks.create(TEST_USER, {
        title: '日期查询任务',
        task_date: '2024-06-20',
        period: 'afternoon',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      const tasks = await repos.tasks.getByDate(TEST_USER, '2024-06-20')
      expect(tasks.length).toBeGreaterThanOrEqual(1)
      const found = tasks.find((t) => t.title === '日期查询任务')
      expect(found).toBeDefined()
      expect(found?.task_date).toBe('2024-06-20')
    })

    it('should retrieve tasks by date range', async () => {
      await repos.tasks.create(TEST_USER, {
        title: '范围起始',
        task_date: '2024-07-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })
      await repos.tasks.create(TEST_USER, {
        title: '范围结束',
        task_date: '2024-07-05',
        period: 'evening',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      const tasks = await repos.tasks.getByDateRange(TEST_USER, {
        start: '2024-07-01',
        end: '2024-07-05',
      })

      const starts = tasks.filter((t) => t.title === '范围起始')
      const ends = tasks.filter((t) => t.title === '范围结束')
      expect(starts.length).toBeGreaterThanOrEqual(1)
      expect(ends.length).toBeGreaterThanOrEqual(1)
    })

    it('should update a task', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '更新前',
        task_date: '2024-08-01',
        period: 'morning',
        priority: 'low',
        status: 'todo',
        order_index: 0,
      })

      const updated = await repos.tasks.update(TEST_USER, task.id, {
        title: '更新后',
        priority: 'urgent',
        status: 'in_progress',
      })

      expect(updated.title).toBe('更新后')
      expect(updated.priority).toBe('urgent')
    })

    it('should soft delete and restore tasks', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '软删除测试',
        task_date: '2024-09-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      await repos.tasks.softDelete(TEST_USER, task.id)

      // After soft delete, getById should return null
      const deleted = await repos.tasks.getById(TEST_USER, task.id)
      expect(deleted).toBeNull()

      // getByDate should also exclude it
      const byDate = await repos.tasks.getByDate(TEST_USER, '2024-09-01')
      expect(byDate.find((t) => t.id === task.id)).toBeUndefined()

      // Restore
      await repos.tasks.restore(TEST_USER, task.id)
      const restored = await repos.tasks.getById(TEST_USER, task.id)
      expect(restored).not.toBeNull()
      expect(restored?.title).toBe('软删除测试')
    })

    it('should permanently delete tasks', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '永久删除',
        task_date: '2024-10-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      await repos.tasks.permanentlyDelete(TEST_USER, task.id)
      const fetched = await repos.tasks.getById(TEST_USER, task.id)
      expect(fetched).toBeNull()
    })

    it('should toggle task completion', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '完成测试',
        task_date: '2024-11-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      // Mark done
      const done = await repos.tasks.update(TEST_USER, task.id, {
        status: 'done',
        completed_at: new Date().toISOString(),
      })
      expect(done.status).toBe('done')
      expect(done.completed_at).toBeDefined()

      // Mark undone
      const undone = await repos.tasks.update(TEST_USER, task.id, {
        status: 'todo',
        completed_at: undefined,
      })
      expect(undone.status).toBe('todo')
    })

    it('should move task across dates and periods', async () => {
      const task = await repos.tasks.create(TEST_USER, {
        title: '移动测试',
        task_date: '2024-12-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      const moved = await repos.tasks.moveTask(TEST_USER, task.id, {
        task_date: '2024-12-15',
        period: 'evening',
        order_index: 5,
      })

      expect(moved.task_date).toBe('2024-12-15')
      expect(moved.period).toBe('evening')
      expect(moved.order_index).toBe(5)
    })

    it('should search tasks by title', async () => {
      await repos.tasks.create(TEST_USER, {
        title: 'React学习计划',
        task_date: '2025-01-10',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })

      const results = await repos.tasks.search(TEST_USER, 'React')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results.some((t) => t.title.includes('React'))).toBe(true)
    })

    it('should optionally include undated tasks in date-range filters', async () => {
      const dated = await repos.tasks.create(TEST_USER, {
        title: 'dated-range-task',
        task_date: '2025-02-10',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })
      const undated = await repos.tasks.create(TEST_USER, {
        title: 'undated-inbox-task',
        task_date: null,
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 1,
      })

      const strictRange = await repos.tasks.filter(TEST_USER, {
        dateFrom: '2025-02-01',
        dateTo: '2025-02-28',
      })
      expect(strictRange.some((task) => task.id === dated.id)).toBe(true)
      expect(strictRange.some((task) => task.id === undated.id)).toBe(false)

      const inclusiveRange = await repos.tasks.filter(TEST_USER, {
        dateFrom: '2025-02-01',
        dateTo: '2025-02-28',
        includeUndated: true,
      })
      expect(inclusiveRange.some((task) => task.id === dated.id)).toBe(true)
      expect(inclusiveRange.some((task) => task.id === undated.id)).toBe(true)
    })
  })

  describe('TaskSubitemRepository', () => {
    let parentTask: Task

    beforeAll(async () => {
      parentTask = await repos.tasks.create(TEST_USER, {
        title: '父任务',
        task_date: '2024-06-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })
    })

    it('should create subitems', async () => {
      const sub = await repos.taskSubitems.create(TEST_USER, {
        task_id: parentTask.id,
        title: '子任务1',
        is_completed: false,
        sort_order: 0,
      })

      expect(sub.id).toBeDefined()
      expect(sub.task_id).toBe(parentTask.id)
      expect(sub.title).toBe('子任务1')
    })

    it('should list subitems for a task', async () => {
      await repos.taskSubitems.create(TEST_USER, {
        task_id: parentTask.id,
        title: '子任务2',
        is_completed: false,
        sort_order: 1,
      })

      const subs = await repos.taskSubitems.getByTaskId(TEST_USER, parentTask.id)
      expect(subs.length).toBeGreaterThanOrEqual(2)
      expect(subs[0].sort_order).toBeLessThanOrEqual(subs[1].sort_order)
    })

    it('should toggle subitem completion', async () => {
      const sub = await repos.taskSubitems.create(TEST_USER, {
        task_id: parentTask.id,
        title: '待完成的子任务',
        is_completed: false,
        sort_order: 2,
      })

      const toggled = await repos.taskSubitems.toggleComplete(TEST_USER, sub.id)
      expect(toggled.is_completed).toBe(true)

      const toggledAgain = await repos.taskSubitems.toggleComplete(TEST_USER, sub.id)
      expect(toggledAgain.is_completed).toBe(false)
    })
  })

  describe('HabitRepository', () => {
    it('should create and list habits', async () => {
      const habit = await repos.habits.create(TEST_USER, {
        name: '每日阅读',
        measurement_type: 'boolean',
        target_value: 1,
        schedule_rule: { frequency: 'daily', interval: 1 },
        start_date: '2024-01-01',
      })

      expect(habit.id).toBeDefined()
      expect(habit.name).toBe('每日阅读')

      const habits = await repos.habits.getAll(TEST_USER)
      expect(habits.length).toBeGreaterThanOrEqual(1)
    })

    it('should archive and unarchive habits', async () => {
      const habit = await repos.habits.create(TEST_USER, {
        name: '待归档习惯',
        measurement_type: 'count',
        target_value: 3,
        schedule_rule: { frequency: 'daily', interval: 1 },
        start_date: '2024-01-01',
      })

      await repos.habits.archive(TEST_USER, habit.id)

      // Should not appear in active habits
      const active = await repos.habits.getAll(TEST_USER, false)
      expect(active.find((h) => h.id === habit.id)).toBeUndefined()

      // Should appear when including archived
      const all = await repos.habits.getAll(TEST_USER, true)
      expect(all.find((h) => h.id === habit.id)).toBeDefined()

      // Unarchive
      await repos.habits.unarchive(TEST_USER, habit.id)
      const activeAgain = await repos.habits.getAll(TEST_USER, false)
      expect(activeAgain.find((h) => h.id === habit.id)).toBeDefined()
    })
  })

  describe('HabitLogRepository', () => {
    let testHabit: Habit

    beforeAll(async () => {
      testHabit = await repos.habits.create(TEST_USER, {
        name: '打卡测试习惯',
        measurement_type: 'boolean',
        target_value: 1,
        schedule_rule: { frequency: 'daily', interval: 1 },
        start_date: '2024-01-01',
      })
    })

    it('should create habit log (upsert)', async () => {
      const log = await repos.habitLogs.create(TEST_USER, {
        habit_id: testHabit.id,
        log_date: '2024-06-15',
        value: 1,
        is_completed: true,
      })

      expect(log.id).toBeDefined()
      expect(log.is_completed).toBe(true)
      expect(log.log_date).toBe('2024-06-15')
    })

    it('should get logs by date', async () => {
      const logs = await repos.habitLogs.getByDate(TEST_USER, '2024-06-15')
      expect(logs.length).toBeGreaterThanOrEqual(1)
    })

    it('should get logs by date range', async () => {
      await repos.habitLogs.create(TEST_USER, {
        habit_id: testHabit.id,
        log_date: '2024-06-16',
        value: 1,
        is_completed: true,
      })
      await repos.habitLogs.create(TEST_USER, {
        habit_id: testHabit.id,
        log_date: '2024-06-17',
        value: 1,
        is_completed: true,
      })

      const logs = await repos.habitLogs.getByDateRange(TEST_USER, {
        start: '2024-06-15',
        end: '2024-06-17',
      })
      expect(logs.length).toBeGreaterThanOrEqual(3)
    })

    it('should get logs by habit', async () => {
      const logs = await repos.habitLogs.getByHabit(TEST_USER, testHabit.id)
      expect(logs.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('DailyReviewRepository', () => {
    it('should upsert daily review', async () => {
      const review = await repos.dailyReviews.upsert(TEST_USER, {
        review_date: '2024-06-15',
        score: 8,
        mood: 4,
        energy: 3,
        achievement: '完成了所有任务',
      })

      expect(review.id).toBeDefined()
      expect(review.score).toBe(8)
      expect(review.review_date).toBe('2024-06-15')
    })

    it('should get review by date', async () => {
      const review = await repos.dailyReviews.getByDate(TEST_USER, '2024-06-15')
      expect(review).not.toBeNull()
      expect(review?.score).toBe(8)
    })

    it('should update existing review on upsert', async () => {
      const updated = await repos.dailyReviews.upsert(TEST_USER, {
        review_date: '2024-06-15',
        score: 9,
        mood: 5,
        achievement: '更新后的成果',
      })

      expect(updated.score).toBe(9)
      expect(updated.mood).toBe(5)
      expect(updated.achievement).toBe('更新后的成果')

      // Verify only one review per date
      const reviews = await repos.dailyReviews.getByDateRange(TEST_USER, {
        start: '2024-06-15',
        end: '2024-06-15',
      })
      expect(reviews.length).toBe(1)
    })

    it('should return null for non-existent date', async () => {
      const review = await repos.dailyReviews.getByDate(TEST_USER, '2099-01-01')
      expect(review).toBeNull()
    })
  })

  describe('UserRepository', () => {
    it('should upsert and get profile', async () => {
      const profile = await repos.users.upsertProfile(TEST_USER, {
        display_name: '测试用户',
        timezone: 'Asia/Shanghai',
      })

      expect(profile.id).toBe(TEST_USER)
      expect(profile.display_name).toBe('测试用户')

      const fetched = await repos.users.getProfile(TEST_USER)
      expect(fetched?.display_name).toBe('测试用户')
    })

    it('should upsert and get preferences', async () => {
      const prefs = await repos.users.upsertPreferences(TEST_USER, {
        theme: 'dark',
        default_calendar_view: 'week',
      })

      expect(prefs.user_id).toBe(TEST_USER)
      expect(prefs.theme).toBe('dark')
      expect(prefs.default_calendar_view).toBe('week')

      const fetched = await repos.users.getPreferences(TEST_USER)
      expect(fetched?.theme).toBe('dark')
    })

    it('should return null for non-existent profile', async () => {
      const profile = await repos.users.getProfile('non-existent-user')
      expect(profile).toBeNull()
    })
  })

  describe('RecurrenceExceptionRepository', () => {
    let testTask: Task

    beforeAll(async () => {
      testTask = await repos.tasks.create(TEST_USER, {
        title: '重复任务',
        task_date: '2024-06-01',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      })
    })

    it('should create and list exceptions', async () => {
      const exc = await repos.recurrenceExceptions.create(TEST_USER, {
        task_id: testTask.id,
        exception_date: '2024-06-03',
        action: 'skip',
      })

      expect(exc.id).toBeDefined()
      expect(exc.action).toBe('skip')

      const exceptions = await repos.recurrenceExceptions.getByTask(TEST_USER, testTask.id)
      expect(exceptions.length).toBe(1)
      expect(exceptions[0].exception_date).toBe('2024-06-03')
    })

    it('should delete exceptions', async () => {
      const exc = await repos.recurrenceExceptions.create(TEST_USER, {
        task_id: testTask.id,
        exception_date: '2024-06-04',
        action: 'modify',
        modified_data: { title: '修改后的标题' },
      })

      await repos.recurrenceExceptions.delete(TEST_USER, exc.id)
      const exceptions = await repos.recurrenceExceptions.getByTask(TEST_USER, testTask.id)
      expect(exceptions.find((e) => e.id === exc.id)).toBeUndefined()
    })
  })

  describe('TaskTemplateRepository', () => {
    it('should create and list templates', async () => {
      const tpl = await repos.taskTemplates.create(TEST_USER, {
        name: '工作日模板',
        template_data: [
          { title: '晨间阅读', period: 'morning', priority: 'normal' },
          { title: '代码审查', period: 'afternoon', priority: 'high' },
        ],
      })

      expect(tpl.id).toBeDefined()
      expect(tpl.name).toBe('工作日模板')

      const templates = await repos.taskTemplates.getAll(TEST_USER)
      expect(templates.length).toBeGreaterThanOrEqual(1)
    })

    it('should delete templates', async () => {
      const tpl = await repos.taskTemplates.create(TEST_USER, {
        name: '临时模板',
        template_data: [],
      })

      await repos.taskTemplates.delete(TEST_USER, tpl.id)
      const templates = await repos.taskTemplates.getAll(TEST_USER)
      expect(templates.find((t) => t.id === tpl.id)).toBeUndefined()
    })
  })

  describe('Cross-entity data integrity', () => {
    it('tasks should be filterable by tag', async () => {
      const tag = await repos.tags.create(TEST_USER, {
        name: '专项标签',
        color: '#ff5500',
        is_default: false,
        is_visible: true,
        sort_order: 10,
      })

      await repos.tasks.create(TEST_USER, {
        title: '标签关联任务',
        task_date: '2024-06-15',
        period: 'morning',
        priority: 'normal',
        status: 'todo',
        tag_id: tag.id,
        order_index: 0,
      })

      const tasks = await repos.tasks.getByDate(TEST_USER, '2024-06-15')
      const tagged = tasks.filter((t) => t.tag_id === tag.id)
      expect(tagged.length).toBeGreaterThanOrEqual(1)
    })

    it('deleting a tag with migration should update tasks', async () => {
      const oldTag = await repos.tags.create(TEST_USER, {
        name: '旧标签',
        color: '#999999',
        is_default: false,
        is_visible: true,
        sort_order: 20,
      })

      const newTag = await repos.tags.create(TEST_USER, {
        name: '新标签',
        color: '#000000',
        is_default: false,
        is_visible: true,
        sort_order: 21,
      })

      await repos.tasks.create(TEST_USER, {
        title: '待迁移任务',
        task_date: '2024-06-15',
        period: 'afternoon',
        priority: 'normal',
        status: 'todo',
        tag_id: oldTag.id,
        order_index: 0,
      })

      await repos.tags.delete(TEST_USER, oldTag.id, newTag.id)

      const tasks = await repos.tasks.getByDate(TEST_USER, '2024-06-15')
      const migrated = tasks.find((t) => t.title === '待迁移任务')
      expect(migrated?.tag_id).toBe(newTag.id)
    })
  })
})
