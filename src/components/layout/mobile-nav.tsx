'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mobileNavItems, moreNavItems } from './nav-data'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = moreNavItems.some((item) => pathname.startsWith(item.href))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex h-14 items-stretch justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 ui-transition',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* 选中态：顶部 2px 主色短线，与侧边栏指示条呼应 */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-0 h-[2px] w-8 rounded-full bg-primary transition-opacity duration-[var(--motion-fast)]',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <item.icon className={cn('h-5 w-5', isActive && 'scale-105')} />
                <span className="w-full truncate text-center text-micro leading-none">{item.label}</span>
              </Link>
            )
          })}

          {/* 更多：统计 / 复盘 / 每日总结 / 收集箱 / 倒数日，手机上没有它就进不去 */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={cn(
              'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 ui-transition',
              moreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-0 h-[2px] w-8 rounded-full bg-primary transition-opacity duration-[var(--motion-fast)]',
                moreActive ? 'opacity-100' : 'opacity-0'
              )}
            />
            <MoreHorizontal className="h-5 w-5" />
            <span className="w-full truncate text-center text-micro leading-none">更多</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-section">更多</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-2">
            {moreNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-body ui-transition',
                    isActive
                      ? 'border-primary/30 bg-primary/[0.06] text-primary'
                      : 'border-border bg-surface-2 text-foreground'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
