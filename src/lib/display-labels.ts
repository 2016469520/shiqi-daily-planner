// ============================================================
// Unified display labels — all internal→Chinese mappings
// Used by every Select, display, and form in the app
// ============================================================

import type { Period, CalendarView, WeekStartDay, TaskStatus, Difficulty, UrgencyLevel } from '@/types'

// ---------- Period ----------

export const PERIOD_LABELS: Record<Period, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}

export function getPeriodLabel(period: string): string {
  return PERIOD_LABELS[period as Period] || period
}

// ---------- Task Status ----------

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as TaskStatus] || status
}

// ---------- Difficulty ----------

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '一般',
  hard: '困难',
  very_hard: '极难',
}

export function getDifficultyLabel(d: string): string {
  return DIFFICULTY_LABELS[d as Difficulty] || d
}

// ---------- Urgency (auto-calculated) ----------

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  overdue: '已逾期',
  urgent: '紧急',
  soon: '较紧急',
  upcoming: '近期',
  plenty: '时间充足',
  none: '未设截止',
}

// ---------- Calendar View ----------

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  month: '月视图',
  week: '周视图',
  day: '日视图',
}

// ---------- Week Start Day ----------

export const WEEK_START_LABELS: Record<WeekStartDay, string> = {
  0: '周日',
  1: '周一',
  6: '周六',
}

// ---------- Weekday names ----------

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

// ---------- Focus mode ----------

export const FOCUS_MODE_LABELS = {
  focus: '专注',
  short_break: '短休息',
  long_break: '长休息',
} as const

// ---------- Measurement Type ----------

export const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  boolean: '完成/未完成',
  count: '次数',
  duration: '分钟',
  minutes: '分钟',
  hours: '小时',
  numeric: '自定义数值',
}

export function getMeasurementTypeLabel(type: string): string {
  return MEASUREMENT_TYPE_LABELS[type] || type
}

// ---------- Select placeholder text ----------

export const SELECT_PLACEHOLDER = {
  tag: '选择标签',
  period: '选择时段',
  difficulty: '选择难度',
  status: '选择状态',
  focusCategory: '选择专注分类',
  noTag: '未分类',
  tagDeleted: '标签已删除',
  calendarView: '选择视图',
  weekStart: '选择起始日',
} as const

// ---------- Tag display helpers ----------

export interface TagLike {
  id: string
  name: string
  color: string
}

/**
 * Look up a tag by id from a tag list. Returns the tag or null.
 */
export function findTagById(tags: TagLike[], tagId: string | undefined | null): TagLike | null {
  if (!tagId) return null
  return tags.find((t) => t.id === tagId) || null
}

/**
 * Get the display name for a tag reference.
 * - tagId null/undefined → "未分类"
 * - tag exists → tag.name
 * - tag not found → "标签已删除"
 */
export function getTagDisplayName(tags: TagLike[], tagId: string | undefined | null): string {
  if (!tagId) return SELECT_PLACEHOLDER.noTag
  const tag = findTagById(tags, tagId)
  if (!tag) return SELECT_PLACEHOLDER.tagDeleted
  return tag.name
}

/**
 * Get the color for a tag reference. Returns undefined if no tag.
 */
export function getTagColor(tags: TagLike[], tagId: string | undefined | null): string | undefined {
  if (!tagId) return undefined
  return findTagById(tags, tagId)?.color
}
