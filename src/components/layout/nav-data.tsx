import {
  Calendar,
  CalendarClock,
  ListTodo,
  CheckSquare,
  ClipboardList,
  BarChart3,
  Settings,
  Inbox,
  Timer,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  id: 'flow' | 'record' | 'system'
  title: string
  items: NavItem[]
}

/**
 * 桌面侧边栏分组：主流程（每天真正在用的四件事）
 * → 记录（回看与统计）→ 系统（设置 / 收集箱）
 */
export const navGroups: NavGroup[] = [
  {
    id: 'flow',
    title: '主流程',
    items: [
      { href: '/schedule', label: '日程', icon: ListTodo },
      { href: '/calendar', label: '日历', icon: Calendar },
      { href: '/focus', label: '专注', icon: Timer },
      { href: '/habits', label: '习惯', icon: CheckSquare },
    ],
  },
  {
    id: 'record',
    title: '记录',
    items: [
      { href: '/reviews/today', label: '每日总结', icon: FileText },
      { href: '/reviews', label: '复盘', icon: ClipboardList },
      { href: '/insights', label: '统计', icon: BarChart3 },
    ],
  },
  {
    id: 'system',
    title: '系统',
    items: [
      { href: '/settings', label: '设置', icon: Settings },
      { href: '/inbox', label: '收集箱', icon: Inbox },
    ],
  },
]

// Mobile bottom nav: 5 main items + 「更多」抽屉，保证手机端能进到每一个页面
export const mobileNavItems: NavItem[] = [
  { href: '/schedule', label: '日程', icon: ListTodo },
  { href: '/calendar', label: '日历', icon: Calendar },
  { href: '/focus', label: '专注', icon: Timer },
  { href: '/habits', label: '习惯', icon: CheckSquare },
  { href: '/settings', label: '设置', icon: Settings },
]

/**
 * 手机底部导航放不下的页面。
 * 桌面有侧边栏能直达，手机如果没有这个入口，统计 / 复盘 / 每日总结
 * 就只能手打 URL 才能打开 —— 等于不存在。
 */
export const moreNavItems: NavItem[] = [
  { href: '/insights', label: '统计', icon: BarChart3 },
  { href: '/reviews', label: '复盘', icon: ClipboardList },
  { href: '/reviews/today', label: '每日总结', icon: FileText },
  { href: '/inbox', label: '收集箱', icon: Inbox },
  { href: '/countdowns', label: '倒数日', icon: CalendarClock },
]
