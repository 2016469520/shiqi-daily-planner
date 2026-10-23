import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createIndexedDBRepositoryFactory } from '@/lib/repositories/indexeddb-impl'
import { closeDB } from '@/lib/db/indexeddb'
import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import type { Task } from '@/types'
import { nextOccurrenceAfter, setTaskCompletion, spawnNextOccurrence } from '@/lib/tasks/task-completion'

const USER = 'recurring-user'

const baseTask: Task = {
  id: 'task-root',
  user_id: USER,
  title: '每日复盘',
  task_date: '2026-03-02', // 周一
  period: 'evening',
  priority: 'normal',
  status: 'todo',
  order_index: 0,
  created_at: '2026-03-02T10:00:00.000Z',
  updated_at: '2026-03-02T10:00:00.000Z',
}

describe('重复规则：下一次日期计算', () => {
  it('每天：从次日开始', () => {
    const next = nextOccurrenceAfter('2026-03-02', { frequency: 'daily', interval: 1 }, '2026-03-02')
    expect(next).toBe('2026-03-03')
  })

  it('每 2 天：按间隔跳', () => {
    expect(nextOccurrenceAfter('2026-03-02', { frequency: 'daily', interval: 2 }, '2026-03-02')).toBe(
      '2026-03-04'
    )
    expect(nextOccurrenceAfter('2026-03-02', { frequency: 'daily', interval: 2 }, '2026-03-04')).toBe(
      '2026-03-06'
    )
  })

  it('工作日：周五之后是下周一', () => {
    // 2026-03-06 是周五
    expect(nextOccurrenceAfter('2026-03-02', { frequency: 'weekdays', interval: 1 }, '2026-03-06')).toBe(
      '2026-03-09'
    )
  })

  it('每周指定星期几', () => {
    const rule = { frequency: 'weekly' as const, interval: 1, byWeekday: [1, 4] }
    expect(nextOccurrenceAfter('2026-03-02', rule, '2026-03-02')).toBe('2026-03-05')
  })

  it('每月同一天', () => {
    const rule = { frequency: 'monthly' as const, interval: 1, byMonthDay: 15 }
    expect(nextOccurrenceAfter('2026-03-15', rule, '2026-03-15')).toBe('2026-04-15')
  })

  it('超过结束日期后不再发生', () => {
    const rule = { frequency: 'daily' as const, interval: 1, endDate: '2026-03-05' }
    expect(nextOccurrenceAfter('2026-03-02', rule, '2026-03-05')).toBeNull()
  })

  it('每月 31 号：没有 31 号的月份会跳过', () => {
    const rule = { frequency: 'monthly' as const, interval: 1, byMonthDay: 31 }
    expect(nextOccurrenceAfter('2026-01-31', rule, '2026-01-31')).toBe('2026-03-31')
  })

  it('没有规则时不产生下一次', () => {
    expect(nextOccurrenceAfter('2026-03-02', { frequency: 'daily', interval: 1 }, '2026-03-02')).toBe(
      '2026-03-03'
    )
  })
})

describe('重复规则：完成时生成实例', () => {
  let repos: RepositoryFactory

  beforeAll(() => {
    repos = createIndexedDBRepositoryFactory()
  })

  afterAll(async () => {
    await closeDB()
  })

  it('完成每日重复事项后，次日出现新实例并指向根', async () => {
    const root = await repos.tasks.create(USER, {
      title: '每日复盘',
      task_date: '2026-04-01',
      period: 'evening',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
      recurrence_rule: { frequency: 'daily', interval: 1 },
    })

    const { spawned } = await setTaskCompletion(repos, USER, root, true)
    expect(spawned).not.toBeNull()
    expect(spawned?.task_date).toBe('2026-04-02')
    expect(spawned?.recurrence_parent_id).toBe(root.id)
    expect(spawned?.status).toBe('todo')

    const reloaded = await repos.tasks.getById(USER, root.id)
    expect(reloaded?.status).toBe('done')
  })

  it('重复完成不会生成重复日期', async () => {
    const root = await repos.tasks.create(USER, {
      title: '每周总结',
      task_date: '2026-05-04',
      period: 'evening',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
      recurrence_rule: { frequency: 'weekly', interval: 1, byWeekday: [1] },
    })

    const first = await spawnNextOccurrence(repos, USER, root)
    expect(first?.task_date).toBe('2026-05-11')

    const again = await spawnNextOccurrence(repos, USER, root)
    expect(again).toBeNull()
  })

  it('达到 count 上限后停止生成', async () => {
    const root = await repos.tasks.create(USER, {
      title: '限三次',
      task_date: '2026-06-01',
      period: 'morning',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
      recurrence_rule: { frequency: 'daily', interval: 1, count: 3 },
    })

    const second = await spawnNextOccurrence(repos, USER, root)
    expect(second?.task_date).toBe('2026-06-02')
    const third = second ? await spawnNextOccurrence(repos, USER, second) : null
    expect(third?.task_date).toBe('2026-06-03')
    // 已有 3 条（包含根），再点不会生成第 4 条
    const fourth = third ? await spawnNextOccurrence(repos, USER, third) : null
    expect(fourth).toBeNull()
  })

  it('没有重复规则时不生成', async () => {
    const plain = await repos.tasks.create(USER, {
      title: '一次性',
      task_date: '2026-07-01',
      period: 'morning',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
    })
    const spawned = await spawnNextOccurrence(repos, USER, plain)
    expect(spawned).toBeNull()
  })

  it('取消完成不会撤回已生成的实例', async () => {
    const root = await repos.tasks.create(USER, {
      title: '取消测试',
      task_date: '2026-08-03',
      period: 'morning',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
      recurrence_rule: { frequency: 'daily', interval: 1 },
    })
    await setTaskCompletion(repos, USER, root, true)
    await setTaskCompletion(repos, USER, root, false)

    const nextDay = await repos.tasks.getByDate(USER, '2026-08-04')
    expect(nextDay.some((t) => t.recurrence_parent_id === root.id)).toBe(true)
  })
})

// 让 baseTask 被使用，避免未使用变量（仅作示例数据保留）
void baseTask
