// ============================================================
// Urgency calculation — pure function, auto-computed from due_at
// ============================================================

import type { Task, UrgencyLevel } from '@/types'

/**
 * Calculate urgency level based on due_at and current time.
 * Pure function — always call with current time, never cache results.
 *
 * @param task — the task to evaluate
 * @param now — current time (inject for testing)
 * @returns urgency level
 */
export function calcUrgency(task: Task, now: Date = new Date()): UrgencyLevel {
  // No urgency for completed/cancelled tasks
  if (task.status === 'done' || task.status === 'cancelled') {
    return 'none'
  }

  // No due date → no urgency
  if (!task.due_at) {
    return 'none'
  }

  const dueDate = new Date(task.due_at)
  const diffMs = dueDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // Overdue
  if (diffHours < 0) {
    return 'overdue'
  }

  // Within 24 hours
  if (diffHours <= 24) {
    return 'urgent'
  }

  // Within 3 days
  if (diffHours <= 72) {
    return 'soon'
  }

  // Within 7 days
  if (diffHours <= 168) {
    return 'upcoming'
  }

  // More than 7 days
  return 'plenty'
}

/**
 * Check if a task is overdue (past due_at and not completed).
 */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return calcUrgency(task, now) === 'overdue'
}

/**
 * Get a human-readable urgency description.
 */
export function describeOverdue(task: Task, now: Date = new Date()): string {
  if (!task.due_at) return ''
  const dueDate = new Date(task.due_at)
  const diffMs = now.getTime() - dueDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours <= 0) return ''
  if (diffHours < 24) return `已逾期${diffHours}小时`
  return `已逾期${diffDays}天`
}
