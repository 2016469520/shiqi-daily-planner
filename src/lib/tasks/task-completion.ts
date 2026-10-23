// ============================================================
// 重复事项的行为实现
//
// 数据模型：一个重复事项就是一个"系列"。首个事项是根（root），
// 之后每次完成时生成的实例带 recurrence_parent_id 指回根。
//
// 选用"完成时生成下一次"而不是预先铺满日历：
// - 不会在工作区里堆出几十个还没到的实例
// - 用户放弃某次重复时，未来不会被提前占位
// - 与现有字段（recurrence_parent_id / recurrence_exceptions）兼容，不需要改表
// ============================================================

import type { RepositoryFactory } from '@/lib/repositories/interfaces'
import type { RecurrenceRule, Task } from '@/types'
import { getRecurrenceDates } from '@/lib/utils/recurrence'
import { addDays, parseISO, toDateStr } from '@/lib/utils/date'
import { atmosphereEvents } from '@/lib/atmosphere/bus'

/** 往后找多久；一年足够覆盖所有常见规则（含"每月 31 号"这类空洞） */
const LOOKAHEAD_DAYS = 366

/** 去掉 count：count 表示"整个系列总共发生几次"，不能在一次计算里判断 */
function withoutCount(rule: RecurrenceRule): RecurrenceRule {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    byWeekday: rule.byWeekday,
    byMonthDay: rule.byMonthDay,
    bySetPos: rule.bySetPos,
    endDate: rule.endDate,
  }
}

/**
 * 求 afterDate 之后的下一个发生日期。
 * @param seriesStart 系列起点（根事项的日期），用于间隔计算
 */
export function nextOccurrenceAfter(
  seriesStart: string,
  rule: RecurrenceRule,
  afterDate: string,
  lookaheadDays: number = LOOKAHEAD_DAYS
): string | null {
  if (!rule || rule.frequency === undefined) return null
  const rangeStart = toDateStr(addDays(parseISO(afterDate), 1))
  const rangeEnd = toDateStr(addDays(parseISO(afterDate), lookaheadDays))
  const dates = getRecurrenceDates(seriesStart, withoutCount(rule), rangeStart, rangeEnd)
  return dates[0] ?? null
}

interface SeriesContext {
  rootId: string
  seriesStart: string
  existing: Task[]
}

/** 找到系列根与已有实例，用于去重与次数上限判断 */
async function loadSeries(
  repos: RepositoryFactory,
  userId: string,
  task: Task
): Promise<SeriesContext | null> {
  const rootId = task.recurrence_parent_id ?? task.id
  const root = task.recurrence_parent_id ? await repos.tasks.getById(userId, rootId) : task
  const seriesStart = root?.task_date ?? task.task_date
  if (!seriesStart) return null

  const range = {
    start: toDateStr(addDays(parseISO(seriesStart), -1)),
    end: toDateStr(addDays(parseISO(seriesStart), LOOKAHEAD_DAYS)),
  }
  const all = await repos.tasks.getByDateRange(userId, range)
  const existing = all.filter((t) => t.id === rootId || t.recurrence_parent_id === rootId)
  return { rootId, seriesStart, existing }
}

/**
 * 为已完成（或刚保存）的重复事项生成下一个实例。
 * 已存在同日期实例、或达到 count 上限、或规则已到期时返回 null。
 */
export async function spawnNextOccurrence(
  repos: RepositoryFactory,
  userId: string,
  task: Task
): Promise<Task | null> {
  const rule = task.recurrence_rule
  if (!rule || !task.task_date) return null

  const series = await loadSeries(repos, userId, task)
  if (!series) return null

  // count 是"整个系列总共几次"，包含根事项
  if (rule.count && series.existing.length >= rule.count) return null

  const nextDate = nextOccurrenceAfter(series.seriesStart, rule, task.task_date)
  if (!nextDate) return null

  // 去重：同系列同日期已经有实例就不再生成（防止重复点击完成）
  if (series.existing.some((t) => t.task_date === nextDate)) return null

  return repos.tasks.create(userId, {
    title: task.title,
    description: task.description,
    task_date: nextDate,
    period: task.period,
    start_time: task.start_time,
    end_time: task.end_time,
    tag_id: task.tag_id,
    priority: task.priority,
    difficulty: task.difficulty,
    due_at: task.due_at,
    status: 'todo',
    estimated_minutes: task.estimated_minutes,
    recurrence_rule: rule,
    recurrence_parent_id: series.rootId,
    order_index: 0,
  })
}

/**
 * 统一的完成/取消完成入口：更新状态，完成时顺带生成下一次。
 * 取消完成不会撤回已生成的下一实例（避免误删用户已改动的那一条）。
 */
export async function setTaskCompletion(
  repos: RepositoryFactory,
  userId: string,
  task: Task,
  done: boolean
): Promise<{ spawned: Task | null }> {
  await repos.tasks.update(userId, task.id, {
    status: done ? 'done' : 'todo',
    completed_at: done ? new Date().toISOString() : undefined,
  } as Partial<Task>)

  if (!done) {
    atmosphereEvents.idle()
    return { spawned: null }
  }

  // 真实完成事件 → 角色开心 + 轻量庆祝（由氛围层自行决定是否展示）
  atmosphereEvents.happy()
  atmosphereEvents.celebrate()

  try {
    return { spawned: await spawnNextOccurrence(repos, userId, task) }
  } catch {
    // 生成失败不影响"已完成"这个主操作，但要让角色提示一下
    atmosphereEvents.error()
    return { spawned: null }
  }
}
