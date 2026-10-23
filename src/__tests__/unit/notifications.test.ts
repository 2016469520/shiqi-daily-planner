import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
  notifyTaskReminder,
  notifyHabitReminder,
  notifyOverdueTask,
  notifyDailyReview,
} from '@/lib/utils/notifications'

/**
 * Helper: set up a mock Notification API.
 * Uses `Object.defineProperty` so `'Notification' in window` returns true.
 */
function mockNotificationAPI(permission: NotificationPermission = 'default') {
  const ctor = Object.assign(
    vi.fn(function (this: object, _title: string, _options?: unknown) {
      Object.assign(this, { onclick: null, close: vi.fn() })
    }),
    {
      permission,
      requestPermission: vi.fn().mockResolvedValue(permission),
    }
  )

  Object.defineProperty(globalThis, 'Notification', {
    value: ctor,
    writable: true,
    configurable: true,
  })
  // Also ensure itʼs visible on `window` in jsdom
  if (typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>).Notification = ctor
  }

  return ctor
}

function clearNotificationAPI() {
  // @ts-expect-error - test cleanup
  delete globalThis.Notification
  if (typeof window !== 'undefined') {
    // @ts-expect-error - test cleanup
    delete window.Notification
  }
}

describe('notification utilities', () => {
  afterEach(() => {
    clearNotificationAPI()
  })

  describe('isNotificationSupported', () => {
    it('returns false when Notification is not available', () => {
      clearNotificationAPI()
      expect(isNotificationSupported()).toBe(false)
    })

    it('returns true when Notification is available', () => {
      mockNotificationAPI()
      expect(isNotificationSupported()).toBe(true)
    })
  })

  describe('getNotificationPermission', () => {
    it('returns unsupported when Notification is not available', () => {
      clearNotificationAPI()
      expect(getNotificationPermission()).toBe('unsupported')
    })

    it('returns current permission state', () => {
      mockNotificationAPI('granted')
      expect(getNotificationPermission()).toBe('granted')
    })
  })

  describe('requestNotificationPermission', () => {
    it('returns unsupported when Notification is not available', async () => {
      clearNotificationAPI()
      const result = await requestNotificationPermission()
      expect(result).toBe('unsupported')
    })

    it('requests and returns permission', async () => {
      const ctor = mockNotificationAPI('default')
      ctor.requestPermission = vi.fn().mockResolvedValue('granted')

      const result = await requestNotificationPermission()
      expect(result).toBe('granted')
      expect(ctor.requestPermission).toHaveBeenCalled()
    })

    it('returns denied on error', async () => {
      const ctor = mockNotificationAPI('default')
      ctor.requestPermission = vi.fn().mockRejectedValue(new Error('Not allowed'))

      const result = await requestNotificationPermission()
      expect(result).toBe('denied')
    })
  })

  describe('showBrowserNotification', () => {
    it('returns false when permission is not granted', () => {
      mockNotificationAPI('denied')
      expect(showBrowserNotification('test')).toBe(false)
    })

    it('returns false when not supported', () => {
      clearNotificationAPI()
      expect(showBrowserNotification('test')).toBe(false)
    })

    it('creates a notification when permission is granted', () => {
      const ctor = mockNotificationAPI('granted')

      const result = showBrowserNotification('Test Title', {
        body: 'Test body',
        tag: 'test-tag',
      })

      expect(result).toBe(true)
      expect(ctor).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test body',
          tag: 'test-tag',
        })
      )
    })

    it('returns false and does not throw on Notification constructor error', () => {
      const ctor = mockNotificationAPI('granted')
      ctor.mockImplementation(() => {
        throw new Error('Constructor error')
      })

      const result = showBrowserNotification('test')
      expect(result).toBe(false)
    })
  })

  describe('pre-built notification helpers', () => {
    beforeEach(() => {
      mockNotificationAPI('granted')
    })

    it('notifyTaskReminder shows task notification', () => {
      const result = notifyTaskReminder('Review code')
      expect(result).toBe(true)
    })

    it('notifyTaskReminder includes time and period info', () => {
      const result = notifyTaskReminder('Meeting', {
        taskTime: '14:00',
        taskDate: '2026-06-30',
        period: '下午',
      })
      expect(result).toBe(true)
    })

    it('notifyHabitReminder shows habit notification', () => {
      const result = notifyHabitReminder('Exercise')
      expect(result).toBe(true)
    })

    it('notifyHabitReminder includes target info', () => {
      const result = notifyHabitReminder('Reading', {
        targetValue: '30分钟',
      })
      expect(result).toBe(true)
    })

    it('notifyOverdueTask shows overdue notification', () => {
      const result = notifyOverdueTask('Submit report')
      expect(result).toBe(true)
    })

    it('notifyOverdueTask with count shows plural message', () => {
      const result = notifyOverdueTask('Task A', 3)
      expect(result).toBe(true)
    })

    it('notifyDailyReview shows review reminder', () => {
      const result = notifyDailyReview()
      expect(result).toBe(true)
    })
  })
})
