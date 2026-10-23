'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemeDefinition } from '@/lib/theme/types'

interface ThemeCardProps {
  def: ThemeDefinition
  active: boolean
  onSelect: () => void
}

/**
 * 主题预览卡。
 * 预览不是截图，而是用同一套 CSS 变量渲染的迷你界面，
 * 所以卡片里看到的颜色、圆角、描边、底纹与真实主题一致。
 */
export function ThemeCard({ def, active, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      data-testid={`theme-card-${def.id}`}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border p-2 text-left ui-transition',
        active
          ? 'border-primary ring-2 ring-primary/25'
          : 'border-border hover:border-border-strong hover:shadow-[var(--shadow-float)]'
      )}
    >
      {/* 迷你预览：data-theme 让它加载对应主题的真实变量 */}
      <div
        className="theme-preview p-2.5"
        data-theme={def.id}
        style={{ backgroundImage: 'var(--deco-image, none)' }}
      >
        {/* 假窗口标题栏 */}
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ color: 'var(--foreground)' }}
          >
            {def.latinName}
          </span>
          <span className="ml-auto flex gap-1">
            <span className="tp-muted h-1 w-1 rounded-full" />
            <span className="tp-muted h-1 w-1 rounded-full" />
          </span>
        </div>

        <div className="flex gap-1.5">
          {/* 假侧栏 */}
          <div className="tp-surface flex w-6 flex-col gap-1 p-1">
            <span className="tp-soft h-1 w-full rounded-sm" />
            <span className="tp-muted h-1 w-3/4 rounded-sm" />
            <span className="tp-muted h-1 w-2/3 rounded-sm" />
            <span className="tp-muted h-1 w-3/4 rounded-sm" />
          </div>

          {/* 假内容区 */}
          <div className="flex-1 space-y-1.5">
            <div className="tp-surface p-1.5">
              <span
                className="block text-[9px] font-semibold leading-none"
                style={{ color: 'var(--foreground)' }}
              >
                今日 6 项
              </span>
              <span className="tp-soft mt-1.5 block h-1 w-full rounded-sm" />
            </div>
            <div className="flex gap-1.5">
              <div className="tp-surface h-6 flex-1 p-1">
                <span className="tp-muted block h-1 w-1/2 rounded-sm" />
              </div>
              <div className="tp-surface h-6 flex-1 p-1">
                <span className="tp-muted block h-1 w-2/3 rounded-sm" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="tp-accent h-3 w-9" />
              <span className="tp-soft h-3 w-6 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* 文案 */}
      <div className="mt-2 flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5 truncate text-body font-medium text-foreground">
            {def.name}
            <span className="text-micro font-normal uppercase tracking-wider text-muted-foreground">
              {def.latinName}
            </span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-micro text-muted-foreground">{def.tagline}</p>
        </div>
        <span
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-opacity',
            active
              ? 'bg-primary text-primary-foreground opacity-100'
              : 'border border-border opacity-0 group-hover:opacity-60'
          )}
          aria-hidden="true"
        >
          {active && <Check className="h-2.5 w-2.5" />}
        </span>
      </div>

      {active && (
        <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
          使用中
        </span>
      )}
      {!active && def.recommended && (
        <span className="absolute right-2 top-2 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          推荐
        </span>
      )}
    </button>
  )
}
