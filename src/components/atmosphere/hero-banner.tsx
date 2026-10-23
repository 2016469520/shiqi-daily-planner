'use client'

// ============================================================
// 首页主视觉（Hero）
//
// 不是"右下角贴一张图"：场景、角色、问候与每日一句被组织成一张卡片，
// 角色参与构图的右侧，文字在左，场景作为底纹铺满——三种元素互相咬合。
// 卡片本身用 .surface，所以六套主题会自动带上各自的边框/圆角/阴影语言。
//
// 纯净模式、关闭氛围、或没有角色的主题下不显示，工作区保持最大。
// ============================================================

import { useMemo, useState } from 'react'
import { ChevronUp, Sparkles, X } from 'lucide-react'
import { useAppearance } from '@/providers/appearance-provider'
import { resolveAtmosphere } from '@/lib/theme/scene-resolve'
import { linesFor } from '@/lib/theme/atmosphere'
import { useCurrentCharacter, useCurrentScene } from './use-current-scene'
import { renderScene } from './art/registry'
import { CharacterCompanion } from './character-companion'
import { QuoteStrip } from './quote-strip'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 19) return '下午好'
  return '晚上好'
}

export function ThemeHero() {
  const { state, theme } = useAppearance()
  const atmo = useMemo(() => resolveAtmosphere(state.atmosphere), [state.atmosphere])
  const scene = useCurrentScene()
  const character = useCurrentCharacter()
  const [collapsed, setCollapsed] = useState(false)

  const line = useMemo(() => {
    if (!character || !atmo.characterWelcome) return null
    const pool = linesFor(character.id, 'idle')
    return pool.length ? pool[0] : null
  }, [character, atmo.characterWelcome])

  if (!atmo.enabled || atmo.mode === 'pure' || !scene) return null

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-micro text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
        data-testid="hero-expand"
      >
        <ChevronUp className="h-3 w-3 rotate-180" aria-hidden="true" />
        展开今日主视觉
      </button>
    )
  }

  return (
    <section
      className="surface relative mb-3 overflow-hidden p-0"
      data-testid="atmosphere-hero"
      data-theme-hero={theme.id}
    >
      {/* 场景底纹：只占卡片，不铺满窗口 */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {renderScene(scene.id, 'h-full w-full')}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/30" />

      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="absolute right-2 top-2 z-10 rounded-full p-1 text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
        aria-label="收起主视觉"
        title="收起（需要更大的工作区时）"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div className="relative flex items-stretch gap-3 p-4 sm:gap-5 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-micro text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {greeting()} · {theme.name}
          </p>
          <h2 className="mt-1 text-title text-foreground">
            今天先做哪一件？
          </h2>
          {line && (
            <p className="mt-1.5 line-clamp-2 text-caption text-muted-foreground">「{line}」</p>
          )}
          <div className="mt-3 max-w-md">
            <QuoteStrip />
          </div>
        </div>

        {character && atmo.characterPosition === 'hero' && (
          <div
            className="relative flex shrink-0 items-end"
            data-testid="hero-character"
          >
            <CharacterCompanion placement="hero" />
          </div>
        )}
      </div>
    </section>
  )
}
