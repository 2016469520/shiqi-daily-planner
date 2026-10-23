'use client'

import type { LucideIcon } from 'lucide-react'

interface ScheduleEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

/**
 * 日程页统一空状态：24px 图标 + text-body 主文案 + text-caption 副文案。
 * 纯展示组件，仅替换各视图里重复的空状态结构。
 */
export function ScheduleEmptyState({ icon: Icon, title, description }: ScheduleEmptyStateProps) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
      <p className="text-body font-medium text-foreground">{title}</p>
      <p className="text-caption text-muted-foreground">{description}</p>
    </div>
  )
}
