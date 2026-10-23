// ============================================================
// 完整数据备份 / 恢复
// 本地优先模式下这是跨设备搬数据、防止误删的主要手段
// 纯逻辑层：只依赖 Repository 接口，便于单元测试
// ============================================================

import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import type {
  Task,
  Tag,
  Habit,
  HabitLog,
  DailyReview,
  Countdown,
  TaskTemplate,
  FocusSession,
  UserPreferences,
} from '@/types'

export const BACKUP_FORMAT = 'plan-calendar-backup'
export const BACKUP_VERSION = 1

/** 覆盖足够长时间，避免老数据漏掉 */
const FULL_RANGE_START = '1970-01-01'
const FULL_RANGE_END = '2999-12-31'

export interface BackupData {
  tasks: Task[]
  tags: Tag[]
  habits: Habit[]
  habit_logs: HabitLog[]
  reviews: DailyReview[]
  countdowns: Countdown[]
  templates: TaskTemplate[]
  focus_sessions: FocusSession[]
  preferences: UserPreferences | null
}

export interface BackupPayload {
  format: typeof BACKUP_FORMAT
  version: number
  exported_at: string
  app: string
  data: BackupData
}

export interface BackupStats {
  tasks: number
  tags: number
  habits: number
  habit_logs: number
  reviews: number
  countdowns: number
  templates: number
  focus_sessions: number
}

export interface RestoreResult {
  restored: BackupStats
  skipped: number
}

const EMPTY_STATS: BackupStats = {
  tasks: 0,
  tags: 0,
  habits: 0,
  habit_logs: 0,
  reviews: 0,
  countdowns: 0,
  templates: 0,
  focus_sessions: 0,
}

const FULL_RANGE = { start: FULL_RANGE_START, end: FULL_RANGE_END }

/** 汇总当前用户的全部数据 */
export async function createBackup(
  repos: RepositoryFactory,
  userId: string,
  now: Date = new Date()
): Promise<BackupPayload> {
  const [
    tasks,
    tags,
    habits,
    habitLogs,
    reviews,
    countdowns,
    templates,
    focusSessions,
    preferences,
  ] = await Promise.all([
    repos.tasks.filter(userId, { maxResults: 100000 }),
    repos.tags.getAll(userId),
    repos.habits.getAll(userId, true),
    repos.habitLogs.getByDateRange(userId, FULL_RANGE),
    repos.dailyReviews.getByDateRange(userId, FULL_RANGE),
    repos.countdowns.list(userId, true),
    repos.taskTemplates.getAll(userId),
    repos.focusSessions.getByDateRange(userId, FULL_RANGE),
    repos.users.getPreferences(userId).catch(() => null),
  ])

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: now.toISOString(),
    app: '时格',
    data: {
      tasks,
      tags,
      habits,
      habit_logs: habitLogs,
      reviews,
      countdowns,
      templates,
      focus_sessions: focusSessions,
      preferences: preferences ?? null,
    },
  }
}

export function countBackup(payload: BackupPayload): BackupStats {
  const d = payload.data
  return {
    tasks: d.tasks?.length ?? 0,
    tags: d.tags?.length ?? 0,
    habits: d.habits?.length ?? 0,
    habit_logs: d.habit_logs?.length ?? 0,
    reviews: d.reviews?.length ?? 0,
    countdowns: d.countdowns?.length ?? 0,
    templates: d.templates?.length ?? 0,
    focus_sessions: d.focus_sessions?.length ?? 0,
  }
}

/** 校验备份文件结构，避免把任意 JSON 当成备份导进来 */
export function parseBackup(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') throw new Error('备份内容不是对象')
  const obj = raw as Partial<BackupPayload>
  if (obj.format !== BACKUP_FORMAT) throw new Error('不是本应用的备份文件')
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
    throw new Error('备份文件版本不受支持')
  }
  const data = obj.data
  if (!data || typeof data !== 'object') throw new Error('备份文件缺少数据段')

  const asArray = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? (value as T[]) : []

  return {
    format: BACKUP_FORMAT,
    version: obj.version,
    exported_at: typeof obj.exported_at === 'string' ? obj.exported_at : '',
    app: typeof obj.app === 'string' ? obj.app : '',
    data: {
      tasks: asArray<Task>(data.tasks),
      tags: asArray<Tag>(data.tags),
      habits: asArray<Habit>(data.habits),
      habit_logs: asArray<HabitLog>(data.habit_logs),
      reviews: asArray<DailyReview>(data.reviews),
      countdowns: asArray<Countdown>(data.countdowns),
      templates: asArray<TaskTemplate>(data.templates),
      focus_sessions: asArray<FocusSession>(data.focus_sessions),
      preferences: (data.preferences ?? null) as UserPreferences | null,
    },
  }
}

/** 去掉仓库层负责生成的字段，得到可再次插入的记录 */
function stripRecord<T extends { id?: string; user_id?: string; created_at?: string; updated_at?: string }>(
  record: T
): Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  const copy = { ...record }
  delete copy.id
  delete copy.user_id
  delete copy.created_at
  delete copy.updated_at
  return copy as Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>
}

/**
 * 把备份写回当前用户。
 * 采用"补写"策略：先写入标签/习惯（被引用方），再写事项与记录；
 * 单条失败只累加 skipped，不中断整体恢复。
 */
export async function restoreBackup(
  repos: RepositoryFactory,
  userId: string,
  payload: BackupPayload
): Promise<RestoreResult> {
  const stats: RestoreStats = { ...EMPTY_STATS }
  let skipped = 0

  const attempt = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      return true
    } catch {
      skipped++
      return false
    }
  }

  // 标签（先恢复，事项的 tag_id 才能对上）
  const tagIdMap = new Map<string, string>()
  for (const tag of payload.data.tags) {
    const created = await repos.tags
      .create(userId, stripRecord(tag))
      .catch(() => null)
    if (created) {
      tagIdMap.set(tag.id, created.id)
      stats.tags++
    } else {
      skipped++
    }
  }

  // 习惯
  const habitIdMap = new Map<string, string>()
  for (const habit of payload.data.habits) {
    const created = await repos.habits
      .create(userId, stripRecord(habit))
      .catch(() => null)
    if (created) {
      habitIdMap.set(habit.id, created.id)
      stats.habits++
    } else {
      skipped++
    }
  }

  // 事项
  const taskIdMap = new Map<string, string>()
  for (const task of payload.data.tasks) {
    const data = stripRecord(task)
    if (data.tag_id) data.tag_id = tagIdMap.get(data.tag_id) ?? undefined
    const created = await repos.tasks.create(userId, data).catch(() => null)
    if (created) {
      taskIdMap.set(task.id, created.id)
      stats.tasks++
    } else {
      skipped++
    }
  }

  // 习惯打卡记录
  for (const log of payload.data.habit_logs) {
    const habitId = habitIdMap.get(log.habit_id)
    if (!habitId) {
      skipped++
      continue
    }
    const ok = await attempt(() => repos.habitLogs.create(userId, { ...stripRecord(log), habit_id: habitId }))
    if (ok) stats.habit_logs++
  }

  // 每日评价（按日期 upsert，天然幂等）
  for (const review of payload.data.reviews) {
    const ok = await attempt(() => repos.dailyReviews.upsert(userId, stripRecord(review)))
    if (ok) stats.reviews++
  }

  // 倒数日
  for (const countdown of payload.data.countdowns) {
    const ok = await attempt(() => repos.countdowns.create(userId, stripRecord(countdown)))
    if (ok) stats.countdowns++
  }

  // 模板
  for (const template of payload.data.templates) {
    const ok = await attempt(() => repos.taskTemplates.create(userId, stripRecord(template)))
    if (ok) stats.templates++
  }

  // 专注记录
  for (const session of payload.data.focus_sessions) {
    const data = stripRecord(session)
    if (data.task_id) data.task_id = taskIdMap.get(data.task_id) ?? undefined
    const ok = await attempt(() => repos.focusSessions.create(userId, data))
    if (ok) stats.focus_sessions++
  }

  // 偏好设置
  if (payload.data.preferences) {
    const prefs = stripRecord(payload.data.preferences)
    await attempt(() => repos.users.upsertPreferences(userId, prefs))
  }

  return { restored: stats, skipped }
}

type RestoreStats = BackupStats
