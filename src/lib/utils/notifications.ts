// ============================================================
// Browser notification utilities
// NEVER request notification permission on page load.
// Always triggered by explicit user action (button click).
// ============================================================

const NOTIFICATION_ICON = '/icon-192.png'

export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'prompt'

/**
 * Check if the Notification API is available in this browser.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Get the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

/**
 * Request notification permission. MUST be called from a user gesture
 * (e.g., button onClick handler). Returns the resulting state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported'

  try {
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  } catch {
    // Some browsers may throw if called without user gesture
    return 'denied'
  }
}

/**
 * Show a browser notification. Silently no-ops if permission is not granted.
 * Returns true if the notification was shown, false otherwise.
 */
export function showBrowserNotification(
  title: string,
  options?: {
    body?: string
    tag?: string
    requireInteraction?: boolean
    data?: Record<string, unknown>
  }
): boolean {
  if (!isNotificationSupported()) return false
  if (Notification.permission !== 'granted') return false

  try {
    const notification = new Notification(title, {
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      body: options?.body,
      tag: options?.tag ?? 'plan-calendar',
      requireInteraction: options?.requireInteraction ?? false,
      data: options?.data,
    })

    // Clicking the notification focuses the app
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Auto-close non-interactive notifications after 6 seconds
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 6000)
    }

    return true
  } catch {
    return false
  }
}

// ---------- Pre-built notification helpers ----------

/**
 * Show a task reminder notification.
 */
export function notifyTaskReminder(
  taskTitle: string,
  options?: {
    taskDate?: string
    taskTime?: string
    period?: string
    body?: string
  }
): boolean {
  const timeInfo = options?.taskTime
    ? `⏰ ${options.taskTime}`
    : options?.period
    ? `📋 ${options.period}`
    : ''

  const body = options?.body || [timeInfo, options?.taskDate].filter(Boolean).join(' · ')

  return showBrowserNotification(`📌 ${taskTitle}`, {
    body: body || '该开始啦',
    tag: `task-reminder`,
    requireInteraction: true,
    data: { type: 'task-reminder', taskTitle: options?.taskDate },
  })
}

/**
 * Show a habit reminder notification.
 */
export function notifyHabitReminder(
  habitName: string,
  options?: {
    targetValue?: string
    body?: string
  }
): boolean {
  const body = options?.body || (options?.targetValue ? `今日目标：${options.targetValue}` : '别忘了打卡哦')

  return showBrowserNotification(`✅ ${habitName}`, {
    body,
    tag: `habit-reminder`,
    requireInteraction: true,
    data: { type: 'habit-reminder', habitName },
  })
}

/**
 * Show an overdue task notification.
 */
export function notifyOverdueTask(
  taskTitle: string,
  count?: number
): boolean {
  const title = count && count > 1
    ? `${count} 个事项已过期`
    : `事项已过期：${taskTitle}`

  return showBrowserNotification(`⚠️ ${title}`, {
    body: '请及时处理或重新安排',
    tag: 'overdue-task',
    requireInteraction: true,
    data: { type: 'overdue-task' },
  })
}

/**
 * Show a daily review reminder notification.
 */
export function notifyDailyReview(): boolean {
  return showBrowserNotification('📝 今日总结', {
    body: '花两分钟记录今天的完成情况吧',
    tag: 'daily-review',
    data: { type: 'daily-review' },
  })
}
