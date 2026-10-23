import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createIndexedDBRepositoryFactory } from '@/lib/repositories/indexeddb-impl'
import { closeDB } from '@/lib/db/indexeddb'
import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  countBackup,
  createBackup,
  parseBackup,
  restoreBackup,
} from '@/lib/sync/backup'

const SOURCE_USER = 'backup-src-user'
const TARGET_USER = 'backup-dst-user'

describe('完整备份 / 恢复', () => {
  let repos: RepositoryFactory

  beforeAll(async () => {
    repos = createIndexedDBRepositoryFactory()

    const tag = await repos.tags.create(SOURCE_USER, {
      name: '工作',
      color: '#3b82f6',
      is_default: false,
      is_visible: true,
      sort_order: 0,
    })

    await repos.tasks.create(SOURCE_USER, {
      title: '备份用事项 A',
      task_date: '2026-10-20',
      period: 'morning',
      priority: 'normal',
      status: 'todo',
      order_index: 0,
      tag_id: tag.id,
    })

    await repos.tasks.create(SOURCE_USER, {
      title: '备份用事项 B',
      task_date: null,
      period: 'evening',
      priority: 'normal',
      status: 'done',
      order_index: 1,
    })

    const habit = await repos.habits.create(SOURCE_USER, {
      name: '阅读',
      measurement_type: 'minutes',
      target_value: 30,
      schedule_rule: { frequency: 'daily', interval: 1 },
      start_date: '2026-10-01',
    })

    await repos.habitLogs.create(SOURCE_USER, {
      habit_id: habit.id,
      log_date: '2026-10-20',
      value: 30,
      is_completed: true,
    })

    await repos.dailyReviews.upsert(SOURCE_USER, {
      review_date: '2026-10-20',
      score: 8,
      mood: 4,
      summary: '状态不错',
    })

    await repos.countdowns.create(SOURCE_USER, {
      title: '项目截止',
      target_date: '2026-12-31',
      color: '#ef4444',
      is_yearly: false,
      show_on_home: true,
      is_pinned: false,
      sort_order: 0,
    })
  })

  afterAll(async () => {
    await closeDB()
  })

  it('导出包含全部数据类型', async () => {
    const payload = await createBackup(repos, SOURCE_USER, new Date('2026-10-20T10:00:00Z'))
    expect(payload.format).toBe(BACKUP_FORMAT)
    expect(payload.version).toBe(BACKUP_VERSION)
    expect(payload.exported_at).toBe('2026-10-20T10:00:00.000Z')

    const stats = countBackup(payload)
    expect(stats.tasks).toBe(2)
    expect(stats.tags).toBe(1)
    expect(stats.habits).toBe(1)
    expect(stats.habit_logs).toBe(1)
    expect(stats.reviews).toBe(1)
    expect(stats.countdowns).toBe(1)
  })

  it('备份可以通过 JSON 往返', async () => {
    const payload = await createBackup(repos, SOURCE_USER)
    const roundTrip = parseBackup(JSON.parse(JSON.stringify(payload)))
    expect(countBackup(roundTrip)).toEqual(countBackup(payload))
  })

  it('拒绝非本应用的 JSON', () => {
    expect(() => parseBackup({ hello: 'world' })).toThrow(/不是本应用的备份文件/)
    expect(() => parseBackup(null)).toThrow(/不是对象/)
    expect(() => parseBackup({ format: BACKUP_FORMAT, version: 99, data: {} })).toThrow(/版本/)
  })

  it('恢复后目标用户拿到全部数据，且引用关系被重建', async () => {
    const payload = await createBackup(repos, SOURCE_USER)
    const result = await restoreBackup(repos, TARGET_USER, payload)

    expect(result.skipped).toBe(0)
    expect(result.restored.tasks).toBe(2)
    expect(result.restored.tags).toBe(1)
    expect(result.restored.habits).toBe(1)
    expect(result.restored.habit_logs).toBe(1)
    expect(result.restored.countdowns).toBe(1)

    const targetTasks = await repos.tasks.filter(TARGET_USER, { maxResults: 1000 })
    expect(targetTasks).toHaveLength(2)

    const targetTags = await repos.tags.getAll(TARGET_USER)
    expect(targetTags).toHaveLength(1)
    // 事项的 tag_id 指向目标用户新建的标签，而不是备份里那个已失效的 id
    const tagged = targetTasks.find((t) => t.title === '备份用事项 A')
    expect(tagged?.tag_id).toBe(targetTags[0].id)

    const targetHabits = await repos.habits.getAll(TARGET_USER, true)
    expect(targetHabits).toHaveLength(1)
    const logs = await repos.habitLogs.getByHabit(TARGET_USER, targetHabits[0].id)
    expect(logs).toHaveLength(1)
    expect(logs[0].is_completed).toBe(true)
  })

  it('再次恢复同一份备份不会重复写入评价（按日期 upsert）', async () => {
    const payload = await createBackup(repos, SOURCE_USER)
    await restoreBackup(repos, TARGET_USER, payload)
    await restoreBackup(repos, TARGET_USER, payload)

    const reviews = await repos.dailyReviews.getByDateRange(TARGET_USER, {
      start: '2026-10-01',
      end: '2026-10-31',
    })
    expect(reviews.filter((r) => r.review_date === '2026-10-20')).toHaveLength(1)
  })
})
