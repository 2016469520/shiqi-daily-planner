'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { mobileNavItems } from './nav-data'

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-3 ui-transition',
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
      </div>
    </nav>
  )
}
