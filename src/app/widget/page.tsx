'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToday } from '@/hooks/use-today'
import { useCrossWindowSync } from '@/hooks/use-cross-window-sync'
import { format, parseISO, formatWeekday } from '@/lib/utils/date'
import { defaultPeriodByTime } from '@/lib/utils/period'
import { getDesktopBridge } from '@/lib/desktop-bridge'
import { notifyDataChanged } from '@/lib/widget-sync'
import { setTaskCompletion } from '@/lib/tasks/task-completion'
import { PERIOD_LABELS } from '@/lib/constants'
import { HomeFocusTimer } from '@/components/focus/focus-timer'
import { WidgetTaskForm, type WidgetTaskDraft } from '@/components/widget/widget-task-form'
import { cn } from '@/lib/utils'
import {
  Check,
  ListTodo,
  Loader2,
  Maximize2,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import type { Task } from '@/types'
import { PERIOD_CLASS, PERIOD_ORDER } from '@/lib/period-style'

function MiniProgress({ rate, size = 28 }: { rate: number; size?: number }) {
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, rate)))}
        className="text-primary transition-[stroke-dashoffset] duration-[var(--motion-slow)]"
      />
    </svg>
  )
}

export default function WidgetPage() {
  const { user } = useAuth()
  const repos = useRepos()
  const { tasks: taskRepo, tags: tagRepo } = repos
  const queryClient = useQueryClient()
  const today = useToday()
  const bridge = getDesktopBridge()

  const [tab, setTab] = useState<'list' | 'focus'>('list')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [pinned, setPinned] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; task?: Task } | null>(null)
  const [savingForm, setSavingForm] = useState(false)

  useCrossWindowSync()

  useEffect(() => {
    document.documentElement.classList.add('widget-window')
    return () => document.documentElement.classList.remove('widget-window')
  }, [])

  useEffect(() => {
    if (!bridge) return
    bridge.isPinned().then(setPinned).catch(() => {})
  }, [bridge])

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'widget', today],
    queryFn: () => taskRepo.getByDate(user!.id, today),
    enabled: !!user,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'cancelled'), [tasks])
  const doneCount = activeTasks.filter((t) => t.status === 'done').length
  const totalCount = activeTasks.length
  const rate = totalCount > 0 ? doneCount / totalCount : 0

  const grouped = useMemo(
    () =>
      PERIOD_ORDER.map((period) => ({
        period,
        tasks: activeTasks
          .filter((t) => t.period === period)
          .sort(
            (a, b) =>
              Number(a.status === 'done') - Number(b.status === 'done') || a.order_index - b.order_index
          ),
      })).filter((group) => group.tasks.length > 0),
    [activeTasks]
  )

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
    notifyDataChanged('tasks')
  }, [queryClient, user?.id])

  const handleToggle = useCallback(
    async (task: Task) => {
      if (!user || busyId) return
      setBusyId(task.id)
      try {
        await setTaskCompletion(repos, user.id, task, task.status !== 'done')
        refresh()
      } catch {
        /* 等下一次刷新纠正 */
      } finally {
        setBusyId(null)
      }
    },
    [user, busyId, repos, refresh]
  )

  /** 快速添加：只填标题，时段按当前时间推断 */
  const handleQuickAdd = useCallback(async () => {
    const title = draft.trim()
    if (!title || !user || saving) return
    setSaving(true)
    try {
      await taskRepo.create(user.id, {
        title,
        task_date: today,
        period: defaultPeriodByTime(),
        priority: 'normal',
        status: 'todo',
        order_index: 0,
      } as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      setDraft('')
      refresh()
    } catch {
      /* 保留输入内容 */
    } finally {
      setSaving(false)
    }
  }, [draft, user, saving, taskRepo, today, refresh])

  const handleSaveForm = useCallback(
    async (values: WidgetTaskDraft) => {
      if (!user || savingForm) return
      setSavingForm(true)
      try {
        const payload = {
          title: values.title,
          period: values.period,
          tag_id: values.tag_id || undefined,
          start_time: values.start_time || undefined,
          end_time: values.end_time || undefined,
        }
        if (form?.mode === 'edit' && form.task) {
          await taskRepo.update(user.id, form.task.id, payload as Partial<Task>)
        } else {
          await taskRepo.create(user.id, {
            ...payload,
            task_date: today,
            priority: 'normal',
            status: 'todo',
            order_index: 0,
          } as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
        }
        refresh()
        setForm(null)
      } catch {
        /* 失败时保留表单内容 */
      } finally {
        setSavingForm(false)
      }
    },
    [user, savingForm, form, taskRepo, today, refresh]
  )

  const handleDeleteForm = useCallback(async () => {
    if (!user || !form?.task) return
    await taskRepo.softDelete(user.id, form.task.id).catch(() => null)
    refresh()
    setForm(null)
  }, [user, form, taskRepo, refresh])

  const tagColor = useCallback((tagId?: string) => tags.find((t) => t.id === tagId)?.color, [tags])
  const tagName = useCallback((tagId?: string) => tags.find((t) => t.id === tagId)?.name, [tags])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-card text-caption text-muted-foreground">
        加载中…
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-card">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-card ring-1 ring-inset ring-border">
        {/* 标题栏（可拖拽） */}
        <header className="app-drag flex h-11 shrink-0 items-center gap-2 border-b border-border bg-surface-2/50 px-3 select-none">
          <span className="shrink-0 text-section">时栖</span>
          <span className="min-w-0 flex-1 truncate text-micro text-muted-foreground tabular-nums">
            {format(parseISO(today), 'M月d日')} {formatWeekday(today)}
          </span>
          <div className="app-no-drag flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              title={pinned ? '取消置顶' : '置顶'}
              aria-label={pinned ? '取消置顶' : '置顶'}
              onClick={async () => {
                if (!bridge) return
                setPinned(await bridge.togglePin())
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground ui-transition hover:bg-accent hover:text-foreground',
                pinned && 'text-primary'
              )}
            >
              {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              title="打开主窗口"
              aria-label="打开主窗口"
              onClick={() => bridge?.openMain()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="关闭浮窗"
              aria-label="关闭浮窗"
              onClick={() => bridge?.hideWidget()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground ui-transition hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* 标签页 */}
        <div className="grid shrink-0 grid-cols-2 gap-1 px-3 pt-3">
          {(
            [
              { key: 'list', label: '清单', icon: ListTodo },
              { key: 'focus', label: '专注', icon: Sparkles },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              data-testid={`widget-tab-${item.key}`}
              onClick={() => setTab(item.key)}
              className={`flex h-8 items-center justify-center gap-1 rounded-md text-caption ui-transition ${
                tab === item.key
                  ? 'bg-primary font-medium text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'focus' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <HomeFocusTimer variant="widget" />
          </div>
        ) : (
          <>
            {/* 今日进度 */}
            <div className="flex shrink-0 items-center gap-2.5 px-3 pt-3 pb-2">
              <MiniProgress rate={rate} />
              <div className="min-w-0 flex-1">
                <p className="text-caption text-muted-foreground">
                  今日完成{' '}
                  <span className="font-medium text-foreground tabular-nums">{doneCount}</span>
                  <span className="tabular-nums"> / {totalCount}</span>
                </p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary ui-transition"
                    style={{ width: `${Math.round(rate * 100)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-micro text-muted-foreground tabular-nums">
                {Math.round(rate * 100)}%
              </span>
            </div>

            {/* 快速添加 + 详细新建 */}
            <div className="flex shrink-0 items-center gap-1.5 px-3 pb-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleQuickAdd()
                }}
                className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-md border border-input bg-background pr-2 pl-0.5 ui-transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35 dark:bg-input/25"
              >
                <button
                  type="submit"
                  data-testid="widget-quick-add"
                  aria-label="添加事项"
                  disabled={!draft.trim() || saving}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-primary ui-transition hover:bg-accent disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
                <input
                  data-testid="widget-add-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="加一件今天的事，回车即可"
                  className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-muted-foreground/80"
                />
              </form>
              <button
                type="button"
                data-testid="widget-add-detail"
                onClick={() => setForm({ mode: 'create' })}
                title="新建事项（可选时段、标签、时间）"
                aria-label="新建事项"
                className="flex h-9 shrink-0 items-center gap-0.5 rounded-md border border-border px-2 text-caption text-foreground ui-transition hover:border-border-strong hover:bg-accent"
              >
                <Plus className="h-3 w-3" />
                新建
              </button>
            </div>

            {/* 今日清单 */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
              {isLoading ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-7 animate-pulse rounded-md bg-muted/80" />
                  ))}
                </div>
              ) : grouped.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground/60" />
                  <div className="space-y-0.5">
                    <p className="text-body text-foreground">今天还是空白页</p>
                    <p className="text-caption text-muted-foreground">写下一件小事，就从它开始</p>
                  </div>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.period} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-0.5">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full period-dot',
                          PERIOD_CLASS[group.period]
                        )}
                      />
                      <span className="text-micro font-medium text-muted-foreground">
                        {PERIOD_LABELS[group.period]}
                      </span>
                      <span className="text-micro text-muted-foreground/70 tabular-nums">
                        {group.tasks.length}
                      </span>
                    </div>
                    <div className={cn('period-rail space-y-0.5 pl-2', PERIOD_CLASS[group.period])}>
                      {group.tasks.map((task) => {
                        const isDone = task.status === 'done'
                        const color = tagColor(task.tag_id)
                        const name = tagName(task.tag_id)
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'group/row flex items-start gap-1 rounded-md px-1 py-1 ui-transition',
                              isDone ? 'opacity-60' : 'hover:bg-accent/70'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggle(task)}
                              disabled={busyId === task.id}
                              aria-label={isDone ? '标记为未完成' : '标记为完成'}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full disabled:cursor-default"
                            >
                              <span
                                className={cn(
                                  'flex h-4 w-4 items-center justify-center rounded-full border ui-transition',
                                  isDone
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/40 group-hover/row:border-primary'
                                )}
                              >
                                {isDone && <Check className="h-2.5 w-2.5" />}
                              </span>
                            </button>
                            {/* 点标题进编辑 */}
                            <button
                              type="button"
                              data-testid="widget-task-row"
                              onClick={() => setForm({ mode: 'edit', task })}
                              title="点击编辑"
                              className="min-w-0 flex-1 text-left"
                            >
                              <span
                                title={task.title}
                                className={`block truncate text-caption leading-5 ${
                                  isDone ? 'text-muted-foreground line-through' : ''
                                }`}
                              >
                                {task.title}
                              </span>
                              {(name || task.start_time) && (
                                <span className="mt-0.5 flex min-w-0 items-center gap-1 text-micro text-muted-foreground">
                                  {color && (
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                  )}
                                  {name && <span className="truncate">{name}</span>}
                                  {task.start_time && (
                                    <span className="shrink-0 tabular-nums">{task.start_time}</span>
                                  )}
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* 底部 */}
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-surface-2/50 px-3 py-2">
          <span className="min-w-0 truncate text-micro text-muted-foreground">
            {totalCount === 0
              ? '空的一天'
              : doneCount === totalCount
                ? '今天全部完成 🎉'
                : `还有 ${totalCount - doneCount} 项`}
          </span>
          <button
            type="button"
            onClick={() => bridge?.openMain()}
            className="shrink-0 text-caption font-medium text-foreground ui-transition hover:text-primary hover:underline"
          >
            打开主窗口
          </button>
        </footer>

        {/* 新建 / 编辑面板 */}
        {form && (
          <WidgetTaskForm
            mode={form.mode}
            tags={tags}
            saving={savingForm}
            isDone={form.task?.status === 'done'}
            initial={
              form.task
                ? {
                    title: form.task.title,
                    period: form.task.period,
                    tag_id: form.task.tag_id ?? '',
                    start_time: form.task.start_time ?? '',
                    end_time: form.task.end_time ?? '',
                  }
                : undefined
            }
            onCancel={() => setForm(null)}
            onSave={handleSaveForm}
            onDelete={form.mode === 'edit' ? handleDeleteForm : undefined}
            onToggleDone={
              form.mode === 'edit' && form.task
                ? () => {
                    const task = form.task
                    if (!task) return
                    handleToggle(task)
                    setForm(null)
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
