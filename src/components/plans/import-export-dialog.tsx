'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useRepos } from '@/providers/repo-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  downloadJson,
  downloadCsv,
  parseImportJson,
  readFileAsText,
  type ImportableTask,
} from '@/lib/utils/import-export'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { Task, Period } from '@/types'
import { todayStr } from '@/lib/utils/date'
import { PERIOD_CLASS } from '@/lib/period-style'

const PERIOD_LABELS: Record<Period, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}
interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { user } = useAuth()
  const { tasks } = useRepos()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importPreview, setImportPreview] = useState<ImportableTask[] | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const today = todayStr()

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await tasks.getByDate(user!.id, today)
      return result
    },
    enabled: !!user && open,
  })

  const handleExportJson = () => {
    downloadJson(allTasks, `tasks-${today}.json`)
    toast.success('JSON 已导出')
  }

  const handleExportCsv = () => {
    downloadCsv(allTasks, `tasks-${today}.csv`)
    toast.success('CSV 已导出')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await readFileAsText(file)
      const result = parseImportJson(text)

      setImportErrors(result.errors)
      setImportPreview(result.errors.length === 0 ? result.tasks : null)

      if (result.errors.length > 0) {
        toast.error(`JSON 验证失败：${result.errors.length} 个错误`)
      } else if (result.tasks.length === 0) {
        toast.info('JSON 中没有可导入的事项')
      } else {
        toast.success(`已解析 ${result.tasks.length} 个事项`)
      }
    } catch {
      toast.error('读取文件失败')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    if (!importPreview || importPreview.length === 0) return

    setImporting(true)
    let imported = 0
    let skipped = 0

    for (const item of importPreview) {
      try {
        await tasks.create(user!.id, {
          title: item.title,
          description: item.description,
          task_date: item.task_date ?? undefined,
          period: item.period || 'morning',
          start_time: item.start_time,
          end_time: item.end_time,
          priority: item.priority || 'normal',
          status: 'todo',
          tag_id: item.tag_id,
          estimated_minutes: item.estimated_minutes,
          recurrence_rule: item.recurrence_rule,
          order_index: 0,
        } as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
        imported++
      } catch {
        skipped++
      }
    }

    setImporting(false)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toast.success(`导入完成：${imported} 个成功，${skipped} 个跳过`)
    setImportPreview(null)
    setImportErrors([])
    onOpenChange(false)
  }

  const content = (
    <div className="space-y-4">
      {/* Export section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-section">导出事项</h3>
        </div>
        <p className="text-caption text-muted-foreground">
          将当前所有事项导出为文件，可用于备份或迁移
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleExportJson}
          >
            <FileJson className="h-4 w-4" aria-hidden="true" />
            JSON
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleExportCsv}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Import section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-section">导入事项</h3>
        </div>
        <p className="text-caption text-muted-foreground">
          从 JSON 文件导入事项（仅支持 JSON 格式）
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          id="import-file"
          aria-label="选择 JSON 备份文件"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          选择 JSON 文件
        </Button>

        {/* Import errors */}
        {importErrors.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-1.5 text-caption font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              验证错误
            </div>
            <ul className="list-inside list-disc space-y-0.5 text-micro text-muted-foreground">
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Import preview */}
        {importPreview && importPreview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="text-caption font-medium">预览</span>
              <span className="text-micro tabular-nums text-muted-foreground">
                {importPreview.length} 个事项
              </span>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {importPreview.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-1.5 text-body"
                >
                  <span className="w-5 shrink-0 text-micro tabular-nums text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.period && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-micro period-chip',
                        PERIOD_CLASS[item.period as Period]
                      )}
                    >
                      {PERIOD_LABELS[item.period as Period]}
                    </span>
                  )}
                </div>
              ))}
              {importPreview.length > 10 && (
                <p className="text-center text-micro text-muted-foreground">
                  还有 {importPreview.length - 10} 个未显示
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  导入中…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  确认导入 {importPreview.length} 个事项
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section">导入 / 导出</DialogTitle>
            <DialogDescription className="text-caption text-muted-foreground">
              导出事项备份或从 JSON 文件导入
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="shadow-[var(--shadow-pop)]">
        <DrawerHeader>
          <DrawerTitle className="text-section">导入 / 导出</DrawerTitle>
          <DrawerDescription className="text-caption text-muted-foreground">
            导出事项备份或从 JSON 文件导入
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
