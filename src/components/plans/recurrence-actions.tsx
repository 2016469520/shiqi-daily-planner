'use client'

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
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Calendar, CalendarRange, List } from 'lucide-react'

export type RecurrenceActionScope = 'this' | 'future' | 'all'

interface RecurrenceActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (scope: RecurrenceActionScope) => void
  action: 'edit' | 'delete'
  title?: string
}

function ScopeOption({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface surface-interactive group flex w-full items-start gap-3 p-3 text-left"
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground ui-transition group-hover:text-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium">{title}</span>
        <span className="mt-0.5 block text-caption text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

export function RecurrenceActionDialog({
  open,
  onOpenChange,
  onSelect,
  action,
  title,
}: RecurrenceActionDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <ScopeOption
          icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
          title={action === 'edit' ? '仅修改本次' : '仅删除本次'}
          description={
            action === 'edit'
              ? '只修改这一个实例，其他重复事项不受影响'
              : '只删除这一个实例，其他重复事项保持不变'
          }
          onClick={() => {
            onSelect('this')
            onOpenChange(false)
          }}
        />

        <ScopeOption
          icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
          title={action === 'edit' ? '修改本次及以后' : '删除本次及以后'}
          description={
            action === 'edit'
              ? '从此实例开始应用修改，之前的事项保持不变'
              : '从此实例开始删除，之前的事项保持不变'
          }
          onClick={() => {
            onSelect('future')
            onOpenChange(false)
          }}
        />

        <ScopeOption
          icon={<List className="h-5 w-5" aria-hidden="true" />}
          title={action === 'edit' ? '修改整个系列' : '删除整个系列'}
          description={
            action === 'edit'
              ? '修改所有重复事项（包括过去和未来）'
              : '删除所有重复事项（包括过去和未来）'
          }
          onClick={() => {
            onSelect('all')
            onOpenChange(false)
          }}
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-caption text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          取消
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="shadow-[var(--shadow-pop)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section">
              {action === 'edit' ? '修改重复事项' : '删除重复事项'}
            </DialogTitle>
            <DialogDescription className="truncate text-caption text-muted-foreground">
              {title && `「${title}」是一个重复事项，请选择范围`}
              {!title && '请选择要应用的范围'}
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
          <DrawerTitle className="text-section">
            {action === 'edit' ? '修改重复事项' : '删除重复事项'}
          </DrawerTitle>
          <DrawerDescription className="text-caption text-muted-foreground">
            {title && `「${title}」是一个重复事项，请选择范围`}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
