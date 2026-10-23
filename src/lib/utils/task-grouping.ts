// ============================================================
// Task grouping utilities for category view
// Pure functions, independent of UI framework
// ============================================================

import type { Task, Tag } from '@/types'
import { todayStr } from '@/lib/utils/date'

// ---------- Time Buckets ----------

export type TimeBucket =
  | 'overdue'
  | 'today'
  | 'next7days'
  | 'later'
  | 'undated'
  | 'done'

export const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  overdue: '已延期',
  today: '今天',
  next7days: '未来7天',
  later: '更晚',
  undated: '未安排日期',
  done: '已完成',
}

export const TIME_BUCKET_ORDER: TimeBucket[] = [
  'overdue',
  'today',
  'next7days',
  'later',
  'undated',
  'done',
]

/**
 * Assign a task to a time bucket based on its date and status.
 */
export function getTimeBucket(task: Task, referenceDate?: string): TimeBucket {
  const today = referenceDate || todayStr()

  if (task.status === 'done') return 'done'

  if (!task.task_date) return 'undated'

  if (task.task_date < today && task.status !== 'cancelled') return 'overdue'

  if (task.task_date === today) return 'today'

  // Calculate days difference
  const diff = dateDiffInDays(task.task_date, today)
  if (diff <= 7) return 'next7days'

  return 'later'
}

// ---------- Category Grouping ----------

export interface CategoryGroup {
  tagId: string | null // null = uncategorized
  tagName: string
  tagColor: string
  tagIcon?: string
  sortOrder: number
  tasks: Task[]
  buckets: Record<TimeBucket, Task[]>
  total: number
  done: number
  completionRate: number
}

/**
 * Group tasks by their tag_id.
 * Tasks without tag_id go to "未分类".
 * Cancelled tasks are excluded by default.
 */
export function groupTasksByTag(
  tasks: Task[],
  tags: Tag[],
  options: {
    hideCancelled?: boolean
    hideEmpty?: boolean
    referenceDate?: string
  } = {}
): CategoryGroup[] {
  const { hideCancelled = true, hideEmpty = false, referenceDate } = options

  // Filter out soft-deleted and optionally cancelled tasks
  const visible = tasks.filter((t) => {
    if (t.deleted_at) return false
    if (hideCancelled && t.status === 'cancelled') return false
    return true
  })

  // Sort tags by sort_order
  const sortedTags = [...tags].sort((a, b) => a.sort_order - b.sort_order)

  // Group by tag_id
  const groupMap = new Map<string | null, Task[]>()
  groupMap.set(null, []) // Uncategorized

  for (const tag of sortedTags) {
    groupMap.set(tag.id, [])
  }

  for (const task of visible) {
    const key = task.tag_id || null
    const group = groupMap.get(key)
    if (group) {
      group.push(task)
    } else {
      // Tag not in tags list — treat as uncategorized
      const uncat = groupMap.get(null)!
      uncat.push(task)
    }
  }

  // Build result
  const result: CategoryGroup[] = []

  // Uncategorized first
  const uncatTasks = groupMap.get(null) || []
  if (!hideEmpty || uncatTasks.length > 0) {
    result.push(buildCategoryGroup(null, '未分类', '#94a3b8', uncatTasks, -1, referenceDate))
  }

  // Then sorted tags
  for (const tag of sortedTags) {
    const tagTasks = groupMap.get(tag.id) || []
    if (!hideEmpty || tagTasks.length > 0) {
      result.push(
        buildCategoryGroup(tag.id, tag.name, tag.color, tagTasks, tag.sort_order, referenceDate, tag.icon)
      )
    }
  }

  return result
}

function buildCategoryGroup(
  tagId: string | null,
  tagName: string,
  tagColor: string,
  tasks: Task[],
  sortOrder: number,
  referenceDate?: string,
  tagIcon?: string
): CategoryGroup {
  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length

  const buckets: Record<TimeBucket, Task[]> = {
    overdue: [],
    today: [],
    next7days: [],
    later: [],
    undated: [],
    done: [],
  }

  for (const task of tasks) {
    const bucket = getTimeBucket(task, referenceDate)
    buckets[bucket].push(task)
  }

  return {
    tagId,
    tagName,
    tagColor,
    tagIcon,
    sortOrder,
    tasks,
    buckets,
    total,
    done,
    completionRate: total > 0 ? done / total : 0,
  }
}

// ---------- Completion Rate Calculation ----------

export interface CategoryCompletionStats {
  tagId: string | null
  tagName: string
  total: number
  done: number
  completionRate: number
}

export function calculateCategoryCompletion(
  tasks: Task[],
  tags: Tag[]
): CategoryCompletionStats[] {
  const groups = groupTasksByTag(tasks, tags, { hideCancelled: true, hideEmpty: true })
  return groups.map((g) => ({
    tagId: g.tagId,
    tagName: g.tagName,
    total: g.total,
    done: g.done,
    completionRate: g.completionRate,
  }))
}

// ---------- Helpers ----------

function dateDiffInDays(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00')
  const d2 = new Date(b + 'T00:00:00')
  const diffMs = d1.getTime() - d2.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
