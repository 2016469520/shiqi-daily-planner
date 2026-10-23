'use client'

// ============================================================
// 主题开场页（每日一次）
//
// 组合：场景插画 + 角色 + 时段问候 + 每日一句 + 进入按钮。
// 只在当天第一次进入时出现，用户可以在设置里关掉。
// 关闭后写 localStorage 记录当天日期，不重复打扰。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isHomePath } from '@/lib/atmosphere/routes'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppearance } from '@/providers/appearance-provider'
import { linesFor, type CharacterExpression } from '@/lib/theme/atmosphere'
import { renderCharacter, renderScene } from './art/registry'
import { QuoteStrip } from './quote-strip'
import { useCurrentCharacter, useCurrentScene, todayKey } from './use-current-scene'

const WELCOME_KEY = 'timegrid:atmosphere:welcomed'

function greeting(): { title: string; sub: string } {
  const hour = new Date().getHours()
  if (hour < 6) return { title: '夜深了', sub: '如果还能做一件小事，就从最短的那件开始' }
  if (hour < 11) return { title: '早上好', sub: '先决定今天最重要的一件事' }
  if (hour < 14) return { title: '中午好', sub: '吃口东西，再回来继续' }
  if (hour < 19) return { title: '下午好', sub: '把注意力放回手上这件事' }
  return { title: '晚上好', sub: '收个尾，然后好好休息' }
}

function welcomeMood(): CharacterExpression {
  const hour = new Date().getHours()
  if (hour < 6 || hour >= 23) return 'sleepy'
  return 'happy'
}

export function WelcomeOverlay() {
  const { state } = useAppearance()
  const pathname = usePathname()
  // 只在首页出现：设置页/日历页弹开场会打断操作
  const isHomeRoute = isHomePath(pathname)
  const atmosphere = state.atmosphere
  const scene = useCurrentScene()
  const sceneArt = renderScene(scene?.id, 'h-full w-full')
  const [open, setOpen] = useState(false)

  const character = useCurrentCharacter()

  const mood = welcomeMood()
  const characterArt = character
    ? renderCharacter(character.artId, { expression: mood, className: 'h-full w-full' })
    : null
  const line = useMemo(() => {
    if (!character) return null
    const pool = linesFor(character.artId, mood)
    return pool.length ? pool[0] : null
  }, [character, mood])

  useEffect(() => {
    if (!isHomeRoute) return
    if (!atmosphere.enabled || !atmosphere.welcome) return
    try {
      const seen = window.localStorage.getItem(WELCOME_KEY)
      if (seen === todayKey()) return
    } catch {
      return
    }
    // 稍等一拍，避免和首屏渲染抢帧
    const timer = window.setTimeout(() => setOpen(true), 260)
    return () => window.clearTimeout(timer)
  }, [atmosphere.enabled, atmosphere.welcome, isHomeRoute])

  const dismiss = useCallback(() => {
    setOpen(false)
    try {
      window.localStorage.setItem(WELCOME_KEY, todayKey())
    } catch {
      /* 存不了就下次再问候，不影响使用 */
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  if (!open) return null
  const g = greeting()

  return (
    <div className="atmo-welcome" role="dialog" aria-modal="true" aria-label="主题开场">
      <div className="atmo-welcome-card" data-testid="atmosphere-welcome" data-scene={scene?.id}>
        {sceneArt && <div className="atmo-welcome-art">{sceneArt}</div>}
        <div className="atmo-welcome-scrim" />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground ui-transition hover:bg-accent hover:text-foreground"
          aria-label="关闭开场页"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-8">
          {characterArt && atmosphere.characterEnabled && (
            <div className="h-32 w-28 shrink-0 sm:h-40 sm:w-36" data-testid="welcome-character">
              {characterArt}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-caption text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {state.themeId === 'anime'
                ? '樱色 · 今日开场'
                : state.themeId === 'cyber'
                  ? '霓虹终端 · 系统上线'
                  : state.themeId === 'pixel'
                    ? '像素机 · 读档完成'
                    : state.themeId === 'bento'
                      ? '暗格 · 工作台已就绪'
                      : state.themeId === 'minimal'
                        ? '留白 · 今日留白'
                        : '云母 · 今日概览'}
            </p>
            <h1 className="mt-1 text-display text-foreground">{g.title}</h1>
            <p className="mt-1 text-body text-muted-foreground">{g.sub}</p>

            {line && (
              <p className="mt-3 rounded-md bg-surface-2/80 px-3 py-2 text-caption text-foreground/80 backdrop-blur">
                「{line}」
              </p>
            )}

            <div className="mt-4 max-w-md">
              <QuoteStrip />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={dismiss} className="gap-1.5">
                开始今天
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" className="text-caption" onClick={dismiss}>
                今天不再显示
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
