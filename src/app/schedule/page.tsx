'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery } from '@tanstack/react-query'
import { ScheduleHeader } from '@/components/schedule/schedule-header'
import { ThemeHero } from '@/components/atmosphere/hero-banner'
import { QuickAddTask } from '@/components/schedule/quick-add-task'
import { ScheduleViewSwitcher } from '@/components/schedule/schedule-view-switcher'
import type { ScheduleView } from '@/components/schedule/schedule-view-switcher'
import { TodayFocus } from '@/components/schedule/today-focus'
import { TimePeriodSection } from '@/components/schedule/time-period-section'
import { OverdueSection } from '@/components/schedule/overdue-section'
import { UpcomingTasks } from '@/components/schedule/upcoming-tasks'
import { InboxSection } from '@/components/schedule/inbox-section'
import { ScheduleEmptyState } from '@/components/schedule/schedule-empty-state'
import { TaskDetailPanel } from '@/components/schedule/task-detail-panel'
import { TaskListItem } from '@/components/schedule/task-list-item'
import { HomeFocusTimer } from '@/components/focus/focus-timer'
import { HomeCountdowns } from '@/components/countdowns/home-countdowns'
import { HomeHabitsSummary } from '@/components/habits/home-habits-summary'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SearchSheet } from '@/components/search/search-sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useToday } from '@/hooks/use-today'
import { addDays, format, parseISO, toDateStr } from '@/lib/utils/date'
import { groupTasksByTag } from '@/lib/utils/task-grouping'
import type { Task, Period } from '@/types'
import { FolderOpen, Search, TagIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PERIOD_ORDER } from '@/lib/period-style'
/** Generate the next 7 days (today + 6) as date strings */
function getWeekDateRange(today: string): { dates: string[]; end: string } {
  const dates: string[] = []
  const todayDate = parseISO(today)
  for (let i = 0; i < 7; i++) {
    const d = addDays(todayDate, i)
    dates.push(format(d, 'yyyy-MM-dd'))
  }
  return { dates, end: dates[6] }
}

/** Format a date string for display in week groups */
function formatWeekDateLabel(dateStr: string, today: string): string {
  const d = parseISO(dateStr)
  const monthDay = format(d, 'M月d日')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[parseInt(format(d, 'i')) % 7]

  if (dateStr === today) return `今天 · ${monthDay} ${weekday}`
  const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd')
  if (dateStr === tomorrow) return `明天 · ${monthDay} ${weekday}`
  return `${monthDay} ${weekday}`
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { tasks: taskRepo, tags: tagRepo } = useRepos()
  const [view, setView] = useState<ScheduleView>('today')
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('none')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const today = useToday()

  // Ctrl/Cmd+K 打开搜索面板
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Load today + broader range for overdue/upcoming
  const range = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 30) // 30 days back for overdue
    const end = new Date()
    end.setDate(end.getDate() + 60) // 60 days forward
    return {
      start: toDateStr(start),
      end: toDateStr(end),
    }
  }, [])

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, 'schedule', range.start, range.end],
    queryFn: () =>
      taskRepo.filter(user!.id, {
        dateFrom: range.start,
        dateTo: range.end,
        includeUndated: true,
        maxResults: 500,
      }),
    enabled: !!user,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: () => tagRepo.getAll(user!.id),
    enabled: !!user,
  })

  // Pre-compute the week date range
  const weekRange = useMemo(() => getWeekDateRange(today), [today])

  // Derived task groups
  const todayTasks = useMemo(
    () => allTasks.filter((t) => t.task_date === today && t.status !== 'cancelled'),
    [allTasks, today]
  )

  const overdueTasks = useMemo(
    () =>
      allTasks.filter(
        (t) => t.task_date && t.task_date < today && t.status !== 'done' && t.status !== 'cancelled'
      ),
    [allTasks, today]
  )

  const undatedTasks = useMemo(
    () => allTasks.filter((t) => !t.task_date && t.status !== 'cancelled'),
    [allTasks]
  )

  // Week view tasks: today through today+6, not cancelled
  const weekTasks = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.task_date &&
          t.task_date >= today &&
          t.task_date <= weekRange.end &&
          t.status !== 'cancelled'
      ),
    [allTasks, today, weekRange.end]
  )

  // Week tasks grouped by date
  const weekDateGroups = useMemo(() => {
    const groups: { date: string; label: string; tasks: Task[] }[] = []
    for (const date of weekRange.dates) {
      const dateTasks = weekTasks.filter((t) => t.task_date === date)
      if (dateTasks.length > 0) {
        groups.push({
          date,
          label: formatWeekDateLabel(date, today),
          tasks: dateTasks,
        })
      }
    }
    return groups
  }, [weekTasks, weekRange.dates, today])

  const periodGroups = useMemo(() => {
    const groups: Record<Period, Task[]> = { morning: [], afternoon: [], evening: [] }
    for (const task of todayTasks) {
      groups[task.period]?.push(task)
    }
    return groups
  }, [todayTasks])

  const activeTask = useMemo(
    () => allTasks.find((t) => t.id === activeTaskId) || null,
    [allTasks, activeTaskId]
  )

  const handleTaskClick = useCallback((task: Task) => {
    setActiveTaskId(task.id)
  }, [])

  const handleClosePanel = useCallback(() => {
    setActiveTaskId(null)
  }, [])

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const showDetailPanel = !!activeTaskId

  // Get time-range-filtered tasks for category grouping overlay
  const timeFilteredTasks = useMemo(() => {
    switch (view) {
      case 'today':
        return [...todayTasks, ...overdueTasks]
      case 'week':
        return [...overdueTasks, ...weekTasks]
      case 'all':
      default:
        return allTasks.filter((t) => t.status !== 'cancelled')
    }
  }, [view, todayTasks, overdueTasks, weekTasks, allTasks])

  // Category groups from time-filtered tasks
  const categoryGroups = useMemo(() => {
    if (groupBy !== 'category') return null
    return groupTasksByTag(timeFilteredTasks, tags, { hideCancelled: true, hideEmpty: true })
  }, [groupBy, timeFilteredTasks, tags])

  if (!user) return null

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
            {/* 主题主视觉：场景 + 角色 + 每日一句（纯净模式下自动隐藏） */}
            <ThemeHero />

            {/* 今日概览卡：日期 + 完成进度 + 专注时长 */}
            <ScheduleHeader today={today} tasks={allTasks} />

            {/* Quick add */}
            <QuickAddTask />

            {/* View controls: time range + category grouping */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ScheduleViewSwitcher
                view={view}
                onViewChange={(v) => {
                  setView(v)
                  // Reset search and groupBy when switching to 'all'
                  if (v === 'all') {
                    setSearchQuery('')
                    setGroupBy('none')
                  }
                }}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-caption"
                onClick={() => setSearchOpen(true)}
                data-testid="open-search"
                title="搜索事项（Ctrl+K）"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                搜索
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {/* === TODAY VIEW === */}
                {view === 'today' && groupBy === 'none' && (
                  <div className="space-y-4">
                    {todayTasks.length === 0 &&
                    overdueTasks.length === 0 &&
                    undatedTasks.length === 0 ? (
                      <ScheduleEmptyState
                        icon={FolderOpen}
                        title="今天还没有计划"
                        description="在上方输入框添加一项计划吧"
                      />
                    ) : (
                      <>
                        <TodayFocus
                          tasks={todayTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />
                        <OverdueSection
                          tasks={overdueTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />
                        <div className="space-y-4">
                          {PERIOD_ORDER.map((period) => (
                            <TimePeriodSection
                              key={period}
                              period={period}
                              tasks={periodGroups[period]}
                              tags={tags}
                              activeTaskId={activeTaskId}
                              onTaskClick={handleTaskClick}
                            />
                          ))}
                        </div>
                        <UpcomingTasks
                          tasks={allTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />
                        <InboxSection
                          tasks={undatedTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />
                        {!isDesktop && (
                          <div className="space-y-3 lg:hidden">
                            <HomeFocusTimer />
                            <HomeCountdowns />
                            <HomeHabitsSummary />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* === WEEK VIEW (未来7天) === */}
                {view === 'week' && groupBy === 'none' && (
                  <div className="space-y-4">
                    {weekDateGroups.length === 0 && overdueTasks.length === 0 ? (
                      <ScheduleEmptyState
                        icon={FolderOpen}
                        title="未来7天暂无计划"
                        description="可以新增一项计划，提前安排接下来的时间"
                      />
                    ) : (
                      <>
                        {/* Overdue tasks still shown at top */}
                        <OverdueSection
                          tasks={overdueTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />

                        {/* Date-grouped week tasks */}
                        {weekDateGroups.map((group) => (
                          <div key={group.date} className="space-y-1">
                            <div className="flex items-center gap-2 px-2">
                              <h3 className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
                                {group.label}
                              </h3>
                              <span className="text-micro tabular-nums text-muted-foreground">
                                {group.tasks.length}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {group.tasks.map((task) => (
                                <TaskListItem
                                  key={task.id}
                                  task={task}
                                  tags={tags}
                                  isActive={task.id === activeTaskId}
                                  onClick={() => handleTaskClick(task)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Inbox (undated) — shown in week view for context */}
                        <InboxSection
                          tasks={undatedTasks}
                          tags={tags}
                          activeTaskId={activeTaskId}
                          onTaskClick={handleTaskClick}
                        />

                        {!isDesktop && (
                          <div className="space-y-3 lg:hidden">
                            <HomeFocusTimer />
                            <HomeCountdowns />
                            <HomeHabitsSummary />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* === ALL VIEW === */}
                {view === 'all' && groupBy === 'none' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search
                        className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索所有事项……"
                        aria-label="搜索所有事项"
                        className="h-9 pl-8 text-body"
                      />
                    </div>
                    <div className="space-y-0.5">
                      {allTasks
                        .filter(
                          (t) =>
                            t.status !== 'cancelled' &&
                            (!searchQuery ||
                              t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .slice(0, 50)
                        .map((task) => (
                          <TaskListItem
                            key={task.id}
                            task={task}
                            tags={tags}
                            isActive={task.id === activeTaskId}
                            onClick={() => handleTaskClick(task)}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* === CATEGORY GROUPING OVERLAY === */}
                {groupBy === 'category' && categoryGroups && (
                  <div className="space-y-4">
                    {categoryGroups.length === 0 ? (
                      <ScheduleEmptyState
                        icon={TagIcon}
                        title="暂无分类任务"
                        description="当前视图范围内没有任务"
                      />
                    ) : (
                      categoryGroups.map((group) => (
                        <div key={group.tagId ?? '__uncategorized__'} className="space-y-1">
                          <div className="flex items-center gap-2 px-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: group.tagColor }}
                              aria-hidden="true"
                            />
                            <h3 className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
                              {group.tagName}
                            </h3>
                            <span className="text-micro tabular-nums text-muted-foreground">
                              {group.total}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {group.tasks.map((task) => (
                              <TaskListItem
                                key={task.id}
                                task={task}
                                tags={tags}
                                isActive={task.id === activeTaskId}
                                onClick={() => handleTaskClick(task)}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    {!isDesktop && (
                      <div className="space-y-3 lg:hidden">
                        <HomeFocusTimer />
                        <HomeCountdowns />
                        <HomeHabitsSummary />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Right panel */}
      {isDesktop && (
        <aside className="h-full w-72 shrink-0 space-y-3 overflow-y-auto border-l border-border p-3 xl:w-80">
          <HomeFocusTimer />
          <HomeCountdowns />
          <HomeHabitsSummary />
        </aside>
      )}

      {/* Floating task detail panel */}
      <TaskDetailPanel
        task={activeTask}
        open={showDetailPanel}
        onClose={handleClosePanel}
      />

      <SearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectTask={handleTaskClick}
      />
    </div>
  )
}
