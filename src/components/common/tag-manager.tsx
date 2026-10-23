'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, Tag as TagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#64748b',
]

type DeleteAction = 'migrate' | 'clear' | null

export function TagManager() {
  const { user } = useAuth()
  const { tags, tasks } = useRepos()
  const queryClient = useQueryClient()
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [showNewForm, setShowNewForm] = useState(false)
  // Delete confirmation state
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [deleteAction, setDeleteAction] = useState<DeleteAction>(null)
  const [migrateTargetId, setMigrateTargetId] = useState<string>('')
  const [tagUsageCount, setTagUsageCount] = useState(0)
  const [isLoadingUsage, setIsLoadingUsage] = useState(false)

  const { data: tagList = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.getAll(user!.id),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      tags.create(user!.id, { ...data, is_default: false, is_visible: true, sort_order: tagList.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setNewTagName('')
      setShowNewForm(false)
      toast.success('标签已创建')
    },
    onError: () => toast.error('创建标签失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; color: string }) =>
      tags.update(user!.id, data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEditingTag(null)
      toast.success('标签已更新')
    },
    onError: () => toast.error('更新标签失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, migrateToTagId }: { id: string; migrateToTagId?: string }) => {
      if (deleteAction === 'clear') {
        // Clear tag from all tasks first
        return (async () => {
          const userTasks = await tasks.filter(user!.id, { tagIds: [id] })
          for (const task of userTasks) {
            await tasks.update(user!.id, task.id, { tag_id: undefined } as Partial<import('@/types').Task>)
          }
          await tags.delete(user!.id, id)
        })()
      }
      return tags.delete(user!.id, id, migrateToTagId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDeletingTag(null)
      setDeleteAction(null)
      setMigrateTargetId('')
      toast.success('标签已删除')
    },
    onError: () => toast.error('删除标签失败'),
  })

  const handleCreate = () => {
    if (!newTagName.trim()) return
    createMutation.mutate({ name: newTagName.trim(), color: newTagColor })
  }

  const openDeleteDialog = async (tag: Tag) => {
    setDeletingTag(tag)
    setDeleteAction(null)
    setMigrateTargetId('')
    setIsLoadingUsage(true)

    try {
      const userTasks = await tasks.filter(user!.id, { tagIds: [tag.id] })
      setTagUsageCount(userTasks.length)
      if (userTasks.length === 0) {
        setDeleteAction('clear') // No tasks, so default action is fine
      }
    } catch {
      setTagUsageCount(0)
    } finally {
      setIsLoadingUsage(false)
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingTag) return

    if (tagUsageCount === 0) {
      // No tasks using this tag — simple delete
      deleteMutation.mutate({ id: deletingTag.id })
    } else if (deleteAction === 'migrate') {
      if (!migrateTargetId) {
        toast.error('请选择目标标签')
        return
      }
      deleteMutation.mutate({ id: deletingTag.id, migrateToTagId: migrateTargetId })
    } else if (deleteAction === 'clear') {
      deleteMutation.mutate({ id: deletingTag.id })
    } else {
      toast.error('请选择处理方式')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-section">标签管理</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const availableTargets = tagList.filter((t) => t.id !== deletingTag?.id)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-section">标签管理</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          新建
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* New tag form */}
        {showNewForm && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 p-2">
            <Input
              placeholder="标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="min-w-32 flex-1"
              aria-label="新标签名称"
            />
            <div className="flex gap-1">
              {PRESET_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  aria-label={`选择颜色 ${c}`}
                  aria-pressed={newTagColor === c}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 ui-transition',
                    newTagColor === c ? 'scale-110 border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
              添加
            </Button>
          </div>
        )}

        {/* Tag list */}
        {tagList.map((tag) => (
          <div
            key={tag.id}
            className="group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 ui-transition hover:bg-accent/60"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-body">{tag.name}</span>
            {tag.is_default && (
              <Badge variant="secondary" className="h-5 px-2 text-micro">默认</Badge>
            )}
            <div className="flex items-center gap-0.5 opacity-100 ui-transition focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setEditingTag({ id: tag.id, name: tag.name, color: tag.color })}
                title="编辑标签"
                aria-label={`编辑标签 ${tag.name}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => openDeleteDialog(tag)}
                title="删除标签"
                aria-label={`删除标签 ${tag.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}

        {tagList.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-5 text-center">
            <TagIcon className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-body text-muted-foreground">暂无标签</p>
            <p className="text-caption text-muted-foreground/80">新建标签，给事项分类</p>
          </div>
        )}

        {/* Edit dialog */}
        {editingTag && (
          <Dialog open={!!editingTag} onOpenChange={(o) => !o && setEditingTag(null)}>
            <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-section">编辑标签</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-caption text-muted-foreground">标签名称</Label>
                  <Input
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    aria-label="标签名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-caption text-muted-foreground">颜色</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingTag({ ...editingTag, color: c })}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 ui-transition',
                          editingTag.color === c ? 'scale-110 border-foreground' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                        aria-label={`选择颜色 ${c}`}
                        aria-pressed={editingTag.color === c}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditingTag(null)}>取消</Button>
                <Button
                  onClick={() => updateMutation.mutate(editingTag)}
                  disabled={updateMutation.isPending}
                >
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={!!deletingTag} onOpenChange={(o) => !o && setDeletingTag(null)}>
          <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-section">删除标签</DialogTitle>
              <DialogDescription className="text-caption text-muted-foreground">
                确定要删除标签「{deletingTag?.name}」吗？
              </DialogDescription>
            </DialogHeader>

            {isLoadingUsage ? (
              <div className="py-4 text-center text-body text-muted-foreground">检查标签使用情况…</div>
            ) : tagUsageCount === 0 ? (
              <div className="rounded-md bg-surface-2 px-3 py-2">
                <p className="text-caption text-muted-foreground">该标签未被任何事项使用，可以安全删除。</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-body">
                  该标签正被 <strong className="tabular-nums">{tagUsageCount}</strong> 个事项使用，
                  请选择如何处理这些事项：
                </p>

                <div className="space-y-2">
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-md border p-3 ui-transition',
                      deleteAction === 'migrate'
                        ? 'border-primary/40 bg-accent/60'
                        : 'border-border hover:bg-accent/40'
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteAction"
                      value="migrate"
                      checked={deleteAction === 'migrate'}
                      onChange={() => setDeleteAction('migrate')}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <span className="text-body font-medium">迁移到其他标签</span>
                      {deleteAction === 'migrate' && (
                        <div className="mt-2">
                          <Select value={migrateTargetId} onValueChange={(v) => setMigrateTargetId(v ?? '')}>
                            <SelectTrigger className="w-full rounded-md">
                              <SelectValue placeholder="选择目标标签" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTargets.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                    {t.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-md border p-3 ui-transition',
                      deleteAction === 'clear'
                        ? 'border-primary/40 bg-accent/60'
                        : 'border-border hover:bg-accent/40'
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteAction"
                      value="clear"
                      checked={deleteAction === 'clear'}
                      onChange={() => { setDeleteAction('clear'); setMigrateTargetId('') }}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className="text-body font-medium">清除关联，保留事项</span>
                  </label>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeletingTag(null)}>取消</Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending || (tagUsageCount > 0 && deleteAction === null)}
              >
                {deleteMutation.isPending ? '删除中…' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
