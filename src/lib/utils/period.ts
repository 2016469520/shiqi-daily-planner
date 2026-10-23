import type { Period } from '@/types'

/**
 * 按当前时间推断默认时段。
 * 06:00–12:00 上午 / 12:00–18:00 下午 / 其余 晚上。
 */
export function defaultPeriodByTime(now: Date = new Date()): Period {
  const hour = now.getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}
