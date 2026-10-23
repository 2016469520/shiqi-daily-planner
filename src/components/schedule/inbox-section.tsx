'use client'

import { useState } from 'react'
import type { Task, Tag } from '@/types'
import { TaskListItem } from './task-list-item'
import { Inbox, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface InboxSectionProps {
  tasks: Task[]
  tags: Tag[]
  activeTaskId?: string | null
  onTaskClick: (task: Task) => void
}

export function InboxSection({ tasks, tags, activeTaskId, onTaskClick }: InboxSectionProps) {
  const [collapsed, setCollapsed] = useState(true)

  if (tasks.length === 0) return null

  return (
    <section className="surface overflow-hidden">
      <button
        data-testid="inbox-toggle"
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left ui-transition hover:bg-surface-2"
      >
        <div className="flex min-w-0 items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-section">收集箱</span>
          <span className="text-micro tabular-nums text-muted-foreground">{tasks.length}</span>
        </div>
        <Link
          href="/inbox"
          className="shrink-0 text-micro text-muted-foreground ui-transition hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          全部
        </Link>
      </button>

      {!collapsed && (
        <div className="space-y-0.5 px-2 pb-2">
          {tasks.slice(0, 5).map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              tags={tags}
              isActive={task.id === activeTaskId}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {tasks.length > 5 && (
            <Link
              href="/inbox"
              className="block py-1 text-center text-caption text-muted-foreground ui-transition hover:text-foreground"
            >
              查看全部 {tasks.length} 项
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
