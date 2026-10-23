'use client'

// ============================================================
// 完成任务时的轻量庆祝
//
// 由 bus 的 celebrate 事件触发，12 片彩带向四周散开 900ms 后自动清理。
// 尊重"关闭动画"与"关闭庆祝"两个开关。
// ============================================================

import { useEffect, useState } from 'react'
import { useAppearance } from '@/providers/appearance-provider'
import { subscribeAtmosphere } from '@/lib/atmosphere/bus'

interface Piece {
  id: number
  x: number
  y: number
  cx: number
  cy: number
  cr: number
  color: string
  delay: number
}

const COLORS = ['#f472b6', '#a78bfa', '#7dd3fc', '#fbbf24', '#34d399', '#fb7185']

export function CelebrationLayer() {
  const { state } = useAppearance()
  const enabled = state.atmosphere.enabled && state.atmosphere.celebration
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!enabled) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let seq = 0
    let clearTimer: ReturnType<typeof setTimeout> | null = null

    return subscribeAtmosphere((event) => {
      if (event.type !== 'celebrate') return
      seq += 1
      const originX = window.innerWidth - 220
      const originY = window.innerHeight - 150
      setPieces(
        Array.from({ length: 12 }, (_, i) => ({
          id: seq * 100 + i,
          x: originX,
          y: originY,
          cx: (Math.random() - 0.5) * 320,
          cy: -80 - Math.random() * 220,
          cr: (Math.random() - 0.5) * 720,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 120,
        }))
      )
      if (clearTimer) clearTimeout(clearTimer)
      clearTimer = setTimeout(() => setPieces([]), 1100)
    })
  }, [enabled])

  if (!enabled || pieces.length === 0) return null

  return (
    <div className="atmo-celebration" aria-hidden="true" data-testid="atmosphere-celebration">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="atmo-confetti"
          style={{
            left: p.x,
            top: p.y,
            backgroundColor: p.color,
            animationDelay: `${p.delay}ms`,
            ['--cx' as string]: `${p.cx}px`,
            ['--cy' as string]: `${p.cy}px`,
            ['--cr' as string]: `${p.cr}deg`,
          }}
        />
      ))}
    </div>
  )
}
