'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  X,
  Filter,
  Calendar,
  AlertCircle,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import type { TaskFilterOptions } from '@/lib/repositories/interfaces'
import { formatDisplayDate, todayStr } from '@/lib/utils/date'
import { PERIOD_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants'
import { PERIOD_CLASS } from '@/lib/period-style'

interface SearchFilterProps {
  onSelectTask?: (task: Task) => void
  compact?: boolean
}
/** 已选筛选项胶囊：点击移除 */
function FilterPill({
  label,
  tone = 'default',
  onRemove,
}: {
  label: ReactNode
  tone?: 'default' | 'danger'
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-micro ui-transition',
        tone === 'danger'
          ? 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15'
          : 'acg-pill'
      )}
    >
      {label}
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  )
}

/** 筛选开关胶囊：选中 acg-pill */
function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-caption ui-transition',
        active
          ? 'acg-pill font-semibold'
          : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

export function SearchFilter({ onSelectTask, compact = false }: SearchFilterProps) {
  const { user } = useAuth()
  const { tasks, tags } = useRepos()
  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterOptions, setFilterOptions] = useState<Omit<TaskFilterOptions, 'search'>>({})

  const { data: tagList = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tags.getAll(user!.id),
    enabled: !!user,
  })

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'filter', searchText, filterOptions],
    queryFn: () =>
      tasks.filter(user!.id, {
        search: searchText || undefined,
        ...filterOptions,
        maxResults: 50,
      }),
    enabled: !!user && (!!searchText || Object.keys(filterOptions).length > 0),
  })

  const clearAll = useCallback(() => {
    setSearchText('')
    setFilterOptions({})
    setShowFilters(false)
  }, [])

  const hasActiveFilters = searchText || Object.keys(filterOptions).length > 0

  const overdueTasks = results.filter(
    (t) => t.task_date && t.task_date < todayStr() && t.status !== 'done' && t.status !== 'cancelled'
  )

  if (!user) return null

  return (
    <div className={cn('space-y-4', compact && 'space-y-2')}>
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="搜索事项标题或描述…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8 pr-9"
            aria-label="搜索事项"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearchText('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="清空搜索"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
        <Button
          variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
          size="icon"
          className="shrink-0"
          onClick={() => setShowFilters(!showFilters)}
          aria-label={showFilters ? '收起筛选' : '展开筛选'}
          aria-expanded={showFilters}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Filter chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.status?.map((s: string) => (
            <FilterPill
              key={s}
              label={STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              onRemove={() =>
                setFilterOptions((prev) => ({
                  ...prev,
                  status: prev.status?.filter((x: string) => x !== s),
                }))
              }
            />
          ))}
          {filterOptions.priority?.map((p: string) => (
            <FilterPill
              key={p}
              label={PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS]}
              onRemove={() =>
                setFilterOptions((prev) => ({
                  ...prev,
                  priority: prev.priority?.filter((x: string) => x !== p),
                }))
              }
            />
          ))}
          {filterOptions.overdue && (
            <FilterPill
              tone="danger"
              label="已过期"
              onRemove={() => setFilterOptions((prev) => ({ ...prev, overdue: false }))}
            />
          )}
          {filterOptions.hasRecurrence && (
            <FilterPill
              label="重复"
              onRemove={() => setFilterOptions((prev) => ({ ...prev, hasRecurrence: false }))}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-caption text-muted-foreground"
            onClick={clearAll}
          >
            清除全部
          </Button>
        </div>
      )}

      {/* Expanded filters */}
      {showFilters && (
        <Card>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">状态</label>
                <Select
                  value={filterOptions.status?.[0] || 'all'}
                  onValueChange={(v) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      // 「全部」不是一个真实状态值，必须清空筛选而不是传 'all'
                      status: v && v !== 'all' ? [v] : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="todo">未开始</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="done">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">优先级</label>
                <Select
                  value={filterOptions.priority?.[0] || 'all'}
                  onValueChange={(v) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      priority: v && v !== 'all' ? [v] : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">标签</label>
                <Select
                  value={filterOptions.tagIds?.[0] || 'all'}
                  onValueChange={(v) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      tagIds: v && v !== 'all' ? [v] : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {tagList.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-caption text-muted-foreground">日期范围</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filterOptions.dateFrom || ''}
                    onChange={(e) =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        dateFrom: e.target.value || undefined,
                      }))
                    }
                    className="tabular-nums"
                    aria-label="开始日期"
                  />
                  <Input
                    type="date"
                    value={filterOptions.dateTo || ''}
                    onChange={(e) =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        dateTo: e.target.value || undefined,
                      }))
                    }
                    className="tabular-nums"
                    aria-label="结束日期"
                  />
                </div>
              </div>
            </div>

            {/* Toggle pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <TogglePill
                active={!!filterOptions.overdue}
                onClick={() =>
                  setFilterOptions((prev) => ({ ...prev, overdue: !prev.overdue }))
                }
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                已过期
              </TogglePill>
              <TogglePill
                active={!!filterOptions.hasRecurrence}
                onClick={() =>
                  setFilterOptions((prev) => ({
                    ...prev,
                    hasRecurrence: !prev.hasRecurrence,
                  }))
                }
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                重复
              </TogglePill>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-caption" onClick={clearAll}>
                清除全部筛选
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-caption tabular-nums text-muted-foreground">
            {results.length} 条结果
            {overdueTasks.length > 0 && (
              <span className="ml-2 text-destructive">
                {overdueTasks.length} 项已过期
              </span>
            )}
          </p>
          {results.map((task) => {
            const isOverdue =
              !!task.task_date &&
              task.task_date < todayStr() &&
              task.status !== 'done' &&
              task.status !== 'cancelled'

            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'surface-interactive cursor-pointer rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)]',
                  isOverdue && 'border-destructive/40'
                )}
                onClick={() => onSelectTask?.(task)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectTask?.(task)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {task.tag && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: task.tag.color }}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={cn(
                          'truncate text-body font-medium',
                          task.status === 'done' && 'text-muted-foreground line-through'
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {task.task_date ? formatDisplayDate(task.task_date) : '未安排日期'}
                      </span>
                      <span
                        className={cn(
                          'period-chip rounded-full px-2 py-0.5 text-micro',
                          PERIOD_CLASS[task.period]
                        )}
                      >
                        {PERIOD_LABELS[task.period]}
                      </span>
                      {task.status !== 'done' && task.status !== 'cancelled' && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-micro text-secondary-foreground">
                          {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-1 truncate text-caption text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {isOverdue && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-micro text-destructive">
                      <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
                      过期
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : hasActiveFilters ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Inbox className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-body text-muted-foreground">没有匹配的事项</p>
          <p className="text-caption text-muted-foreground/80">换个关键词或放宽筛选条件</p>
          <Button variant="ghost" size="sm" className="text-caption" onClick={clearAll}>
            清除筛选
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Search className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-body text-muted-foreground">开始搜索事项</p>
          <p className="text-caption text-muted-foreground/80">输入关键词或添加筛选条件</p>
        </div>
      )}
    </div>
  )
}
