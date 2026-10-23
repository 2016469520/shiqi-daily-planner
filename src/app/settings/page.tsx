'use client'

import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { AppearancePanel } from '@/components/settings/appearance-panel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LogOut, Monitor, Bell, BellOff, BellRing, MonitorDown,
  Palette, CalendarDays, Timer, Database, User, Tag
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IS_LOCAL_ONLY, LOCAL_STORAGE_LABEL } from '@/lib/runtime'
import { TagManager } from '@/components/common/tag-manager'
import { BackupPanel } from '@/components/plans/backup-panel'
import { DesktopWidgetControl } from '@/components/layout/desktop-widget-control'
import { ReminderList } from '@/components/reminders/reminder-list'
import { TemplateManager } from '@/components/plans/template-manager'
import { OverdueProcessor } from '@/components/plans/overdue-processor'
import { ImportExportDialog } from '@/components/plans/import-export-dialog'
import { useNotifications } from '@/hooks/use-notifications'
import { usePwa } from '@/components/pwa/pwa-provider'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { useState } from 'react'
import type { CalendarView, WeekStartDay } from '@/types'
import { CALENDAR_VIEW_LABELS, WEEK_START_LABELS } from '@/lib/constants'

type SettingsSection = 'appearance' | 'calendar' | 'focus' | 'notifications' | 'tags' | 'data' | 'account'

const SECTION_ITEMS: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'appearance', label: '外观与个性化', icon: Palette },
  { id: 'calendar', label: '日历', icon: CalendarDays },
  { id: 'focus', label: '专注', icon: Timer },
  { id: 'notifications', label: '提醒', icon: Bell },
  { id: 'tags', label: '标签', icon: Tag },
  { id: 'data', label: '数据', icon: Database },
  { id: 'account', label: '账户', icon: User },
]

/** 设置区卡片：统一 surface + text-section 标题 + text-caption 描述 */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="surface p-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-section">{title}</h2>
          {description && (
            <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** 设置行：点击区高度至少 40 */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <Label className="text-body font-medium text-foreground">{label}</Label>
        {description && (
          <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, isDemoMode, signOut } = useAuth()
  const { users } = useRepos()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showImportExport, setShowImportExport] = useState(false)
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
  const {
    permission,
    requestPermission,
    isSupported: notifSupported,
  } = useNotifications()
  const { isInstallable, promptInstall } = usePwa()

  const { data: prefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => users.getPreferences(user!.id),
    enabled: !!user,
  })

  const upsertMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      users.upsertPreferences(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
    },
    onError: () => toast.error('保存失败'),
  })

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked && permission !== 'granted') {
      const state = await requestPermission()
      if (state === 'denied') {
        toast.error('通知权限被拒绝，请在浏览器设置中开启')
        return
      }
      if (state === 'unsupported') {
        toast.error('您的浏览器不支持通知功能')
        return
      }
      if (state === 'granted') {
        toast.success('通知已开启')
      }
    }
    upsertMutation.mutate({ notification_enabled: checked })
  }


  const handleCompactMode = (checked: boolean) => {
    upsertMutation.mutate({ compact_mode: checked })
  }

  const handleDefaultView = (view: string | null) => {
    if (!view) return
    upsertMutation.mutate({ default_calendar_view: view as CalendarView })
  }

  const handleWeekStart = (day: string | null) => {
    if (day === null) return
    upsertMutation.mutate({ week_starts_on: parseInt(day) as WeekStartDay })
  }

  const handleSignOut = async () => {
    await signOut()
    queryClient.clear()
    router.push('/login')
  }

  if (!user) return null

  const notificationEnabled = prefs?.notification_enabled ?? true
  const compactMode = prefs?.compact_mode ?? false
  const defaultView = prefs?.default_calendar_view || 'month'
  const weekStartsOn = prefs?.week_starts_on ?? 0
  const accountLabel = isDemoMode ? '本地演示模式' : (user.email ?? '')

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Desktop secondary nav */}
      <aside className="hidden w-56 shrink-0 flex-col border-b border-border bg-card/40 lg:flex lg:border-b-0 lg:border-r">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-display">设置</h1>
          <p className="mt-1 truncate text-caption text-muted-foreground" title={accountLabel}>
            {accountLabel}
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          <p className="px-3 pb-1 text-micro text-muted-foreground">设置分区</p>
          {SECTION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`relative flex w-full items-center gap-2.5 rounded-md py-2 pl-3 pr-2.5 text-body ui-transition ${
                activeSection === item.id
                  ? 'bg-primary/[0.08] font-medium text-primary'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              }`}
            >
              {activeSection === item.id && (
                <span
                  aria-hidden
                  className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-primary"
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile page header */}
      <div className="px-4 pt-6 pb-3 lg:hidden">
        <h1 className="text-display">设置</h1>
        <p className="mt-1 truncate text-caption text-muted-foreground" title={accountLabel}>
          {accountLabel}
        </p>
      </div>

      {/* Mobile section tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
        {SECTION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-caption ui-transition ${
              activeSection === item.id
                ? 'bg-primary font-medium text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
          {/* PWA Install — always visible at top */}
          {isInstallable && (
            <SectionCard
              icon={MonitorDown}
              title="安装应用"
              description="将应用安装到桌面或主屏幕，像原生 App 一样使用"
            >
              <Button
                className="h-8"
                onClick={() => { promptInstall(); toast.success('请在弹出的安装窗口中确认') }}
              >
                <MonitorDown className="mr-1.5 h-4 w-4" />添加到主屏幕
              </Button>
            </SectionCard>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <AppearancePanel />

              <SectionCard icon={Monitor} title="界面偏好" description="调整列表与页面的疏密">
                <SettingRow label="紧凑模式" description="使用更紧凑的界面布局">
                  <Switch checked={compactMode} onCheckedChange={handleCompactMode} />
                </SettingRow>
              </SectionCard>

              {/* 桌面浮窗开关（仅 Electron 打包版显示） */}
              <DesktopWidgetControl variant="card" />
            </div>
          )}

          {/* Calendar */}
          {activeSection === 'calendar' && (
            <SectionCard icon={CalendarDays} title="日历偏好" description="设置默认视图和每周起始日">
              <div className="space-y-2">
                <SettingRow label="默认视图">
                  <Select value={defaultView} onValueChange={handleDefaultView}>
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue placeholder="请选择">
                        {CALENDAR_VIEW_LABELS[defaultView as CalendarView] || defaultView}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CALENDAR_VIEW_LABELS) as [CalendarView, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="每周起始日">
                  <Select value={String(weekStartsOn)} onValueChange={handleWeekStart}>
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue placeholder="请选择">
                        {WEEK_START_LABELS[weekStartsOn as WeekStartDay] || String(weekStartsOn)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(WEEK_START_LABELS) as [string, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
            </SectionCard>
          )}

          {/* Focus */}
          {activeSection === 'focus' && (
            <SectionCard icon={Timer} title="专注设置" description="设置专注计时的默认参数">
              <p className="text-body text-muted-foreground">
                专注功能使用番茄钟计时法。默认专注时长为 25 分钟，
                短休息 5 分钟，长休息 15 分钟。可在专注页面中自定义每次时长。
              </p>
            </SectionCard>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <SectionCard icon={Bell} title="浏览器通知" description="管理通知权限与提醒方式">
                <SettingRow
                  label="通知开关"
                  description={
                    !notifSupported
                      ? '当前浏览器不支持通知'
                      : permission === 'granted'
                        ? '通知已开启'
                        : permission === 'denied'
                          ? '通知已被浏览器阻止'
                          : '点击开启通知权限'
                  }
                >
                  {permission === 'granted' ? (
                    <BellRing className="h-4 w-4 text-primary" />
                  ) : permission === 'denied' ? (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={notificationEnabled && permission === 'granted'}
                    onCheckedChange={handleNotificationToggle}
                    disabled={!notifSupported || permission === 'denied'}
                  />
                </SettingRow>
              </SectionCard>

              <section className="surface p-4">
                <ReminderList />
              </section>

              <section className="surface p-4">
                <OverdueProcessor />
              </section>
            </div>
          )}

          {/* Tags */}
          {activeSection === 'tags' && <TagManager />}

          {/* Data */}
          {activeSection === 'data' && (
            <div className="space-y-4">
              <BackupPanel />

              <section className="surface p-4">
                <TemplateManager />
              </section>

              <SectionCard icon={Download} title="导入导出事项" description="按事项导入 / 导出（CSV 或 JSON）">
                <Button variant="outline" className="h-8" onClick={() => setShowImportExport(true)}>
                  <Download className="mr-1.5 h-4 w-4" />导入 / 导出
                </Button>
              </SectionCard>
            </div>
          )}

          {/* Account */}
          {activeSection === 'account' && (
            <SectionCard
              icon={User}
              title="账户"
              description={
                IS_LOCAL_ONLY
                  ? `本地模式 — 数据保存在${LOCAL_STORAGE_LABEL}，不上传到任何服务器`
                  : isDemoMode
                    ? '本地演示模式 — 数据保存在浏览器中'
                    : `登录账号：${user.email}`
              }
            >
              {IS_LOCAL_ONLY ? (
                <div className="space-y-3">
                  <p className="text-body text-muted-foreground">
                    建议定期到「数据」里导出 JSON 备份；卸载应用或清除应用数据会导致记录丢失。
                  </p>
                  <Button variant="outline" className="h-8" onClick={() => setActiveSection('data')}>
                    <Database className="mr-1.5 h-4 w-4" />前往数据备份
                  </Button>
                </div>
              ) : (
                <Button variant="destructive" className="h-8" onClick={handleSignOut}>
                  <LogOut className="mr-1.5 h-4 w-4" />退出登录
                </Button>
              )}
            </SectionCard>
          )}

          <ImportExportDialog open={showImportExport} onOpenChange={setShowImportExport} />
        </div>
      </div>
    </div>
  )
}
