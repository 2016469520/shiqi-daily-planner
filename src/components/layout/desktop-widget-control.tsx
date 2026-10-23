'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getDesktopBridge, type DesktopBridge } from '@/lib/desktop-bridge'
import { Button } from '@/components/ui/button'
import { MonitorSmartphone, Pin, PinOff, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** bridge 是外部注入的，用 useSyncExternalStore 读取可以避免 SSR 水合不一致 */
const subscribeNoop = () => () => {}
const getBridgeSnapshot = () => getDesktopBridge()
const getServerSnapshot = () => null

/**
 * 「桌面浮窗」开关。只在 Electron 打包版里出现（网页/安卓没有 desktop bridge）。
 * variant='sidebar' 放在侧边栏底部，variant='card' 放在设置页。
 */
export function DesktopWidgetControl({ variant = 'sidebar' }: { variant?: 'sidebar' | 'card' }) {
  const bridge = useSyncExternalStore<DesktopBridge | null>(
    subscribeNoop,
    getBridgeSnapshot,
    getServerSnapshot
  )
  const [visible, setVisible] = useState(false)
  const [pinned, setPinned] = useState(true)

  useEffect(() => {
    if (!bridge) return
    let cancelled = false
    bridge
      .isWidgetVisible()
      .then((value) => {
        if (!cancelled) setVisible(value)
      })
      .catch(() => {})
    bridge
      .isPinned()
      .then((value) => {
        if (!cancelled) setPinned(value)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [bridge])

  const toggleVisible = useCallback(async () => {
    if (!bridge) return
    const next = await bridge.toggleWidget()
    setVisible(next)
    toast.success(next ? '浮窗已显示' : '浮窗已隐藏', { duration: 1500 })
  }, [bridge])

  const togglePin = useCallback(async () => {
    if (!bridge) return
    setPinned(await bridge.togglePin())
  }, [bridge])

  if (!bridge) return null

  if (variant === 'card') {
    return (
      <section className="surface p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <MonitorSmartphone className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-section">桌面浮窗</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              一个常驻桌面角落的小清单，随时勾选、随手加事项；关闭主窗口后它仍留在桌面上
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={visible ? 'outline' : 'default'} className="h-8" onClick={toggleVisible}>
            {visible ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
            {visible ? '隐藏浮窗' : '显示浮窗'}
          </Button>
          <Button variant="outline" className="h-8" onClick={togglePin}>
            {pinned ? <PinOff className="mr-1.5 h-4 w-4" /> : <Pin className="mr-1.5 h-4 w-4" />}
            {pinned ? '取消置顶' : '置顶浮窗'}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <button
      type="button"
      data-testid="sidebar-widget-toggle"
      onClick={toggleVisible}
      title={visible ? '隐藏桌面浮窗' : '显示桌面浮窗'}
      className={`relative flex w-full items-center gap-3 rounded-md py-2 pl-3 pr-2.5 text-body ui-transition ${
        visible
          ? 'bg-primary/[0.08] font-medium text-primary'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-primary transition-opacity duration-[var(--motion-fast)]',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      />
      <MonitorSmartphone className="h-4 w-4 shrink-0" />
      <span className="truncate">桌面浮窗</span>
      <span
        className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-micro ${
          visible ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-muted-foreground'
        }`}
      >
        {visible ? '显示中' : '已隐藏'}
      </span>
    </button>
  )
}
