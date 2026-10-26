'use client'

// ============================================================
// 桌宠窗口：浮窗的另一种形态
// - 形象来自随包分发的角色包（宝儿姐六态立绘）
// - 左键：轮播 问候 / 今日剩余任务 / 专注状态 / 角色台词
// - 右键换形态，齿轮打开设置；按住人物可拖动
// - 透明窗口：只有立绘的不透明像素才响应鼠标（像素级穿透），
//   其余区域点击直接穿到桌面
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToday } from '@/hooks/use-today'
import { getDesktopBridge } from '@/lib/desktop-bridge'
import { listPacks, stateUrl, type CharacterPack } from '@/lib/atmosphere/character-packs'
import { subscribeDataChanged } from '@/lib/widget-sync'
import type { CharacterExpression } from '@/lib/theme/atmosphere'
import {
  buildFocusBubble,
  buildGreetingBubble,
  buildTasksBubble,
  nextBubbleKind,
  PET_EXPRESSION_LABELS,
  type PetBubbleKind,
} from '@/lib/pet/messages'
import {
  ArrowRightLeft,
  Cat,
  Loader2,
  Maximize2,
  MonitorSmartphone,
  Power,
  Settings2,
} from 'lucide-react'
import type { FocusSession, Task } from '@/types'
import { PetPreferencesControl } from '@/components/layout/pet-preferences'
import { usePetPreferences } from '@/lib/pet/preferences'
import { cn } from '@/lib/utils'

const EXPRESSIONS: CharacterExpression[] = ['idle', 'happy', 'thinking', 'working', 'error', 'sleepy']

type DialogueMap = Partial<Record<CharacterExpression, string[]>>

function dialogueOf(pack: CharacterPack | null): DialogueMap {
  const raw = (pack?.manifest as { dialogue?: DialogueMap } | undefined)?.dialogue
  if (!raw || typeof raw !== 'object') return {}
  return Object.fromEntries(EXPRESSIONS.map(state => [state, Array.isArray(raw[state])
    ? raw[state]!.filter((line): line is string => typeof line === 'string' && !!line.trim()) : []]))
}

function randomLine(lines: string[]): string | null {
  if (!lines.length) return null
  return lines[Math.floor(Math.random() * lines.length)]
}

export default function PetPage() {
  const { user } = useAuth()
  const { tasks: taskRepo, focusSessions: fsRepo } = useRepos()
  const queryClient = useQueryClient()
  const today = useToday()
  const bridge = getDesktopBridge()

  const [pack, setPack] = useState<CharacterPack | null>(null)
  const [expression, setExpression] = useState<CharacterExpression>('idle')
  const [bubble, setBubble] = useState<{ text: string } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const { preferences } = usePetPreferences()
  const [reaction, setReaction] = useState(0)
  const artContainerRef = useRef<HTMLDivElement | null>(null)
  const greetedRef = useRef(false)
  const [ready, setReady] = useState(false)

  const bubbleKindRef = useRef<PetBubbleKind>('greeting')
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuOpenRef = useRef(false)
  const dragRef = useRef<{
    sx: number
    sy: number
    lastX: number
    lastY: number
    moved: boolean
  } | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  // 当前立绘的 alpha 掩码：判断光标是否落在不透明像素上
  const alphaRef = useRef<{ w: number; h: number; data: Uint8ClampedArray } | null>(null)
  const ignoreRef = useRef(true)
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null)

  const { data: activeSession } = useQuery({
    queryKey: ['focus', 'active'],
    queryFn: () => fsRepo.getActive(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  })
  const { data: todayTasks = [] } = useQuery({
    queryKey: ['tasks', user?.id, 'pet', today],
    queryFn: () => taskRepo.getByDate(user!.id, today),
    enabled: !!user,
  })

  const sessionRef = useRef<FocusSession | null>(null)
  const tasksRef = useRef<Task[]>([])
  useEffect(() => {
    sessionRef.current = activeSession ?? null
    tasksRef.current = todayTasks
  }, [activeSession, todayTasks])

  const dialogue = useMemo(() => dialogueOf(pack), [pack])

  useEffect(() => {
    document.documentElement.classList.add('pet-window')
    return () => document.documentElement.classList.remove('pet-window')
  }, [])

  // 角色包刚随主窗口种进 IndexedDB，可能还没写完：小轮询等它出现
  useEffect(() => {
    let cancelled = false
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      if (cancelled) return
      tries += 1
      try {
        const packs = await listPacks()
        const found = packs.find((p) => p.id === 'pack-feng-baobao') ?? packs[0] ?? null
        if (found) {
          if (!cancelled) {
            setPack(found)
            setReady(true)
          }
          return
        }
      } catch {
        /* 下一轮再试 */
      }
      if (tries < 12 && !cancelled) timer = setTimeout(tick, 1500)
      else if (!cancelled) setReady(true)
    }
    void tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const imageUrl = useMemo(() => {
    if (!pack) return null
    return stateUrl(pack, expression)
  }, [pack, expression])

  // ---------- 像素级鼠标穿透 ----------
  //
  // Electron 的 setIgnoreMouseEvents(forward) 只能按窗口整块开关；
  // 这里把立绘画进离屏 canvas 缓存 alpha 通道，光标落在不透明像素上
  // 才接管鼠标，贴图之外的透明部分保持穿透——桌宠的边界就是贴图本身。

  const applyIgnore = useCallback(
    (ignore: boolean) => {
      if (ignoreRef.current === ignore) return
      ignoreRef.current = ignore
      bridge?.petSetIgnoreMouse(ignore).catch(() => {})
    },
    [bridge]
  )

  useEffect(() => {
    alphaRef.current = null
    if (!imageUrl) {
      alphaRef.current = null
      return
    }
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (!alive) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        alphaRef.current = { w: canvas.width, h: canvas.height, data }
      } catch {
        alphaRef.current = null
      }
    }
    img.onerror = () => { if (alive) alphaRef.current = null }
    img.src = imageUrl
    return () => {
      alive = false
    }
  }, [imageUrl])

  const isOverArt = useCallback((x: number, y: number): boolean => {
    const el = imgRef.current
    if (!el) {
      const fallback = artContainerRef.current?.getBoundingClientRect()
      return !!fallback && x >= fallback.left && x < fallback.right && y >= fallback.top && y < fallback.bottom
    }
    const rect = el.getBoundingClientRect()
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) return false
    const mask = alphaRef.current
    // 立绘还没就绪（或掩码构建失败）时退化为矩形判定，保证始终可交互
    if (!mask) return true
    const px = Math.min(mask.w - 1, Math.max(0, Math.floor(((x - rect.left) / rect.width) * mask.w)))
    const py = Math.min(mask.h - 1, Math.max(0, Math.floor(((y - rect.top) / rect.height) * mask.h)))
    return mask.data[(py * mask.w + px) * 4 + 3] > 24
  }, [])

  // 初始进入穿透态，等光标碰到不透明像素再接管
  useEffect(() => {
    if (!bridge) return
    bridge.petSetIgnoreMouse(true).catch(() => {})
  }, [bridge])

  useEffect(() => {
    if (!bridge) return
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      if (menuOpenRef.current || dragRef.current || document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pet-control]')) {
        applyIgnore(false)
        return
      }
      applyIgnore(!isOverArt(e.clientX, e.clientY))
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [bridge, applyIgnore, isOverArt])

  // 其它窗口（浮窗/主窗口）改了专注状态或任务时同步刷新
  useEffect(() => {
    return subscribeDataChanged((scope) => {
      if (scope === 'focus' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['focus', 'active'] })
      }
      if (scope === 'tasks' || scope === 'all') {
        queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      }
    })
  }, [queryClient, user?.id])

  const showBubble = useCallback((text: string) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setBubble({ text })
    setReaction(value => value + 1)
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 6000)
  }, [])

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!pack || greetedRef.current) return
    greetedRef.current = true
    const timer = setTimeout(() => showBubble('宝儿姐来咯～\n点我说话，按住拖动，右键换形态'), 300)
    return () => clearTimeout(timer)
  }, [pack, showBubble])

  /** 左键：轮播 问候 → 剩余任务 → 专注状态 → 台词 */
  const advanceBubble = useCallback(() => {
    const kind = bubbleKindRef.current
    bubbleKindRef.current = nextBubbleKind(kind)

    if (kind === 'greeting') {
      showBubble(buildGreetingBubble(new Date().getHours(), dialogue.idle ?? []))
      return
    }
    if (kind === 'tasks') {
      const remaining = tasksRef.current
        .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
        .map((t) => t.title)
      showBubble(buildTasksBubble(remaining))
      return
    }
    if (kind === 'focus') {
      showBubble(buildFocusBubble(sessionRef.current, Date.now()))
      return
    }
    const line =
      randomLine(dialogue[expression] ?? []) ?? randomLine(dialogue.idle ?? []) ?? '……'
    showBubble(line)
  }, [dialogue, expression, showBubble])

  /** 切换形态：下一张立绘，顺口播一句该状态的台词 */
  const cycleExpression = useCallback(() => {
    const available = EXPRESSIONS.filter((s) => !!pack?.states[s] || (s === 'idle' && !!pack?.display))
    const order = available.length ? available : ['idle'] as CharacterExpression[]
    const index = order.indexOf(expression)
    const next = order[(index + 1) % order.length]
    setExpression(next)
    const line =
      randomLine(dialogue[next] ?? []) ?? randomLine(dialogue.idle ?? []) ?? `${PET_EXPRESSION_LABELS[next] ?? next}～`
    showBubble(line)
  }, [dialogue, expression, pack, showBubble])

  const closeMenu = useCallback(() => {
    setMenu(null)
    menuOpenRef.current = false
    // 菜单关掉后按当前光标位置恢复穿透状态
    const m = lastMouseRef.current
    if (m) applyIgnore(!isOverArt(m.x, m.y))
  }, [applyIgnore, isOverArt])

  // ---------- 拖动（指针捕获，出了窗口也能继续拖） ----------

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    applyIgnore(false)
    dragRef.current = { sx: e.screenX, sy: e.screenY, lastX: e.screenX, lastY: e.screenY, moved: false }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* 捕获失败也能拖，只是出窗后会断 */
    }
  }, [applyIgnore])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      if (!d.moved && Math.hypot(e.screenX - d.sx, e.screenY - d.sy) > 5) d.moved = true
      if (d.moved) {
        bridge?.petMoveBy(e.screenX - d.lastX, e.screenY - d.lastY).catch(() => {})
        d.lastX = e.screenX
        d.lastY = e.screenY
      }
    },
    [bridge]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      dragRef.current = null
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* 忽略 */
      }
      applyIgnore(!isOverArt(e.clientX, e.clientY))
      if (d && !d.moved) advanceBubble()
    },
    [advanceBubble, applyIgnore, isOverArt]
  )

  useEffect(() => {
    const cancel = () => { dragRef.current = null; closeMenu(); applyIgnore(true) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key) }
  }, [closeMenu, applyIgnore])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-transparent">
      {/* 角色与气泡锚定在同一列：气泡始终贴着头顶 */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
        {bubble && (
          <div
            key={reaction}
            role="status"
            data-pet-control
            data-testid="pet-bubble"
            className="pointer-events-auto pet-bubble-enter mb-2 max-h-[88px] w-[248px] overflow-y-auto rounded-2xl bg-card px-3.5 py-2 text-center text-caption leading-relaxed whitespace-pre-line text-foreground shadow-[var(--shadow-pop)] ring-1 ring-border"
          >
            {bubble.text}
          </div>
        )}

        <div
          ref={artContainerRef}
          data-testid="pet-character"
          data-expression={expression}
          role="button"
          tabIndex={0}
          aria-label={`宝儿姐，${PET_EXPRESSION_LABELS[expression]}`}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advanceBubble() } }}
          className="pointer-events-auto flex cursor-grab touch-none items-end justify-center select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { dragRef.current = null; applyIgnore(true) }}
          onLostPointerCapture={() => { dragRef.current = null }}
          onContextMenu={(e) => {
            e.preventDefault()
            cycleExpression()
          }}
          title="左键说话 · 按住拖动 · 右键换形态"
        >
          {imageUrl ? (
            // 本地素材是运行时 object URL，next/image 无法优化
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${expression}-${reaction}`}
              ref={imgRef}
              src={imageUrl}
              alt="桌宠"
              draggable={false}
              style={{ maxHeight: preferences.size, maxWidth: 248, width: 'auto', height: 'auto' }}
              className={cn("drop-shadow-2xl", preferences.motion && reaction > 0 && "pet-react")}
            />
          ) : ready ? (
            <div className="flex h-[240px] w-[170px] flex-col items-center justify-center gap-2 rounded-2xl bg-card/90 text-caption text-muted-foreground shadow-lg ring-1 ring-border">
              <Cat className="h-8 w-8" />
              <span className="px-3 text-center">角色包还没就绪{'\n'}稍等片刻或重启应用</span>
            </div>
          ) : (
            <div className="flex h-[240px] w-[170px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <button type="button" data-pet-control aria-label="桌宠设置" aria-expanded={!!menu}
          className="pointer-events-auto mt-1 flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-xs text-foreground shadow-sm"
          onClick={() => { menuOpenRef.current = true; applyIgnore(false); setMenu({ x: 8, y: 8 }) }}>
          <Settings2 className="h-3 w-3" />{PET_EXPRESSION_LABELS[expression]} · 设置
        </button>
      </div>

      {/* 设置面板 */}
      {menu && (
        <>
          <div className="absolute inset-0 z-30" onPointerDown={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu() }} />
          <div
            data-pet-control
            role="dialog" aria-label="桌宠设置面板"
            className="pointer-events-auto absolute z-40 max-h-[calc(100vh-16px)] w-[248px] overflow-y-auto rounded-xl bg-card py-1 shadow-[var(--shadow-pop)] ring-1 ring-border"
            style={{ left: menu.x, top: menu.y }}
          >
            <div className="flex items-center justify-between px-3 pt-2 text-caption"><strong>桌宠设置</strong><button type="button" onClick={closeMenu} aria-label="关闭桌宠设置">收起</button></div>
            <PetPreferencesControl />
            {(
              [
                { icon: MonitorSmartphone, label: '打开浮窗', action: () => bridge?.showWidget() },
                { icon: Maximize2, label: '打开主窗口', action: () => bridge?.openMain() },
                { icon: ArrowRightLeft, label: '切换形态', action: cycleExpression },
                {
                  icon: Power,
                  label: '关闭桌宠',
                  action: () => bridge?.setPetEnabled(false),
                  danger: true,
                },
              ] as { icon: typeof MonitorSmartphone; label: string; action: () => unknown; danger?: boolean }[]
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={async () => {
                  closeMenu()
                  try { await item.action() } catch { showBubble('暂时没能完成操作，请再试一次') }
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-caption ui-transition hover:bg-accent',
                  item.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
