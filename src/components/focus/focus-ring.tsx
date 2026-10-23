'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RingVariant = 'focus' | 'break' | 'overtime' | 'idle'

const VARIANT_STOPS: Record<RingVariant, [string, string]> = {
  focus: ['#8b5cf6', '#22d3ee'], // 紫 → 青
  break: ['#34d399', '#a7f3d0'], // 绿松
  overtime: ['#fb7185', '#fbbf24'], // 桃红 → 琥珀
  idle: ['#c4b5fd', '#bae6fd'],
}

interface FocusRingProps {
  /** 0..1；传 null 表示没有确定进度（呼吸态） */
  progress: number | null
  variant?: RingVariant
  size?: number
  strokeWidth?: number
  className?: string
  children?: ReactNode
  /** 中心内容是否允许溢出滚动 */
  centerClassName?: string
}

/**
 * 专注计时环：紫青渐变描边 + 外发光，负责"二次元感"的主视觉。
 * 纯展示组件，不持有任何计时状态。
 */
export function FocusRing({
  progress,
  variant = 'focus',
  size = 190,
  strokeWidth = 8,
  className,
  children,
  centerClassName,
}: FocusRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [from, to] = VARIANT_STOPS[variant]
  const clamped = progress === null ? 0 : Math.min(1, Math.max(0, progress))
  const dashOffset = circumference * (1 - clamped)
  const gradientId = `ring-${variant}-${size}`

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        {/* 轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-violet-200/60 dark:text-violet-500/25"
        />

        {/* 进度 */}
        {progress !== null ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="acg-ring-glow transition-[stroke-dashoffset] duration-500 ease-out"
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.18} ${circumference * 0.82}`}
            className="acg-ring-glow acg-breathe"
          />
        )}
      </svg>

      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center text-center px-6',
          centerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
