'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { enrichCountdown, sortCountdowns } from '@/lib/utils/countdown'
import { formatDisplayDate } from '@/lib/utils/date'
import type { Countdown } from '@/types'
import {
  Plus,
  Pin,
  PinOff,
  Archive,
  Trash2,
  Pencil,
  Target,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
const ICONS = ['Target', 'Star', 'Heart', 'GraduationCap', 'Briefcase', 'Plane', 'Gift', 'Calendar']

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'upcoming', label: '即将到来' },
  { value: 'past', label: '已过去' },
  { value: 'yearly', label: '每年重复' },
  { value: 'archived', label: '已归档' },
] as const

const DAYS_TONE = (days?: number) => {
  if (days === undefined) return 'text-muted-foreground'
  if (days < 0) return 'text-destructive'
  if (days <= 3) return 'text-warning'
  return 'text-foreground'
}

/** 开关胶囊：选中 acg-pill */
const togglePillClass = (active: boolean) =>
  cn(
    'h-8 rounded-full px-3 text-caption ui-transition',
    active
      ? 'acg-pill font-semibold'
      : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
  )

export default function CountdownsPage() {
  const { user } = useAuth()
  const { countdowns: cdRepo } = useRepos()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Countdown | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'yearly' | 'archived'>('all')

  // Form state
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isYearly, setIsYearly] = useState(false)
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState(ICONS[0])
  const [description, setDescription] = useState('')
  const [showOnHome, setShowOnHome] = useState(true)

  const { data: rawList = [] } = useQuery({
    queryKey: ['countdowns'],
    queryFn: async () => {
      const includeArchived = filter === 'archived'
      return cdRepo.list(user!.id, includeArchived)
    },
    enabled: !!user,
  })

  const enriched = rawList.map(enrichCountdown)

  const filtered = (() => {
    if (filter === 'archived') return enriched.filter((c) => c.archived_at)
    const active = enriched.filter((c) => !c.archived_at)
    if (filter === 'upcoming') return active.filter((c) => (c.days_remaining ?? 0) >= 0)
    if (filter === 'past') return active.filter((c) => (c.days_remaining ?? 0) < 0 && !c.is_yearly)
    if (filter === 'yearly') return active.filter((c) => c.is_yearly)
    return active
  })()

  const sorted = sortCountdowns(filtered)

  const resetForm = () => {
    setTitle('')
    setTargetDate('')
    setIsYearly(false)
    setColor(COLORS[0])
    setIcon(ICONS[0])
    setDescription('')
    setShowOnHome(true)
  }

  const startEdit = (c: Countdown) => {
    setEditingId(c.id)
    setTitle(c.title)
    setTargetDate(c.target_date)
    setIsYearly(c.is_yearly)
    setColor(c.color)
    setIcon(c.icon || ICONS[0])
    setDescription(c.description || '')
    setShowOnHome(c.show_on_home !== false)
  }

  const handleSave = useCallback(async () => {
    if (!title.trim() || !targetDate || !user) return
    try {
      if (editingId) {
        await cdRepo.update(user.id, editingId, {
          title: title.trim(),
          target_date: targetDate,
          is_yearly: isYearly,
          color,
          icon,
          description: description || undefined,
          show_on_home: showOnHome,
        } as Partial<Countdown>)
        toast.success('已更新')
        setEditingId(null)
      } else {
        await cdRepo.create(user.id, {
          title: title.trim(),
          target_date: targetDate,
          is_yearly: isYearly,
          color,
          icon,
          description: description || undefined,
          show_on_home: showOnHome,
          is_pinned: false,
          sort_order: rawList.length,
        })
        toast.success('已创建')
        setShowCreate(false)
      }
      queryClient.invalidateQueries({ queryKey: ['countdowns'] })
      resetForm()
    } catch {
      toast.error('保存失败')
    }
  }, [title, targetDate, isYearly, color, icon, description, showOnHome, editingId, user, cdRepo, queryClient, rawList.length])

  const handleTogglePin = useCallback(
    async (c: Countdown) => {
      try {
        await cdRepo.update(user!.id, c.id, { is_pinned: !c.is_pinned } as Partial<Countdown>)
        queryClient.invalidateQueries({ queryKey: ['countdowns'] })
      } catch {
        toast.error('操作失败')
      }
    },
    [user, cdRepo, queryClient]
  )

  const handleArchive = useCallback(
    async (c: Countdown) => {
      try {
        if (c.archived_at) {
          await cdRepo.unarchive(user!.id, c.id)
        } else {
          await cdRepo.archive(user!.id, c.id)
        }
        queryClient.invalidateQueries({ queryKey: ['countdowns'] })
      } catch {
        toast.error('操作失败')
      }
    },
    [user, cdRepo, queryClient]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !user) return
    try {
      await cdRepo.delete(user.id, deleteTarget.id)
      queryClient.invalidateQueries({ queryKey: ['countdowns'] })
      setDeleteTarget(null)
      toast.success('已删除')
    } catch {
      toast.error('删除失败')
    }
  }, [deleteTarget, user, cdRepo, queryClient])

  const formContent = (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-caption text-muted-foreground">标题</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="倒数日标题"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-caption text-muted-foreground">目标日期</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-caption text-muted-foreground">描述（可选）</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsYearly(!isYearly)}
          aria-pressed={isYearly}
          className={togglePillClass(isYearly)}
        >
          每年重复
        </button>
        <button
          type="button"
          onClick={() => setShowOnHome(!showOnHome)}
          aria-pressed={showOnHome}
          className={togglePillClass(showOnHome)}
        >
          显示在首页
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`选择颜色 ${c}`}
            aria-pressed={color === c}
            className={cn(
              'h-6 w-6 rounded-full border-2 ui-transition',
              color === c ? 'scale-110 border-foreground' : 'border-transparent'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setEditingId(null)
            setShowCreate(false)
            resetForm()
          }}
        >
          取消
        </Button>
        <Button onClick={handleSave} disabled={!title.trim() || !targetDate}>
          {editingId ? '保存修改' : '创建'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/schedule">
            <Button variant="ghost" size="icon" aria-label="返回">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="text-display">倒数日</h1>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              'h-7 shrink-0 rounded-full px-2.5 text-caption ui-transition',
              filter === f.value
                ? 'acg-pill font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Create/Edit form */}
      {(showCreate || editingId) && (
        <div className="surface p-4">
          {editingId && <h3 className="mb-3 text-section">编辑倒数日</h3>}
          {formContent}
        </div>
      )}

      {/* Countdown list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Target className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-body text-muted-foreground">暂无倒数日</p>
          <p className="text-caption text-muted-foreground/80">点击上方「新建」添加纪念日或目标</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((c) => (
            <div
              key={c.id}
              className={cn('surface surface-interactive p-4', c.archived_at && 'opacity-50')}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-medium">{c.title}</span>
                    {c.is_pinned && <Pin className="h-3 w-3 shrink-0 text-warning" aria-hidden="true" />}
                    {c.is_yearly && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-micro text-secondary-foreground">
                        每年
                      </span>
                    )}
                    {c.archived_at && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-micro text-muted-foreground">
                        已归档
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-caption tabular-nums text-muted-foreground">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {formatDisplayDate(c.is_yearly ? c.target_date : c.target_date)}
                  </div>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn('text-title tabular-nums', DAYS_TONE(c.days_remaining))}>
                    {c.days_remaining !== undefined ? Math.abs(c.days_remaining) : '—'}
                  </div>
                  <div className="text-micro text-muted-foreground">{c.display_text}</div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => startEdit(c)}
                    aria-label={`编辑 ${c.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => handleTogglePin(c)}
                    aria-label={c.is_pinned ? '取消置顶' : '置顶'}
                  >
                    {c.is_pinned ? (
                      <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => handleArchive(c)}
                    aria-label={c.archived_at ? '取消归档' : '归档'}
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(c)}
                    aria-label={`删除 ${c.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section">删除倒数日</DialogTitle>
            <DialogDescription className="text-caption text-muted-foreground">
              确定要删除「{deleteTarget?.title}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
