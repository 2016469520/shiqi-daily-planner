'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { calcUrgency } from '@/lib/utils/urgency'
import {
  getPeriodLabel,
  getStatusLabel,
  getDifficultyLabel,
  getTagDisplayName,
  getTagColor,
  URGENCY_LABELS,
} from '@/lib/display-labels'
import type { Task, Period, Difficulty, TaskStatus } from '@/types'
import {
  Trash2,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/use-media-query'

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export function TaskDetailPanel({ task, open, onClose }: TaskDetailPanelProps) {
  const { user } = useAuth()
  const { tasks: taskRepo, tags: tagRepo } = useRepos()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [, setSaving] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tagRepo.getAll(user?.id || ''),
    enabled: !!user,
  })

  // Local state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [period, setPeriod] = useState<Period>('morning')
  const [tagId, setTagId] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [dueAt, setDueAt] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      startTransition(() => {
        setTitle(task.title)
        setDescription(task.description || '')
        setTaskDate(task.task_date || '')
        setPeriod(task.period)
        setTagId(task.tag_id || '')
        setDifficulty(task.difficulty || 'medium')
        setDueAt(task.due_at ? task.due_at.slice(0, 16) : '')
        setStatus(task.status)
        setEstimatedMinutes(task.estimated_minutes?.toString() || '')
      })
    }
  }, [task])

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!user || !task) return
      setSaving(field)
      try {
        const update: Partial<Task> = { [field]: value }
        if (field === 'status' && value === 'done') {
          update.completed_at = new Date().toISOString()
        }
        await taskRepo.update(user.id, task.id, update)
        queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
      } catch {
        toast.error('保存失败')
      } finally {
        setSaving(null)
      }
    },
    [user, task, taskRepo, queryClient]
  )

  const debouncedSave = useCallback(
    (field: string, value: unknown) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveField(field, value), 600)
    },
    [saveField]
  )

  const handleDelete = async () => {
    if (!user || !task) return
    try {
      await taskRepo.softDelete(user.id, task.id)
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
      toast.success('已删除')
      onClose()
    } catch {
      toast.error('删除失败')
    }
  }

  if (!task || !open) return null

  // Computed display labels for SelectValue children
  const tagDisplay = tagId ? getTagDisplayName(tagList, tagId) : '未分类'
  const tagColor = tagId ? getTagColor(tagList, tagId) : undefined
  const urgency = calcUrgency(task)

  const formContent = (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <Input
          data-testid="task-detail-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            debouncedSave('title', e.target.value)
          }}
          className="h-auto border-none px-0 text-body font-medium focus-visible:ring-0"
          placeholder="任务标题"
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-caption text-muted-foreground">状态</span>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as TaskStatus)
            saveField('status', v)
          }}
        >
          <SelectTrigger className="h-8 text-caption flex-1">
            <SelectValue>{getStatusLabel(status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries({
              todo: '待办',
              in_progress: '进行中',
              done: '已完成',
              cancelled: '已取消',
            }) as [TaskStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-caption text-muted-foreground">难度</span>
        <Select
          value={difficulty}
          onValueChange={(v) => {
            setDifficulty(v as Difficulty)
            saveField('difficulty', v)
          }}
        >
          <SelectTrigger className="h-8 text-caption flex-1">
            <SelectValue>{getDifficultyLabel(difficulty)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries({
              easy: '简单',
              medium: '一般',
              hard: '困难',
              very_hard: '极难',
            }) as [Difficulty, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due date */}
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-1">
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => {
              setDueAt(e.target.value)
              const val = e.target.value ? new Date(e.target.value).toISOString() : null
              saveField('due_at', val)
            }}
            className="h-8 text-caption"
          />
          {task.due_at && (
            <span className="text-micro text-muted-foreground">
              紧迫度：{URGENCY_LABELS[urgency]}
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          data-testid="task-detail-date"
          type="date"
          value={taskDate}
          onChange={(e) => {
            setTaskDate(e.target.value)
            saveField('task_date', e.target.value || null)
          }}
          className="h-8 text-caption flex-1"
        />
      </div>

      {/* Period */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select
          value={period}
          onValueChange={(v) => {
            setPeriod(v as Period)
            saveField('period', v)
          }}
        >
          <SelectTrigger className="h-8 text-caption flex-1">
            <SelectValue>{getPeriodLabel(period)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">上午</SelectItem>
            <SelectItem value="afternoon">下午</SelectItem>
            <SelectItem value="evening">晚上</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag */}
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select
          value={tagId || 'none'}
          onValueChange={(v) => {
            const val = (v && v !== 'none') ? v : ''
            setTagId(val)
            saveField('tag_id', val || null)
          }}
        >
          <SelectTrigger className="h-8 text-caption flex-1">
            <SelectValue>
              {tagId ? (
                <span className="flex items-center gap-1.5">
                  {tagColor && (
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                  )}
                  <span>{tagDisplay}</span>
                </span>
              ) : (
                '未分类'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未分类</SelectItem>
            {tagList.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estimated time */}
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="number"
          value={estimatedMinutes}
          onChange={(e) => {
            setEstimatedMinutes(e.target.value)
            debouncedSave('estimated_minutes', e.target.value ? Number(e.target.value) : null)
          }}
          placeholder="预计用时（分钟）"
          className="h-8 text-caption flex-1"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <span className="text-caption text-muted-foreground">说明</span>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            debouncedSave('description', e.target.value)
          }}
          placeholder="添加说明..."
          rows={3}
          className="resize-none text-caption"
        />
      </div>

      {/* Meta info */}
      <div className="space-y-1 border-t border-border pt-2 text-micro text-muted-foreground">
        <div>创建：{task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '—'}</div>
        <div>更新：{task.updated_at ? new Date(task.updated_at).toLocaleString('zh-CN') : '—'}</div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-border pt-2">
        <Button
          data-testid="task-detail-delete"
          variant="outline"
          size="sm"
          className="flex-1 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          删除
        </Button>
      </div>
    </div>
  )

  // Desktop: centered floating Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only text-section">任务详情</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: fullscreen Drawer
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>任务详情</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto">{formContent}</div>
      </DrawerContent>
    </Drawer>
  )
}
