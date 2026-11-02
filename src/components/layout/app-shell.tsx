'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileNav } from './mobile-nav'
import { useAuth } from '@/providers/auth-provider'
import { useInitializeDefaultTags } from '@/hooks/use-default-tags'
import { useCrossWindowSync } from '@/hooks/use-cross-window-sync'
import { usePerformanceMode } from '@/hooks/use-performance-mode'
import { importScannedPacks, scanDesktopPacks, useLoadPacks } from '@/lib/atmosphere/character-packs'
import { useSeedBundledPacks } from '@/lib/atmosphere/bundled-packs'
import { SceneBackdrop } from '@/components/atmosphere/scene-backdrop'
import { CharacterCompanion } from '@/components/atmosphere/character-companion'
import { CelebrationLayer } from '@/components/atmosphere/celebration'
import { WelcomeOverlay } from '@/components/atmosphere/welcome-overlay'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isBareWindow = !!(pathname?.startsWith('/widget') || pathname?.startsWith('/pet'))

  useInitializeDefaultTags()
  // 掉帧时自动降级装饰效果（不影响功能）
  usePerformanceMode()
  // 本地角色包：任何页面都能取到（首页陪伴位、主视觉都要用）
  useLoadPacks()

  // 随包分发的角色包：首次启动自动装进本地，新用户开箱就有
  useSeedBundledPacks()

  // 桌面版：自动扫描 <userData>/characters，拷进去就能用
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const scanned = await scanDesktopPacks()
      if (cancelled || scanned.length === 0) return
      await importScannedPacks(scanned)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  // 主窗口与桌面浮窗同时打开时保持数据一致
  useCrossWindowSync()

  // Redirect to login if not authenticated and not already on login page
  useEffect(() => {
    if (isBareWindow) return
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login')
    }
  }, [isLoading, user, pathname, router, isBareWindow])

  // 浮窗是独立的无边框小窗，不套用侧边栏 / 底部导航
  if (isBareWindow) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="app-viewport flex items-center justify-center bg-background">
        <p className="text-body text-muted-foreground">加载中…</p>
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <>
      {/* 沉浸氛围：场景背景在最底层，内容整体抬到 z-10 */}
      <SceneBackdrop />

      <div className="app-viewport relative z-10 flex overflow-hidden">
        {/* Desktop sidebar */}
        <DesktopSidebar />

        {/* Main content area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* app-scroll：移动端顶部让开状态栏、底部让开导航与手势条（见 globals.css） */}
          <div className="app-scroll scroll-thin flex-1 overflow-y-auto lg:pb-0">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <MobileNav />
      </div>

      {/* 角色陪伴与庆祝层（固定定位，不占据布局） */}
      <CharacterCompanion />
      <CelebrationLayer />
      <WelcomeOverlay />
    </>
  )
}
