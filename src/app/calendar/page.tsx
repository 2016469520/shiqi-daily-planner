'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { CalendarHeader } from '@/components/calendar/calendar-header'
import { MonthView } from '@/components/calendar/month-view'
import { WeekView } from '@/components/calendar/week-view'
import { DayView } from '@/components/calendar/day-view'
import { CategoryView } from '@/components/calendar/category-view'
import { TaskEditDialog } from '@/components/plans/task-edit-dialog'
import { TaskDetailPanel } from '@/components/schedule/task-detail-panel'
import { TaskListSheet } from '@/components/calendar/task-list-sheet'
import type { CalendarView, Task, Period } from '@/types'
import { todayStr } from '@/lib/utils/date'
import { STORAGE_KEYS } from '@/lib/constants'

type PresentationMode = 'time' | 'category'

function getInitialView(): CalendarView {
  if (typeof window === 'undefined') return 'month'
  const saved = localStorage.getItem(STORAGE_KEYS.lastView)
  if (saved === 'month' || saved === 'week' || saved === 'day') return saved
  return 'month'
}

function getInitialMode(): PresentationMode {
  if (typeof window === 'undefined') return 'time'
  const saved = localStorage.getItem('plan-calendar-presentation-mode')
  if (saved === 'time' || saved === 'category') return saved
  return 'time'
}

function getInitialDate(): string {
  if (typeof window === 'undefined') return todayStr()
  return localStorage.getItem(STORAGE_KEYS.lastDate) || todayStr()
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<CalendarView>(getInitialView)
  const [presentationMode, setPresentationMode] = useState<PresentationMode>(getInitialMode)
  const [currentDate, setCurrentDate] = useState(getInitialDate)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTaskTagId, setNewTaskTagId] = useState<string | undefined>()
  // New detail panel state
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  // Overflow task list sheet state
  const [overflowSheet, setOverflowSheet] = useState<{
    open: boolean
    date: string
    period: Period
    tasks: Task[]
  }>({ open: false, date: '', period: 'morning' as Period, tasks: [] })

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view)
    localStorage.setItem(STORAGE_KEYS.lastView, view)
    setPresentationMode('time')
    localStorage.setItem('plan-calendar-presentation-mode', 'time')
  }, [])

  const handlePresentationModeChange = useCallback((mode: PresentationMode) => {
    setPresentationMode(mode)
    localStorage.setItem('plan-calendar-presentation-mode', mode)
  }, [])

  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date)
    localStorage.setItem(STORAGE_KEYS.lastDate, date)
  }, [])

  const handleNewTask = useCallback((defaultTagId?: string) => {
    setEditingTask(null)
    setNewTaskTagId(defaultTagId)
    setDialogOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setDetailTask(task)
  }, [])

  const handleOverflowClick = useCallback((date: string, period: Period, tasks: Task[]) => {
    setOverflowSheet({ open: true, date, period, tasks })
  }, [])

  if (!user) return null

  return (
    <div className="flex h-full bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CalendarHeader
          currentView={currentView}
          currentDate={currentDate}
          presentationMode={presentationMode}
          onViewChange={handleViewChange}
          onDateChange={handleDateChange}
          onNewTask={() => handleNewTask()}
          onPresentationModeChange={handlePresentationModeChange}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {presentationMode === 'time' && (
            <>
              {currentView === 'month' && (
                <MonthView currentDate={currentDate} onDateClick={handleDateChange} onViewChange={handleViewChange} onTaskClick={handleEditTask} />
              )}
              {currentView === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  onTaskClick={handleEditTask}
                  onOverflowClick={handleOverflowClick}
                />
              )}
              {currentView === 'day' && (
                <DayView currentDate={currentDate} onDateChange={handleDateChange} />
              )}
            </>
          )}

          {presentationMode === 'category' && (
            <CategoryView
              onEditTask={handleEditTask}
              onNewTask={handleNewTask}
            />
          )}
        </div>

        {/* Keep TaskEditDialog for mobile and explicit "新建" */}
        <TaskEditDialog
          task={editingTask}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultDate={currentDate}
          defaultTagId={newTaskTagId}
        />
      </div>

      {/* Floating task detail */}
      <TaskDetailPanel
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
      />

      {/* Overflow task list sheet */}
      <TaskListSheet
        open={overflowSheet.open}
        onOpenChange={(open) => setOverflowSheet((prev) => ({ ...prev, open }))}
        date={overflowSheet.date}
        period={overflowSheet.period}
        tasks={overflowSheet.tasks}
        onTaskClick={handleEditTask}
      />
    </div>
  )
}
