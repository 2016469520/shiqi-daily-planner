import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  eachDayOfInterval,
  getISOWeek,
  differenceInDays,
  nextSaturday,
  nextMonday,
} from 'date-fns'

// ---------- Date helpers ----------

/**
 * 把 Date 转成本地时区的 yyyy-MM-dd。
 *
 * 禁止用 `date.toISOString().slice(0, 10)` 表示"本地日期"：在 UTC+ 时区
 * （例如北京时间）的 00:00–08:00 之间，UTC 日期比本地日期早一天，
 * 会让计划日期整体偏移、把今天的任务算成延期。
 */
export function toDateStr(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayStr(): string {
  return toDateStr(new Date())
}

/** 明天（本地时区），返回 yyyy-MM-dd */
export function tomorrowStr(from: string = todayStr()): string {
  return format(addDays(parseISO(from), 1), 'yyyy-MM-dd')
}

/** 本周末：最近的周六（本地时区）。今天就是周六时取下周六。 */
export function thisWeekendStr(from: string = todayStr()): string {
  return format(nextSaturday(parseISO(from)), 'yyyy-MM-dd')
}

/** 下周：下周一（本地时区）。 */
export function nextWeekStr(from: string = todayStr()): string {
  return format(nextMonday(parseISO(from)), 'yyyy-MM-dd')
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function formatDate(date: string | Date, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDisplayDate(date: string): string {
  const d = parseISO(date)
  return format(d, 'yyyy年M月d日')
}

export function formatWeekday(date: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = parseISO(date)
  return weekdays[parseInt(format(d, 'i')) % 7]
}

export function parseDateStr(dateStr: string): Date {
  return parseISO(dateStr)
}

// ---------- Calendar range calculations ----------

export function getMonthRange(date: Date | string, weekStartsOn: 0 | 1 | 6 = 0): { start: string; end: string } {
  const d = typeof date === 'string' ? parseISO(date) : date
  const monthStart = startOfMonth(d)
  const monthEnd = endOfMonth(d)
  // Expand to full weeks for display
  const displayStart = startOfWeek(monthStart, { weekStartsOn })
  const displayEnd = endOfWeek(monthEnd, { weekStartsOn })
  return {
    start: format(displayStart, 'yyyy-MM-dd'),
    end: format(displayEnd, 'yyyy-MM-dd'),
  }
}

/**
 * 自然月范围（1 号 → 月末），用于月度统计。
 * 与 getMonthRange 不同：不扩展到整周，避免把相邻月份的日期算进"本月"。
 */
export function getCalendarMonthRange(date: Date | string): { start: string; end: string } {
  const d = typeof date === 'string' ? parseISO(date) : date
  return {
    start: format(startOfMonth(d), 'yyyy-MM-dd'),
    end: format(endOfMonth(d), 'yyyy-MM-dd'),
  }
}

export function getWeekRange(date: Date | string, weekStartsOn: 0 | 1 | 6 = 0): { start: string; end: string; days: string[] } {  const d = typeof date === 'string' ? parseISO(date) : date
  const weekStart = startOfWeek(d, { weekStartsOn })
  const weekEnd = endOfWeek(d, { weekStartsOn })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) =>
    format(d, 'yyyy-MM-dd')
  )
  return {
    start: format(weekStart, 'yyyy-MM-dd'),
    end: format(weekEnd, 'yyyy-MM-dd'),
    days,
  }
}

// ---------- Navigation ----------

export function navigateDate(date: string, view: 'month' | 'week' | 'day', direction: -1 | 1): string {
  const d = parseISO(date)
  switch (view) {
    case 'month':
      return format(direction > 0 ? addMonths(d, 1) : subMonths(d, 1), 'yyyy-MM-dd')
    case 'week':
      return format(direction > 0 ? addWeeks(d, 1) : subWeeks(d, 1), 'yyyy-MM-dd')
    case 'day':
      return format(direction > 0 ? addDays(d, 1) : subDays(d, 1), 'yyyy-MM-dd')
  }
}

// ---------- Period time ranges (for display) ----------

export const PERIOD_RANGES = {
  morning: { start: '06:00', end: '12:00', label: '上午' },
  afternoon: { start: '12:00', end: '18:00', label: '下午' },
  evening: { start: '18:00', end: '23:59', label: '晚上' },
} as const

// Re-export commonly used functions
export {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  eachDayOfInterval,
  getISOWeek,
  differenceInDays,
}
