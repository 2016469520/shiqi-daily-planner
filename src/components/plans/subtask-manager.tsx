'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, CheckCircle2, Circle, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskSubitem } from '@/types'

interface SubtaskManagerProps {
  taskId: string
}

export function SubtaskManager({ taskId }: SubtaskManagerProps) {
  const { user } = useAuth()
  const { taskSubitems } = useRepos()
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  /** 正在重命名的子任务：用应用内弹窗代替 window.prompt */
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null)

  const { data: subitems = [], isLoading } = useQuery({
    queryKey: ['taskSubitems', taskId],
    queryFn: () => taskSubitems.getByTaskId(user!.id, taskId),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      taskSubitems.create(user!.id, {
        task_id: taskId,
        title,
        is_completed: false,
        sort_order: subitems.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubitems', taskId] })
      setNewTitle('')
    },
    onError: () => toast.error('创建子任务失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskSubitem> }) =>
      taskSubitems.update(user!.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubitems', taskId] })
    },
    onError: () => toast.error('更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskSubitems.delete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubitems', taskId] })
    },
    onError: () => toast.error('删除失败'),
  })

  const handleAdd = () => {
    if (!newTitle.trim()) return
    createMutation.mutate(newTitle.trim())
  }

  const handleToggle = async (sub: TaskSubitem) => {
    await updateMutation.mutateAsync({
      id: sub.id,
      data: { is_completed: !sub.is_completed },
    })
  }

  const handleEditTitle = async (sub: TaskSubitem, title: string) => {
    if (!title.trim()) return
    await updateMutation.mutateAsync({ id: sub.id, data: { title } })
  }

  const completedCount = subitems.filter((s) => s.is_completed).length
  const percent = subitems.length > 0 ? Math.round((completedCount / subitems.length) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-section">子任务</span>
        {subitems.length > 0 && (
          <span className="text-caption tabular-nums text-muted-foreground">
            {completedCount}/{subitems.length}
          </span>
        )}
      </div>

      {/* Add new subtask */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="添加子任务…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button
          size="icon"
          className="shrink-0"
          onClick={handleAdd}
          disabled={createMutation.isPending || !newTitle.trim()}
          aria-label="添加子任务"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Subtask list */}
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : subitems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-5 text-center">
          <ListChecks className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-body text-muted-foreground">暂无子任务</p>
          <p className="text-caption text-muted-foreground/80">把大任务拆成小步骤，逐项完成</p>
        </div>
      ) : (
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {subitems.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                'group flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 ui-transition hover:bg-accent/60',
                sub.is_completed && 'opacity-60'
              )}
            >
              {/* Drag handle（暂未启用拖拽，弱化展示） */}
              <GripVertical
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30"
                aria-hidden="true"
              />

              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleToggle(sub)}
                className="shrink-0 rounded-full"
                title={sub.is_completed ? '标记未完成' : '标记完成'}
                aria-label={sub.is_completed ? '标记未完成' : '标记完成'}
              >
                {sub.is_completed ? (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
                )}
              </button>

              {/* Title (editable on double-click) */}
              <span
                className={cn(
                  'flex-1 truncate text-body',
                  sub.is_completed && 'text-muted-foreground line-through'
                )}
                onDoubleClick={() => setRenaming({ id: sub.id, title: sub.title })}
                title="双击编辑"
              >
                {sub.title}
              </span>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground opacity-0 ui-transition hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => deleteMutation.mutate(sub.id)}
                aria-label="删除子任务"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {subitems.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-caption tabular-nums text-muted-foreground">{percent}%</span>
        </div>
      )}

      {/* 重命名（替代 window.prompt） */}
      <Dialog
        open={!!renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null)
        }}
      >
        <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section">编辑子任务</DialogTitle>
            <DialogDescription className="text-caption text-muted-foreground">
              改个好认的名字，回车即可保存。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renaming?.title ?? ''}
            autoFocus
            onChange={(e) =>
              setRenaming((prev) => (prev ? { ...prev, title: e.target.value } : prev))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (renaming?.title.trim()) {
                  const target = subitems.find((s) => s.id === renaming.id)
                  if (target) handleEditTitle(target, renaming.title.trim())
                  setRenaming(null)
                }
              }
            }}
            aria-label="子任务标题"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenaming(null)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (!renaming?.title.trim()) return
                const target = subitems.find((s) => s.id === renaming.id)
                if (target) handleEditTitle(target, renaming.title.trim())
                setRenaming(null)
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
