'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { groupTasksByTag } from '@/lib/utils/task-grouping'
import { TIME_BUCKET_LABELS, TIME_BUCKET_ORDER } from '@/lib/utils/task-grouping'
import { CategoryTaskCard } from './category-task-card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { getMonthRange, todayStr } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FolderOpen,
} from 'lucide-react'

interface CategoryViewProps {
  onEditTask: (task: Task) => void
  onNewTask: (defaultTagId?: string) => void
}

export function CategoryView({ onEditTask, onNewTask }: CategoryViewProps) {
  const { user } = useAuth()
  const { tasks: taskRepo, tags: tagRepo } = useRepos()
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [collapsedDone, setCollapsedDone] = useState<Set<string>>(new Set())
  const [hideEmpty, setHideEmpty] = useState(true)
  const [hideDoneTasks, setHideDoneTasks] = useState(false)

  const range = useMemo(() => getMonthRange(todayStr()), [])

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'month', range.start, range.end],
    queryFn: () => taskRepo.getByDateRange(user!.id, range),
    enabled: !!user,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  const groups = useMemo(() => {
    return groupTasksByTag(tasks, tags, { hideEmpty, hideCancelled: true })
  }, [tasks, tags, hideEmpty])

  const toggleCategory = useCallback((tagId: string | null) => {
    const key = tagId ?? '__uncategorized__'
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleDone = useCallback((tagId: string | null) => {
    const key = tagId ?? '__uncategorized__'
    setCollapsedDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleNewInCategory = useCallback(
    (tagId?: string | null) => {
      onNewTask(tagId ?? undefined)
    },
    [onNewTask]
  )

  if (tasksLoading) {
    return (
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
        <p className="text-body text-muted-foreground">还没有事项</p>
        <p className="text-caption text-muted-foreground/70">
          按分类整理你的计划，创建第一条事项开始记录
        </p>
        <Button size="sm" className="mt-1" onClick={() => onNewTask()}>
          <Plus className="h-4 w-4" />
          新建事项
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="hide-empty"
            checked={hideEmpty}
            onCheckedChange={setHideEmpty}
          />
          <Label htmlFor="hide-empty" className="text-caption">
            隐藏空分类
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="hide-done"
            checked={hideDoneTasks}
            onCheckedChange={setHideDoneTasks}
          />
          <Label htmlFor="hide-done" className="text-caption">
            隐藏已完成
          </Label>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {groups.map((group) => {
          const catKey = group.tagId ?? '__uncategorized__'
          const isCollapsed = collapsedCategories.has(catKey)
          const isDoneCollapsed = collapsedDone.has(catKey)

          return (
            <div
              key={catKey}
              className="surface overflow-hidden"
            >
              {/* Category header：色点 + 名称 + 数量 */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5',
                  !isCollapsed && 'border-b border-border'
                )}
              >
                <button
                  onClick={() => toggleCategory(group.tagId)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-left text-foreground ui-transition hover:text-primary"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: group.tagColor }}
                  />
                  <span className="min-w-0 truncate text-body font-medium">
                    {group.tagName}
                  </span>
                  <span className="shrink-0 text-micro tabular-nums text-muted-foreground">
                    {group.done}/{group.total}
                  </span>
                  {/* Mini progress bar */}
                  {group.total > 0 && (
                    <span className="ml-1 h-1 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-success transition-all"
                        style={{ width: `${Math.round(group.completionRate * 100)}%` }}
                      />
                    </span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleNewInCategory(group.tagId)}
                  aria-label={`在「${group.tagName}」中新建事项`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Category body */}
              {!isCollapsed && (
                <div className="divide-y divide-border/60 bg-surface-2/50">
                  {TIME_BUCKET_ORDER.map((bucket) => {
                    const bucketTasks = group.buckets[bucket]
                    if (bucketTasks.length === 0) return null
                    if (bucket === 'done' && hideDoneTasks) return null

                    const displayTasks =
                      bucket === 'done' && isDoneCollapsed ? [] : bucketTasks

                    return (
                      <div key={bucket} className="px-3 py-2">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-caption font-medium text-muted-foreground">
                            {TIME_BUCKET_LABELS[bucket]}
                            <span className="ml-1 text-micro tabular-nums text-muted-foreground/70">
                              ({bucketTasks.length})
                            </span>
                          </span>
                          {bucket === 'done' && bucketTasks.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-caption"
                              onClick={() => toggleDone(group.tagId)}
                            >
                              {isDoneCollapsed ? '展开' : '收起'}
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {displayTasks.map((task) => (
                            <CategoryTaskCard
                              key={task.id}
                              task={{ ...task, tag: tags.find((t) => t.id === task.tag_id) }}
                              onClick={onEditTask}
                              showMoveMenu
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
