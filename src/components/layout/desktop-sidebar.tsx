'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navGroups, type NavItem } from './nav-data'
import { DesktopWidgetControl } from './desktop-widget-control'
import { ImmersiveToggle } from './immersive-toggle'
import { APP_NAME } from '@/lib/constants'
import { CalendarDays } from 'lucide-react'

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-md py-2 pl-3 pr-2.5 ui-transition',
        isActive
          ? 'bg-primary/[0.08] font-medium text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {/* 选中态：左侧 3px 主色指示条 */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-primary transition-opacity duration-[var(--motion-fast)]',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
      />
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="text-body truncate">{item.label}</span>
    </Link>
  )
}

export function DesktopSidebar() {
  const pathname = usePathname()

  // 取最长匹配的导航项，避免 /reviews/today 同时点亮「复盘」
  const activeHref = navGroups
    .flatMap((group) => group.items.map((item) => item.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      {/* App branding */}
      <div className="px-3 pb-3 pt-4">
        <Link
          href="/calendar"
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 ui-transition hover:bg-accent"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-section">{APP_NAME}</span>
        </Link>
      </div>

      {/* Grouped navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-3 pb-1 text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={item.href === activeHref}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* 沉浸 / 纯净 快捷开关 */}
      <div className="border-t border-border p-2">
        <ImmersiveToggle />
      </div>

      {/* Desktop widget toggle — 底部固定，保持每次可点（网页端无 bridge 时整块隐藏） */}
      <div className="border-t border-border p-2 pt-3 empty:hidden">
        <DesktopWidgetControl />
      </div>
    </aside>
  )
}
