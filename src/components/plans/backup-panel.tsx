'use client'

import { useRef, useState, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Download, Upload, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { todayStr, format } from '@/lib/utils/date'
import {
  createBackup,
  countBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
  type BackupStats,
} from '@/lib/sync/backup'

function statsLines(stats: BackupStats): { label: string; value: number }[] {
  return [
    { label: '事项', value: stats.tasks },
    { label: '标签', value: stats.tags },
    { label: '习惯', value: stats.habits },
    { label: '打卡记录', value: stats.habit_logs },
    { label: '每日评价', value: stats.reviews },
    { label: '倒数日', value: stats.countdowns },
    { label: '模板', value: stats.templates },
    { label: '专注记录', value: stats.focus_sessions },
  ]
}

/**
 * 完整备份 / 恢复：把当前账号的全部数据导出成一个 JSON，
 * 换设备（Win ↔ 安卓）或重装前用它搬数据。
 */
export function BackupPanel() {
  const { user } = useAuth()
  const repos = useRepos()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [pending, setPending] = useState<BackupPayload | null>(null)

  const handleExport = useCallback(async () => {
    if (!user || exporting) return
    setExporting(true)
    try {
      const payload = await createBackup(repos, user.id)
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-calendar-backup-${todayStr()}-${format(new Date(), 'HHmm')}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      const stats = countBackup(payload)
      toast.success(`已导出备份（${stats.tasks} 个事项 / ${stats.habits} 个习惯）`)
    } catch {
      toast.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [user, repos, exporting])

  const handlePickFile = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      try {
        const text = await file.text()
        const payload = parseBackup(JSON.parse(text))
        setPending(payload)
      } catch (err) {
        const message = err instanceof Error ? err.message : '文件无法读取'
        toast.error(`备份文件无效：${message}`)
      }
    },
    []
  )

  const handleConfirmRestore = useCallback(async () => {
    if (!user || !pending || restoring) return
    setRestoring(true)
    try {
      const result = await restoreBackup(repos, user.id, pending)
      queryClient.invalidateQueries()
      const total = Object.values(result.restored).reduce((a, b) => a + b, 0)
      if (result.skipped > 0) {
        toast.warning(`已恢复 ${total} 条记录，${result.skipped} 条被跳过`)
      } else {
        toast.success(`已恢复 ${total} 条记录`)
      }
      setPending(null)
    } catch {
      toast.error('恢复失败，请重试')
    } finally {
      setRestoring(false)
    }
  }, [user, pending, restoring, repos, queryClient])

  const pendingStats = pending ? countBackup(pending) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-section">完整备份</CardTitle>
        <CardDescription className="text-caption text-muted-foreground">
          导出全部数据为 JSON（含事项、习惯、打卡、评价、倒数日、模板、专注记录），换设备或重装前先备份
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport} disabled={exporting} data-testid="backup-export">
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            导出完整备份
          </Button>
          <Button
            variant="outline"
            onClick={handlePickFile}
            disabled={restoring}
            data-testid="backup-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            从备份恢复
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          恢复是「补写」而不是覆盖：已有记录会保留，重复的评价按日期更新。
        </p>
      </CardContent>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section">确认恢复这份备份？</DialogTitle>
            <DialogDescription className="text-caption text-muted-foreground">
              {pending?.exported_at
                ? `备份时间：${format(new Date(pending.exported_at), 'yyyy年M月d日 HH:mm')}`
                : '备份文件没有记录导出时间'}
            </DialogDescription>
          </DialogHeader>

          {pendingStats && (
            <div className="grid grid-cols-2 gap-2">
              {statsLines(pendingStats).map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2"
                >
                  <span className="text-caption text-muted-foreground">{row.label}</span>
                  <span className="text-body tabular-nums font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
            建议先导出一份当前数据，避免恢复后重复记录不好清理。
          </p>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setPending(null)} disabled={restoring}>
              取消
            </Button>
            <Button onClick={handleConfirmRestore} disabled={restoring} data-testid="backup-restore-confirm">
              {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              恢复
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
