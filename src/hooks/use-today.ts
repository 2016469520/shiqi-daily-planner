'use client'

import { useEffect, useState } from 'react'
import { todayStr } from '@/lib/utils/date'

/**
 * 返回本地「今天」（yyyy-MM-dd），并在跨天后自动更新。
 *
 * 页面常驻整夜时，直接在渲染中调用 todayStr() 会一直停留在打开页面那天，
 * 导致次日早上看到的还是昨天的日程。此钩子通过定时检查 + 窗口重新聚焦
 * 来刷新日期，跨天后依赖 today 的查询会自动重新取数。
 */
export function useToday(): string {
  const [today, setToday] = useState(todayStr)

  useEffect(() => {
    const sync = () => {
      const next = todayStr()
      setToday((prev) => (prev === next ? prev : next))
    }

    const timer = setInterval(sync, 30_000)
    const handleVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }

    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', sync)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return today
}
