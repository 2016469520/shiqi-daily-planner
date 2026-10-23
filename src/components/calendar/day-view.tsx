'use client'

import { useMemo, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { format, parseISO, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { PERIOD_LABELS } from '@/lib/constants'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import {
  SortableTaskItem,
  PeriodDropZone,
  TaskDragContext,
  TaskDragOverlay,
} from '@/components/calendar/task-dnd'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { DragOverlay } from '@dnd-kit/core'
import type { Task, Period, Priority } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Circle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  Sun,
  Sunset,
  Moon,
  CalendarPlus,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMediaQuery } from '@/hooks/use-media-query'
import { TaskEditDialog } from '@/components/plans/task-edit-dialog'
import { setTaskCompletion } from '@/lib/tasks/task-completion'
import { PERIOD_CLASS, PERIOD_ORDER } from '@/lib/period-style'
const PERIOD_ICONS: Record<Period, typeof Sun> = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
}
function dayNav(date: string, dir: -1 | 1): string {
  const d = parseISO(date)
  d.setDate(d.getDate() + dir)
  return format(d, 'yyyy-MM-dd')
}

interface DayViewProps {
  currentDate: string
  onDateChange: (date: string) => void
  /** 嵌入到其它页面（如今日页）时：不自带滚动容器与日期头 */
  embedded?: boolean
}

export function DayView({ currentDate, onDateChange, embedded = false }: DayViewProps) {
  const { user } = useAuth()
  const repos = useRepos()
  const { tasks, tags } = repos
  const queryClient = useQueryClient()
  const [newTaskPeriod, setNewTaskPeriod] = useState<Period | null>(null)
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null)
  const [dragOverPeriod, setDragOverPeriod] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { handleReorder, handleMove, isMoving } = useTaskDnd()

  const { data: dayTasks = [] } = useQuery({
    queryKey: ['tasks', user?.id, 'day', currentDate],
    queryFn: () => tasks.getByDate(user!.id, currentDate),
    enabled: !!user,
  })

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.getAll(user!.id),
    enabled: !!user,
  })

  const tasksByPeriod = useMemo(() => {
    const map: Record<Period, Task[]> = { morning: [], afternoon: [], evening: [] }
    for (const task of dayTasks) {
      map[task.period].push(task)
    }
    for (const period of PERIOD_ORDER) {
      map[period].sort((a, b) => a.order_index - b.order_index)
    }
    return map
  }, [dayTasks])

  const doneCount = dayTasks.filter((t) => t.status === 'done').length
  const totalCount = dayTasks.filter((t) => t.status !== 'cancelled').length
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => tasks.softDelete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      tasks.create(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTaskPeriod(null)
    },
  })

  const toggleTask = (task: Task) => {
    // 走统一入口：完成重复事项时会顺带生成下一次
    void setTaskCompletion(repos, user!.id, task, task.status !== 'done').then(() =>
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    )
  }

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = (event.active.data.current as { task?: Task })?.task
    if (task) setActiveDragTask(task)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragTask(null)
      setDragOverPeriod(null)

      if (!over) return

      const activeTask = (active.data.current as { task?: Task })?.task
      if (!activeTask) return

      // Determine target period
      const targetPeriod = (over.data.current as { period?: Period })?.period
      const overTask = (over.data.current as { task?: Task })?.task

      if (targetPeriod && targetPeriod !== activeTask.period) {
        // Cross-period move
        const targetTasks = tasksByPeriod[targetPeriod]
        const newOrder = targetTasks.length > 0
          ? targetTasks[targetTasks.length - 1].order_index + 1000
          : 0

        await handleMove(activeTask.id, {
          period: targetPeriod,
          order_index: newOrder,
        })
        return
      }

      if (overTask && overTask.id !== activeTask.id && overTask.period === activeTask.period) {
        // Reorder within same period
        const periodTasks = tasksByPeriod[activeTask.period]
        const fromIndex = periodTasks.findIndex((t) => t.id === activeTask.id)
        const toIndex = periodTasks.findIndex((t) => t.id === overTask.id)

        if (fromIndex >= 0 && toIndex >= 0) {
          await handleReorder(periodTasks, fromIndex, toIndex)
        }
      }
    },
    [tasksByPeriod, handleReorder, handleMove]
  )

  // Keyboard/menu move handlers
  const handleMoveUp = useCallback(
    async (task: Task) => {
      const periodTasks = tasksByPeriod[task.period]
      const idx = periodTasks.findIndex((t) => t.id === task.id)
      if (idx > 0) {
        await handleReorder(periodTasks, idx, idx - 1)
      }
    },
    [tasksByPeriod, handleReorder]
  )

  const handleMoveDown = useCallback(
    async (task: Task) => {
      const periodTasks = tasksByPeriod[task.period]
      const idx = periodTasks.findIndex((t) => t.id === task.id)
      if (idx < periodTasks.length - 1) {
        await handleReorder(periodTasks, idx, idx + 1)
      }
    },
    [tasksByPeriod, handleReorder]
  )

  const handleMoveToPeriod = useCallback(
    async (task: Task, targetPeriod: Period) => {
      const targetTasks = tasksByPeriod[targetPeriod]
      const newOrder = targetTasks.length > 0
        ? targetTasks[targetTasks.length - 1].order_index + 1000
        : 0
      await handleMove(task.id, { period: targetPeriod, order_index: newOrder })
    },
    [tasksByPeriod, handleMove]
  )

  const handleCopyTask = useCallback(
    async (task: Task) => {
      if (!user) return
      try {
        await tasks.create(user.id, {
          title: `${task.title} (副本)`,
          description: task.description,
          task_date: task.task_date,
          period: task.period,
          start_time: task.start_time,
          end_time: task.end_time,
          tag_id: task.tag_id,
          priority: task.priority,
          status: 'todo',
          estimated_minutes: task.estimated_minutes,
          reminder_at: task.reminder_at,
          recurrence_rule: task.recurrence_rule,
          order_index: task.order_index + 1,
        } as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } catch {
        // silently fail, toast handled by mutation
      }
    },
    [user, tasks, queryClient]
  )

  return (
    <div className={cn('flex flex-col', !embedded && 'h-full overflow-auto')}>
      {/* Day header —— 嵌入模式（今日页）由页面自己的概览卡承担，避免日期与完成度重复 */}
      {!embedded && (
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onDateChange(dayNav(currentDate, -1))}
              title="前一天"
              aria-label="前一天"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 px-1">
              <h2
                className={cn(
                  'truncate text-section',
                  isToday(parseISO(currentDate)) ? 'text-primary' : 'text-foreground'
                )}
              >
                {format(parseISO(currentDate), 'M月d日 EEEE', { locale: zhCN })}
              </h2>
              <p className="text-micro tabular-nums text-muted-foreground">
                {doneCount}/{totalCount} 已完成
                {isMoving && ' · 移动中'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onDateChange(dayNav(currentDate, 1))}
              title="后一天"
              aria-label="后一天"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-caption tabular-nums text-muted-foreground">{completionPct}%</span>
          </div>
        </div>
      </div>
      )}

      {/* Three periods with DnD */}
      <TaskDragContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            'mx-auto w-full max-w-2xl flex-1 space-y-3',
            embedded ? 'px-0 py-0' : 'p-4 sm:p-6'
          )}
        >
          {PERIOD_ORDER.map((period) => {
            const periodTasks = tasksByPeriod[period]
            const taskIds = periodTasks.map((t) => t.id)
            const PeriodIcon = PERIOD_ICONS[period]

            return (
              <section
                key={period}
                className={cn('rounded-lg border border-border bg-card p-3', PERIOD_CLASS[period])}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3
                    className={cn(
                      'flex min-w-0 items-center gap-1.5 pl-2.5 text-section text-foreground',
                      PERIOD_CLASS[period],
                      'period-rail'
                    )}
                  >
                    <PeriodIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {PERIOD_LABELS[period]}
                    <span className="ml-0.5 text-caption font-normal tabular-nums text-muted-foreground">
                      {periodTasks.filter((t) => t.status === 'done').length}/
                      {periodTasks.filter((t) => t.status !== 'cancelled').length}
                    </span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-caption"
                    onClick={() => setNewTaskPeriod(period)}
                  >
                    <Plus className="h-3.5 w-3.5" />添加
                  </Button>
                </div>

                <PeriodDropZone
                  period={period}
                  taskIds={taskIds}
                  isOver={dragOverPeriod === period}
                  className="space-y-2"
                >
                  {periodTasks.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-6 text-center"
                      data-droppable-period={period}
                    >
                      <CalendarPlus className="h-6 w-6 text-muted-foreground/60" />
                      <p className="text-body text-muted-foreground">
                        {PERIOD_LABELS[period]}暂无事项
                      </p>
                      <p className="text-caption text-muted-foreground/70">
                        拖拽事项到这里，或点击右上角「添加」
                      </p>
                    </div>
                  ) : (
                    periodTasks.map((task) => (
                      <SortableTaskItem key={task.id} task={task}>
                        {({ dragHandle, isDragging }) => (
                          <div data-droppable-period={task.period}>
                            <TaskCard
                              task={task}
                              onToggle={() => toggleTask(task)}
                              onDelete={() => deleteTaskMutation.mutate(task.id)}
                              onMoveUp={() => handleMoveUp(task)}
                              onMoveDown={() => handleMoveDown(task)}
                              onMoveToPeriod={(p) => handleMoveToPeriod(task, p)}
                              onEdit={() => { setEditingTask(task); setEditDialogOpen(true) }}
                              onCopy={() => handleCopyTask(task)}
                              dragHandle={dragHandle}
                              isDragging={isDragging}
                            />
                          </div>
                        )}
                      </SortableTaskItem>
                    ))
                  )}
                </PeriodDropZone>
              </section>
            )
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlayWrapper>
          {activeDragTask ? (
            <TaskDragOverlay task={activeDragTask} />
          ) : null}
        </DragOverlayWrapper>
      </TaskDragContext>

      {/* Quick add dialog */}
      {newTaskPeriod && (
        <QuickAddDialog
          open={!!newTaskPeriod}
          onOpenChange={(open) => !open && setNewTaskPeriod(null)}
          period={newTaskPeriod}
          tagList={tagList}
          onSubmit={(data) =>
            createTaskMutation.mutate({
              title: data.title,
              task_date: currentDate,
              period: newTaskPeriod,
              priority: (data.priority as Priority) || 'normal',
              status: 'todo',
              order_index: tasksByPeriod[newTaskPeriod].length,
              tag_id: data.tag_id || undefined,
            })
          }
          isDesktop={isDesktop}
        />
      )}

      {/* Edit dialog */}
      <TaskEditDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        defaultDate={currentDate}
      />
    </div>
  )
}

// ---------- Task Card with Drag Handle ----------

function TaskCard({
  task,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToPeriod,
  onEdit,
  onCopy,
  dragHandle,
  isDragging,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToPeriod: (period: Period) => void
  onEdit: () => void
  onCopy: () => void
  dragHandle?: React.ReactNode
  isDragging?: boolean
}) {
  return (
    <div
      className={cn(
        // 分区本身已是卡片，任务行不再套边框，避免"卡中卡"
        'group flex items-start gap-2 rounded-md px-2.5 py-2.5 ui-transition hover:bg-surface-2',
        isDragging && 'shadow-lg ring-2 ring-primary',
        task.status === 'done' && 'bg-surface-2'
      )}
    >
      {/* Drag handle */}
      {dragHandle}

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0"
        title={task.status === 'done' ? '标记未完成' : '标记完成'}
      >
        {task.status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {task.tag && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: task.tag.color }}
            />
          )}
          <span
            className={cn(
              'truncate text-body font-medium',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          {task.priority === 'urgent' && task.status !== 'done' && (
            <Badge variant="destructive" className="h-4 shrink-0 px-1.5 text-micro">紧急</Badge>
          )}
          {task.priority === 'high' && task.status !== 'done' && (
            <Badge variant="outline" className="h-4 shrink-0 border-orange-300 px-1.5 text-micro text-orange-600">高</Badge>
          )}
        </div>

        {(task.start_time || task.description) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
            {task.start_time && (
              <span className="flex items-center gap-0.5 tabular-nums">
                <Clock className="h-3 w-3" />
                {task.start_time}
                {task.end_time && ` - ${task.end_time}`}
              </span>
            )}
            {task.description && (
              <span className="truncate">{task.description}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={onEdit}>
              <Edit2 className="h-3.5 w-3.5 mr-2" />编辑
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopy}>
              <Edit2 className="h-3.5 w-3.5 mr-2" />复制
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onMoveUp}>
              <ArrowUp className="h-3.5 w-3.5 mr-2" />上移
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onMoveDown}>
              <ArrowDown className="h-3.5 w-3.5 mr-2" />下移
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onMoveToPeriod('morning')}>
              <MoveHorizontal className="h-3.5 w-3.5 mr-2" />移到上午
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMoveToPeriod('afternoon')}>
              <MoveHorizontal className="h-3.5 w-3.5 mr-2" />移到下午
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMoveToPeriod('evening')}>
              <MoveHorizontal className="h-3.5 w-3.5 mr-2" />移到晚上
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ---------- Drag Overlay Wrapper ----------

function DragOverlayWrapper({ children }: { children: React.ReactNode }) {
  return <DragOverlay dropAnimation={null}>{children}</DragOverlay>
}

// ---------- Quick Add Dialog ----------

function QuickAddDialog({
  open,
  onOpenChange,
  period,
  tagList,
  onSubmit,
  isDesktop,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: Period
  tagList: { id: string; name: string; color: string }[]
  onSubmit: (data: { title: string; priority?: string; tag_id?: string }) => void
  isDesktop: boolean
}) {
  const form = useForm({
    defaultValues: { title: '', priority: 'normal', tag_id: 'none' },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = form.getValues()
    if (!data.title.trim()) return
    onSubmit({
      title: data.title,
      priority: data.priority,
      tag_id: data.tag_id === 'none' ? undefined : data.tag_id,
    })
    form.reset()
  }

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="qt-title">事项标题</Label>
        <Input
          id="qt-title"
          placeholder="快速添加事项..."
          autoFocus
          {...form.register('title')}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="qt-priority">难度</Label>
          <Select
            defaultValue="medium"
            onValueChange={(v: string | null) => v && form.setValue('priority', v)}
          >
            <SelectTrigger id="qt-priority">
              <SelectValue>
                {{ low: '简单', normal: '普通', high: '高', urgent: '紧急', medium: '一般' }[form.watch('priority') || 'medium'] || '一般'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">简单</SelectItem>
              <SelectItem value="medium">一般</SelectItem>
              <SelectItem value="high">困难</SelectItem>
              <SelectItem value="urgent">极难</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="qt-tag">标签</Label>
          <Select
            defaultValue="none"
            onValueChange={(v: string | null) => v && form.setValue('tag_id', v)}
          >
            <SelectTrigger id="qt-tag">
              <SelectValue placeholder="未分类">
                {form.watch('tag_id') && form.watch('tag_id') !== 'none'
                  ? (tagList.find((t) => t.id === form.watch('tag_id'))?.name || '未分类')
                  : '未分类'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无标签</SelectItem>
              {tagList.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full">
        添加 {PERIOD_LABELS[period]} 事项
      </Button>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>快速添加 — {PERIOD_LABELS[period]}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>快速添加 — {PERIOD_LABELS[period]}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  )
}
