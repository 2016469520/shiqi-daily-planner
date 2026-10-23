'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sun, CalendarRange, ListFilter, LayoutGrid } from 'lucide-react'

export type ScheduleView = 'today' | 'week' | 'all'

const TIME_VIEWS: { value: ScheduleView; label: string; icon: typeof Sun; shortLabel: string }[] = [
  { value: 'today', label: '今天', icon: Sun, shortLabel: '今天' },
  { value: 'week', label: '未来7天', icon: CalendarRange, shortLabel: '7天' },
  { value: 'all', label: '全部', icon: ListFilter, shortLabel: '全部' },
]

interface ScheduleViewSwitcherProps {
  view: ScheduleView
  onViewChange: (view: ScheduleView) => void
  groupBy: 'none' | 'category'
  onGroupByChange: (groupBy: 'none' | 'category') => void
}

export function ScheduleViewSwitcher({
  view,
  onViewChange,
  groupBy,
  onGroupByChange,
}: ScheduleViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Time range segmented control */}
      <div className="flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5">
        {TIME_VIEWS.map((v) => (
          <Button
            key={v.value}
            data-testid={`schedule-view-${v.value}`}
            variant="ghost"
            size="sm"
            aria-pressed={view === v.value}
            className={cn(
              'h-7 gap-1 rounded-full px-2.5 font-normal ui-transition',
              view === v.value
                ? 'acg-pill font-medium hover:bg-primary/[0.14]'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onViewChange(v.value)}
          >
            <v.icon className="hidden h-3.5 w-3.5 sm:inline" aria-hidden="true" />
            <span className="hidden text-caption sm:inline">{v.label}</span>
            <span className="text-caption sm:hidden">{v.shortLabel}</span>
          </Button>
        ))}
      </div>

      {/* Category grouping toggle — visually separated */}
      <Button
        data-testid="schedule-group-category"
        variant="ghost"
        size="sm"
        aria-label="按分类分组"
        aria-pressed={groupBy === 'category'}
        className={cn(
          'h-7 gap-1 rounded-full px-2.5 font-normal ui-transition',
          groupBy === 'category'
            ? 'acg-pill font-medium hover:bg-primary/[0.14]'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() =>
          onGroupByChange(groupBy === 'category' ? 'none' : 'category')
        }
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden text-caption sm:inline">按分类</span>
      </Button>
    </div>
  )
}
