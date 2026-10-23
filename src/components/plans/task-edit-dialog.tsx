'use client'

import { useEffect, type ReactNode } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { todayStr } from '@/lib/utils/date'
import type { Task, Period } from '@/types'
import { useRepos } from '@/providers/repo-provider'
import { useAuth } from '@/providers/auth-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMediaQuery } from '@/hooks/use-media-query'
import { RecurrenceEditor } from './recurrence-editor'
import { toast } from 'sonner'
import { Bell, Repeat } from 'lucide-react'

const taskFormSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  task_date: z.string().min(1),
  period: z.enum(['morning', 'afternoon', 'evening']),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  tag_id: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']),
  estimated_minutes: z.string().optional(),
  reminder_at: z.string().optional(),
  recurrence_rule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'weekdays']),
      interval: z.number(),
      byWeekday: z.array(z.number()).optional(),
      byMonthDay: z.number().optional(),
      bySetPos: z.number().optional(),
      endDate: z.string().optional(),
      count: z.number().optional(),
    })
    .nullable()
    .optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskEditDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  defaultPeriod?: Period
  defaultTagId?: string
}

/** 表单字段：label（text-caption）+ 控件 + 错误/提示（text-micro），统一 8/12 节奏 */
function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-caption text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-micro text-destructive">{error}</p>}
      {hint && <p className="text-micro text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  defaultDate,
  defaultPeriod,
  defaultTagId,
}: TaskEditDialogProps) {
  const { user } = useAuth()
  const { tasks, tags } = useRepos()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.getAll(user!.id),
    enabled: !!user,
  })

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      task_date: defaultDate || todayStr(),
      period: defaultPeriod || 'morning',
      priority: 'normal',
      status: 'todo',
      tag_id: 'none',
      reminder_at: '',
      recurrence_rule: null,
    },
  })

  // When editing existing task, populate form
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        task_date: task.task_date || defaultDate || todayStr(),
        period: task.period,
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        tag_id: task.tag_id || 'none',
        priority: task.priority,
        status: task.status,
        estimated_minutes: task.estimated_minutes?.toString(),
        reminder_at: task.reminder_at || '',
        recurrence_rule: task.recurrence_rule ?? null,
      })
    } else {
      form.reset({
        title: '',
        description: '',
        task_date: defaultDate || todayStr(),
        period: defaultPeriod || 'morning',
        priority: 'normal',
        status: 'todo',
        tag_id: defaultTagId || 'none',
        reminder_at: '',
        recurrence_rule: null,
      })
    }
  }, [task, defaultDate, defaultPeriod, defaultTagId, form])

  const handleSubmit = async (data: TaskFormValues) => {
    if (!user) return

    const taskData = {
      title: data.title,
      description: data.description || undefined,
      task_date: data.task_date,
      period: data.period,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      tag_id: data.tag_id === 'none' ? undefined : data.tag_id,
      priority: data.priority,
      status: data.status,
      estimated_minutes: data.estimated_minutes ? parseInt(data.estimated_minutes, 10) : undefined,
      reminder_at: data.reminder_at || undefined,
      recurrence_rule: data.recurrence_rule ?? null,
      order_index: task?.order_index ?? 0,
    }

    try {
      if (task) {
        await tasks.update(user.id, task.id, taskData)
        toast.success('事项已更新')
      } else {
        await tasks.create(user.id, taskData as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
        toast.success('事项已创建')
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      onOpenChange(false)
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  const isEditing = !!task

  // 用 useWatch 而不是 form.watch，避免触发 React Compiler 的不兼容库警告
  const taskDate = useWatch({ control: form.control, name: 'task_date' })

  const formContent = (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* 标题 / 描述 */}
      <div className="space-y-3">
        <Field
          label={
            <>
              标题<span className="text-destructive"> *</span>
            </>
          }
          htmlFor="title"
          error={form.formState.errors.title?.message}
        >
          <Input
            id="title"
            {...form.register('title')}
            placeholder="事项标题"
            autoFocus
            aria-invalid={!!form.formState.errors.title}
          />
        </Field>

        <Field label="详细说明" htmlFor="desc">
          <Textarea
            id="desc"
            {...form.register('description')}
            placeholder="可选：详细描述"
            rows={2}
            className="rounded-md"
          />
        </Field>
      </div>

      {/* 日期 / 时段 */}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <Field label="日期">
          <Input type="date" {...form.register('task_date')} />
        </Field>
        <Field label="时段">
          <Controller
            name="period"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full rounded-md">
                  <SelectValue>
                    {{ morning: '上午', afternoon: '下午', evening: '晚上' }[field.value as string] || field.value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">上午</SelectItem>
                  <SelectItem value="afternoon">下午</SelectItem>
                  <SelectItem value="evening">晚上</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {/* 标签 / 难度 */}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <Field label="标签">
          <Controller
            name="tag_id"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || 'none'} onValueChange={field.onChange}>
                <SelectTrigger className="w-full rounded-md">
                  <SelectValue placeholder="未分类">
                    {field.value && field.value !== 'none'
                      ? (tagList.find((t) => t.id === field.value)?.name || '未分类')
                      : '未分类'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分类</SelectItem>
                  {tagList.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="难度">
          <Controller
            name="priority"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full rounded-md">
                  <SelectValue>
                    {{ low: '简单', normal: '一般', high: '困难', urgent: '极难' }[field.value as string] || '一般'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">简单</SelectItem>
                  <SelectItem value="normal">一般</SelectItem>
                  <SelectItem value="high">困难</SelectItem>
                  <SelectItem value="urgent">极难</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {/* 时间 / 提醒 */}
      <div className="space-y-3 border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="开始时间">
            <Input type="time" {...form.register('start_time')} />
          </Field>
          <Field label="结束时间">
            <Input type="time" {...form.register('end_time')} />
          </Field>
        </div>

        <Field
          label={
            <span className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              提醒时间
            </span>
          }
          hint="设置提醒时间，届时会通过浏览器通知提醒你"
        >
          <Input type="datetime-local" {...form.register('reminder_at')} />
        </Field>
      </div>

      {/* 重复 */}
      <div className="space-y-2 border-t border-border pt-3">
        <Field
          label={
            <span className="flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
              重复
            </span>
          }
          hint="完成这一项时会自动生成下一次；重复规则保存在这个系列上"
        >
          <Controller
            name="recurrence_rule"
            control={form.control}
            render={({ field }) => (
              <RecurrenceEditor
                value={field.value ?? null}
                onChange={(rule) => field.onChange(rule)}
                baseDate={taskDate}
              />
            )}
          />
        </Field>
      </div>

      {isEditing && (
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <Field label="状态">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue>
                      {{ todo: '待办', in_progress: '进行中', done: '已完成', cancelled: '已取消' }[field.value as string] || field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">待办</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="done">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="预计用时（分钟）">
            <Input
              type="text"
              inputMode="numeric"
              {...form.register('estimated_minutes')}
              placeholder="30"
            />
          </Field>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          取消
        </Button>
        <Button type="submit">
          {isEditing ? '保存修改' : '创建事项'}
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto shadow-[var(--shadow-pop)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-section">
              {isEditing ? '编辑事项' : '新建事项'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto shadow-[var(--shadow-pop)]">
        <DrawerHeader>
          <DrawerTitle className="text-section">
            {isEditing ? '编辑事项' : '新建事项'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{formContent}</div>
      </DrawerContent>
    </Drawer>
  )
}
