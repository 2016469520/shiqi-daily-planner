'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { subscribeDataChanged, type DataChangeScope } from '@/lib/widget-sync'

/**
 * 跨窗口同步：主窗口与桌面浮窗同时打开时，一边改数据，另一边自动刷新。
 * 只失效相关查询，避免整页重取。
 */
export function useCrossWindowSync(): void {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    const handle = (scope: DataChangeScope) => {
      if (scope === 'tasks' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      }
      if (scope === 'habits' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['habits'] })
        queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
      }
      if (scope === 'reviews' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['reviews'] })
      }
      if (scope === 'focus' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['focus', 'active'] })
        queryClient.invalidateQueries({ queryKey: ['focus', 'stats'] })
      }
    }

    return subscribeDataChanged(handle)
  }, [queryClient, user?.id])
}
