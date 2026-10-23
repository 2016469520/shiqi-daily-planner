'use client'

import { useCallback } from 'react'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Task, Period } from '@/types'
import { calculateReorderAfterMove, needsRebalance, rebalanceOrderIndices } from '@/lib/utils/sort-order'

export interface MoveTarget {
  task_date?: string
  period?: Period
  order_index?: number
}

export interface UseTaskDndReturn {
  handleReorder: (
    tasks: Task[],
    fromIndex: number,
    toIndex: number
  ) => Promise<void>
  handleMove: (
    taskId: string,
    target: MoveTarget
  ) => Promise<void>
  handleMoveToDate: (
    taskId: string,
    taskDate: string,
    period?: Period
  ) => Promise<void>
  isMoving: boolean
}

export function useTaskDnd(): UseTaskDndReturn {
  const { user } = useAuth()
  const { tasks: taskRepo } = useRepos()
  const queryClient = useQueryClient()

  const moveMutation = useMutation({
    mutationFn: ({ id, target }: { id: string; target: MoveTarget }) =>
      taskRepo.moveTask(user!.id, id, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      toast.error('移动失败，已恢复原位置')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; order_index: number }[]) =>
      taskRepo.reorder(user!.id, updates),
    onError: () => {
      toast.error('排序失败')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleReorder = useCallback(
    async (tasks: Task[], fromIndex: number, toIndex: number) => {
      const items = tasks.map((t) => ({ id: t.id, order_index: t.order_index }))
      const reorderUpdates = calculateReorderAfterMove(items, fromIndex, toIndex)

      if (reorderUpdates.length === 0) return

      // Check if rebalance is needed (add stale rebalancing alongside the move)
      const allItems = [...items.map((i) => {
        const update = reorderUpdates.find((u) => u.id === i.id)
        return update ? { ...i, order_index: update.order_index } : i
      })]

      if (needsRebalance(allItems)) {
        const rebalanced = rebalanceOrderIndices(allItems)
        await reorderMutation.mutateAsync(rebalanced)
        toast.success('已排序')
      } else {
        await reorderMutation.mutateAsync(reorderUpdates)
      }
    },
    [reorderMutation]
  )

  const handleMove = useCallback(
    async (taskId: string, target: MoveTarget) => {
      await moveMutation.mutateAsync({ id: taskId, target })
    },
    [moveMutation]
  )

  const handleMoveToDate = useCallback(
    async (taskId: string, taskDate: string, period?: Period) => {
      const target: MoveTarget = { task_date: taskDate }
      if (period) target.period = period
      await moveMutation.mutateAsync({ id: taskId, target })
    },
    [moveMutation]
  )

  return {
    handleReorder,
    handleMove,
    handleMoveToDate,
    isMoving: moveMutation.isPending || reorderMutation.isPending,
  }
}
