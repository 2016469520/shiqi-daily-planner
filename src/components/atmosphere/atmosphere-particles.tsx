'use client'

// ============================================================
// 氛围粒子层
//
// 只做少量元素的 CSS 动画（transform / opacity），不用 canvas、
// 不用 JS 逐帧循环。全部尊重 data-motion='off' 与系统"减少动态"。
// ============================================================

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ThemeId } from '@/lib/theme/types'

interface AtmosphereParticlesProps {
  themeId: ThemeId
}

/** 固定种子伪随机：同一次渲染内稳定，避免水合不一致 */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function AtmosphereParticles({ themeId }: AtmosphereParticlesProps) {
  const items = useMemo(() => {
    switch (themeId) {
      case 'anime':
        // 樱花：飘落 + 左右摆动
        return Array.from({ length: 14 }, (_, i) => ({
          left: `${seeded(i, 1) * 100}%`,
          delay: `${-seeded(i, 2) * 14}s`,
          duration: `${11 + seeded(i, 3) * 10}s`,
          size: 5 + seeded(i, 4) * 6,
          drift: `${(seeded(i, 5) - 0.5) * 120}px`,
        }))
      case 'cyber':
        // 星点闪烁 + 一条扫描线（扫描线单独渲染）
        return Array.from({ length: 18 }, (_, i) => ({
          left: `${seeded(i, 1) * 100}%`,
          top: `${seeded(i, 2) * 100}%`,
          delay: `${-seeded(i, 3) * 6}s`,
          duration: `${3 + seeded(i, 4) * 4}s`,
          size: 1 + Math.round(seeded(i, 5) * 2),
          drift: '0px',
        }))
      case 'fluent':
        // 缓慢上浮的光斑
        return Array.from({ length: 7 }, (_, i) => ({
          left: `${8 + seeded(i, 1) * 84}%`,
          top: `${20 + seeded(i, 2) * 60}%`,
          delay: `${-seeded(i, 3) * 18}s`,
          duration: `${16 + seeded(i, 4) * 12}s`,
          size: 40 + seeded(i, 5) * 90,
          drift: '0px',
        }))
      case 'pixel':
        // 上升的像素粒子
        return Array.from({ length: 12 }, (_, i) => ({
          left: `${seeded(i, 1) * 100}%`,
          delay: `${-seeded(i, 2) * 12}s`,
          duration: `${9 + seeded(i, 3) * 8}s`,
          size: 3 + Math.round(seeded(i, 4) * 3),
          drift: `${(seeded(i, 5) - 0.5) * 40}px`,
        }))
      case 'bento':
        // 两团极慢的冷光漂移
        return Array.from({ length: 3 }, (_, i) => ({
          left: `${15 + seeded(i, 1) * 70}%`,
          top: `${10 + seeded(i, 2) * 70}%`,
          delay: `${-seeded(i, 3) * 20}s`,
          duration: `${22 + seeded(i, 4) * 14}s`,
          size: 160 + seeded(i, 5) * 200,
          drift: '0px',
        }))
      default:
        // minimal：几乎不留粒子，只有一颗极淡的光点
        return Array.from({ length: 1 }, () => ({
          left: '72%',
          top: '22%',
          delay: '0s',
          duration: '30s',
          size: 220,
          drift: '0px',
        }))
    }
  }, [themeId])

  return (
    <div className="atmo-particles" aria-hidden="true">
      {themeId === 'cyber' && <span className="atmo-scanline" />}
      {items.map((p, i) => (
        <span
          key={i}
          className={cn('atmo-particle', `atmo-particle-${themeId}`)}
          style={{
            left: p.left,
            top: 'top' in p ? (p as { top: string }).top : undefined,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            // 花瓣/粒子的横向漂移用自定义属性传给 keyframes
            ['--drift' as string]: p.drift,
          }}
        />
      ))}
    </div>
  )
}
