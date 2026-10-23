'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  notifyTaskReminder,
  notifyHabitReminder,
  notifyOverdueTask,
  notifyDailyReview,
  type NotificationPermissionState,
} from '@/lib/utils/notifications'
import { todayStr } from '@/lib/utils/date'
import type { Task, Habit, HabitLog } from '@/types'

// ---------- Types ----------

export interface TaskReminder {
  type: 'task'
  task: Task
  isOverdue: boolean
  timeLabel: string
}

export interface HabitReminder {
  type: 'habit'
  habit: Habit
  isDue: boolean
  todayLog?: HabitLog
  timeLabel: string
}

export interface ReviewReminder {
  type: 'review'
  isDone: boolean
}

export type ReminderItem = TaskReminder | HabitReminder | ReviewReminder

export interface ReminderList {
  items: ReminderItem[]
  overdueCount: number
  upcomingCount: number
}

// ---------- Hook ----------

export function useNotifications() {
  const { user } = useAuth()
  const { tasks, habits, habitLogs, dailyReviews } = useRepos()

  const [permission, setPermission] = useState<NotificationPermissionState>(
    getNotificationPermission
  )

  /**
   * Request notification permission. The caller must ensure this is
   * triggered by a user gesture (e.g., button click).
   */
  const requestPermission = useCallback(async () => {
    const state = await requestNotificationPermission()
    setPermission(state)
    return state
  }, [])

  // Fetch tasks with reminders for today and overdue
  const today = todayStr()

  const { data: todaysTasks = [] } = useQuery({
    queryKey: ['tasks', user?.id, 'today'],
    queryFn: () => tasks.getByDate(user!.id, today),
    enabled: !!user,
  })

  const { data: allHabits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habits.getAll(user!.id),
    enabled: !!user,
  })

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['habitLogs', today],
    queryFn: () => habitLogs.getByDate(user!.id, today),
    enabled: !!user,
  })

  const { data: todayReview } = useQuery({
    queryKey: ['dailyReview', today],
    queryFn: () => dailyReviews.getByDate(user!.id, today),
    enabled: !!user,
  })

  // Build reminder list
  const reminderList: ReminderList = (() => {
    const items: ReminderItem[] = []
    let overdueCount = 0

    // Task reminders: tasks that have reminder_at set, or overdue tasks
    for (const task of todaysTasks) {
      if (task.status === 'done' || task.status === 'cancelled') continue

      const isOverdue = !!task.task_date && task.task_date < today
      if (isOverdue) overdueCount++

      if (task.reminder_at || isOverdue) {
        items.push({
          type: 'task',
          task,
          isOverdue,
          timeLabel: task.reminder_at
            ? formatReminderTime(task.reminder_at)
            : task.start_time || task.period,
        })
      }
    }

    // Also check for overdue tasks from past dates
    // (tasks that have reminder_at, are not done/cancelled, and task_date < today)
    // This is covered in the query above, but we should also filter overdue ones

    // Habit reminders: habits with reminder_time set and not yet checked in today
    const loggedHabitIds = new Set(todayLogs.filter((l) => l.is_completed).map((l) => l.habit_id))

    for (const habit of allHabits) {
      if (habit.archived_at) continue
      if (!habit.reminder_time) continue

      const todayLog = todayLogs.find((l) => l.habit_id === habit.id)
      const isDue = !loggedHabitIds.has(habit.id)

      if (isDue) {
        items.push({
          type: 'habit',
          habit,
          isDue,
          todayLog,
          timeLabel: habit.reminder_time,
        })
      }
    }

    // Daily review reminder (in the evening)
    const hasReview = !!todayReview

    items.push({
      type: 'review',
      isDone: hasReview,
    })

    return {
      items,
      overdueCount,
      upcomingCount: items.length,
    }
  })()

  /**
   * Manually trigger notifications for the current reminder list.
   * This should be called from a user interaction context.
   */
  const notifyNow = useCallback(() => {
    let shown = 0

    for (const item of reminderList.items) {
      if (item.type === 'task' && item.isOverdue) {
        if (notifyOverdueTask(item.task.title)) shown++
      } else if (item.type === 'task' && item.task.reminder_at) {
        if (notifyTaskReminder(item.task.title, {
          taskDate: item.task.task_date || undefined,
          taskTime: item.task.start_time,
          period: item.task.period,
        })) shown++
      } else if (item.type === 'habit' && item.isDue) {
        if (notifyHabitReminder(item.habit.name, {
          targetValue: `${item.habit.target_value}${item.habit.unit || ''}`,
        })) shown++
      } else if (item.type === 'review' && !item.isDone) {
        if (notifyDailyReview()) shown++
      }
    }

    return { shown, total: reminderList.items.length }
  }, [reminderList])

  return {
    permission,
    requestPermission,
    isSupported: isNotificationSupported(),
    reminderList,
    notifyNow,
  }
}

// ---------- Helpers ----------

function formatReminderTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}
